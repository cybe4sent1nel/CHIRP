import { WebSocketServer } from 'ws';
import SketchRoom from '../models/SketchRoom.js';
import { getRandomWord, createWordHint } from '../controllers/gameController.js';

const rooms = new Map(); // roomId -> Set of WebSocket connections

export const setupGameWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/api/games/sketch/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    let currentRoomId = null;
    let userId = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_room':
            await handleJoinRoom(ws, message, wss);
            currentRoomId = message.room_id;
            userId = message.user_id;
            break;
            
          case 'start_game':
            await handleStartGame(message, wss);
            break;
            
          case 'draw':
            broadcastToRoom(message.room_id, message, wss, ws);
            await saveCanvasData(message.room_id, message.data);
            break;
            
          case 'clear_canvas':
            broadcastToRoom(message.room_id, message, wss, ws);
            await clearCanvasData(message.room_id);
            break;
            
          case 'guess':
            await handleGuess(message, wss, ws);
            break;
            
          case 'nudge':
            await handleNudge(message, wss, ws);
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      
      if (currentRoomId && userId) {
        await handlePlayerLeave(currentRoomId, userId, wss);
      }
    });
  });

  console.log('Game WebSocket server ready on /api/games/sketch/ws');
};

// Handle player joining room
async function handleJoinRoom(ws, message, wss) {
  const { room_id, user_id } = message;
  
  // Add connection to room
  if (!rooms.has(room_id)) {
    rooms.set(room_id, new Map());
  }
  rooms.get(room_id).set(user_id, ws);
  
  // Get room data
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room not found'
    }));
    return;
  }
  
  // Send room state to new player
  ws.send(JSON.stringify({
    type: 'room_state',
    room: {
      room_id: room.room_id,
      host_id: room.host_id,
      players: room.players,
      status: room.status,
      current_round: room.current_round,
      rounds: room.rounds,
      draw_time: room.draw_time,
      current_drawer_id: room.current_drawer_id,
      word_hint: room.word_hint,
      canvas_data: room.canvas_data
    }
  }));
  
  // Notify others about new player
  const player = room.players.find(p => p.user_id === user_id);
  broadcastToRoom(room_id, {
    type: 'player_joined',
    player: player
  }, wss);
}

// Handle game start
async function handleStartGame(message, wss) {
  const { room_id } = message;
  
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room || room.players.length < 2) {
    return;
  }
  
  // Initialize game
  room.status = 'playing';
  room.current_round = 1;
  room.words_used = [];
  
  // Reset player scores
  room.players.forEach(p => {
    p.score = 0;
    p.has_guessed = false;
  });
  
  await room.save();
  
  // Start first turn
  await startNewTurn(room_id, wss);
}

// Start new turn
async function startNewTurn(room_id, wss) {
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room) return;
  
  // Find next drawer
  const currentDrawerIndex = room.current_drawer_id 
    ? room.players.findIndex(p => p.user_id === room.current_drawer_id)
    : -1;
  
  const nextDrawerIndex = (currentDrawerIndex + 1) % room.players.length;
  const nextDrawer = room.players[nextDrawerIndex];
  
  // If completed a full round
  if (nextDrawerIndex === 0 && room.current_drawer_id) {
    room.current_round += 1;
    
    // Check if game is over
    if (room.current_round > room.rounds) {
      await endGame(room_id, wss);
      return;
    }
  }
  
  // Select random word
  const word = getRandomWord('medium');
  const hint = createWordHint(word);
  
  // Update room
  room.current_word = word;
  room.word_hint = hint;
  room.current_drawer_id = nextDrawer.user_id;
  room.turn_start_time = new Date();
  room.canvas_data = [];
  
  // Reset player guessed status
  room.players.forEach(p => {
    p.is_drawing = p.user_id === nextDrawer.user_id;
    p.has_guessed = false;
  });
  
  await room.save();
  
  // Notify all players
  broadcastToRoom(room_id, {
    type: 'turn_started',
    drawer_id: nextDrawer.user_id,
    word_hint: hint,
    round: room.current_round,
    max_rounds: room.rounds,
    draw_time: room.draw_time
  }, wss);
  
  // Send word to drawer
  const drawerWs = rooms.get(room_id)?.get(nextDrawer.user_id);
  if (drawerWs && drawerWs.readyState === 1) {
    drawerWs.send(JSON.stringify({
      type: 'your_word',
      word: word
    }));
  }
  
  // Start timer
  startTurnTimer(room_id, room.draw_time, wss);
}

// Timer for each turn
function startTurnTimer(room_id, duration, wss) {
  let timeLeft = duration;
  
  const timerInterval = setInterval(async () => {
    timeLeft -= 1;
    
    // Broadcast time
    broadcastToRoom(room_id, {
      type: 'timer',
      time_left: timeLeft
    }, wss);
    
    // End turn when time's up
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      await endTurn(room_id, wss);
    }
  }, 1000);
}

// End current turn
async function endTurn(room_id, wss) {
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room) return;
  
  // Notify players
  broadcastToRoom(room_id, {
    type: 'turn_ended',
    word: room.current_word,
    scores: room.players.map(p => ({
      user_id: p.user_id,
      score: p.score
    }))
  }, wss);
  
  // Wait 3 seconds before next turn
  setTimeout(() => {
    startNewTurn(room_id, wss);
  }, 3000);
}

// End game
async function endGame(room_id, wss) {
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room) return;
  
  room.status = 'ended';
  await room.save();
  
  // Calculate winner
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  
  broadcastToRoom(room_id, {
    type: 'game_ended',
    final_scores: sortedPlayers.map(p => ({
      user_id: p.user_id,
      full_name: p.full_name,
      profile_picture: p.profile_picture,
      score: p.score
    })),
    winner: sortedPlayers[0]
  }, wss);
}

// Handle player guess
async function handleGuess(message, wss, senderWs) {
  const { room_id, user_id, guess } = message;
  
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room || room.status !== 'playing') return;
  
  const player = room.players.find(p => p.user_id === user_id);
  
  if (!player || player.is_drawing || player.has_guessed) {
    return;
  }
  
  // Broadcast guess to all players
  broadcastToRoom(room_id, {
    type: 'guess',
    user_id: user_id,
    full_name: player.full_name,
    guess: guess
  }, wss);
  
  // Check if correct
  if (guess.toLowerCase().trim() === room.current_word.toLowerCase()) {
    player.has_guessed = true;
    
    // Calculate points (based on time and order)
    const timePassed = (Date.now() - room.turn_start_time) / 1000;
    const timeBonus = Math.max(0, room.draw_time - timePassed);
    const correctCount = room.players.filter(p => p.has_guessed).length;
    const orderBonus = (room.players.length - correctCount) * 50;
    
    const points = Math.round(100 + timeBonus * 2 + orderBonus);
    player.score += points;
    
    // Drawer also gets points
    const drawer = room.players.find(p => p.is_drawing);
    if (drawer) {
      drawer.score += 50;
    }
    
    await room.save();
    
    // Notify correct guess
    broadcastToRoom(room_id, {
      type: 'correct_guess',
      user_id: user_id,
      full_name: player.full_name,
      points: points,
      scores: room.players.map(p => ({
        user_id: p.user_id,
        score: p.score
      }))
    }, wss);
    
    // Check if all players guessed
    const allGuessed = room.players
      .filter(p => !p.is_drawing)
      .every(p => p.has_guessed);
    
    if (allGuessed) {
      await endTurn(room_id, wss);
    }
  }
}

// Handle nudge
async function handleNudge(message, wss, senderWs) {
  const { room_id, target_id, from } = message;
  
  const targetWs = rooms.get(room_id)?.get(target_id);
  
  if (targetWs && targetWs.readyState === 1) {
    targetWs.send(JSON.stringify({
      type: 'nudge',
      from: from,
      target_id: target_id
    }));
  }
}

// Handle player leaving
async function handlePlayerLeave(room_id, user_id, wss) {
  const room = await SketchRoom.findOne({ room_id });
  
  if (!room) return;
  
  // Remove player
  const playerIndex = room.players.findIndex(p => p.user_id === user_id);
  if (playerIndex !== -1) {
    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    
    // If no players left, delete room
    if (room.players.length === 0) {
      await SketchRoom.deleteOne({ room_id });
      rooms.delete(room_id);
      return;
    }
    
    // If drawer left, end turn
    if (player.is_drawing && room.status === 'playing') {
      await endTurn(room_id, wss);
    }
    
    // Transfer host if needed
    if (room.host_id === user_id) {
      room.host_id = room.players[0].user_id;
    }
    
    await room.save();
    
    // Notify others
    broadcastToRoom(room_id, {
      type: 'player_left',
      user_id: user_id,
      players: room.players
    }, wss);
  }
  
  // Remove from rooms map
  rooms.get(room_id)?.delete(user_id);
}

// Save canvas data
async function saveCanvasData(room_id, canvasData) {
  try {
    const room = await SketchRoom.findOne({ room_id });
    if (room) {
      room.canvas_data = canvasData;
      await room.save();
    }
  } catch (error) {
    console.error('Save canvas data error:', error);
  }
}

// Clear canvas data
async function clearCanvasData(room_id) {
  try {
    const room = await SketchRoom.findOne({ room_id });
    if (room) {
      room.canvas_data = [];
      await room.save();
    }
  } catch (error) {
    console.error('Clear canvas data error:', error);
  }
}

// Broadcast message to all players in room
function broadcastToRoom(room_id, message, wss, excludeWs = null) {
  const roomConnections = rooms.get(room_id);
  
  if (!roomConnections) return;
  
  const messageStr = JSON.stringify(message);
  
  roomConnections.forEach((ws, userId) => {
    if (ws !== excludeWs && ws.readyState === 1) {
      ws.send(messageStr);
    }
  });
}
