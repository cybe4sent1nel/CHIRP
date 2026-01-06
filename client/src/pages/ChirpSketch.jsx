import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Palette, Users, Clock, Trophy, Send, Eraser, 
  Undo, RotateCcw, Copy, Settings, Crown, Flame,
  Target, MessageCircle, Bell, Share2, Home
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChirpSketch = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const user = useSelector((state) => state.user.value);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush');
  
  // Game state
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [wordHint, setWordHint] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [isDrawer, setIsDrawer] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, ended
  const [messages, setMessages] = useState([]);
  const [guessInput, setGuessInput] = useState('');
  const [canGuess, setCanGuess] = useState(true);

  // WebSocket connection
  const wsRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      joinRoom();
    } else {
      // Show room creation/join UI
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  const createRoom = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post('/api/games/sketch/create-room', {
        max_players: 8,
        rounds: 3,
        draw_time: 80
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        navigate(`/chirpplay/sketch/${data.room.room_id}`);
        toast.success('Room created!');
      }
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const joinRoom = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(`/api/games/sketch/join-room/${roomId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setRoom(data.room);
        connectWebSocket(token);
      }
    } catch (error) {
      toast.error('Failed to join room');
      navigate('/chirpplay');
    }
  };

  const connectWebSocket = (token) => {
    const ws = new WebSocket(`ws://localhost:5000/api/games/sketch/ws/${roomId}?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'player_joined':
        setPlayers(message.players);
        addSystemMessage(`${message.player.full_name} joined the game`);
        break;
      case 'player_left':
        setPlayers(message.players);
        addSystemMessage(`${message.player.full_name} left the game`);
        break;
      case 'game_started':
        setGameStatus('playing');
        setRound(message.round);
        addSystemMessage('Game started!');
        break;
      case 'turn_started':
        setCurrentWord(message.word || '');
        setWordHint(message.hint);
        setIsDrawer(message.drawer_id === user._id);
        setTimeLeft(message.time);
        setCanGuess(true);
        if (message.drawer_id === user._id) {
          toast.success(`Your turn! Draw: ${message.word}`);
        }
        break;
      case 'draw':
        drawFromData(message.data);
        break;
      case 'clear_canvas':
        clearCanvas();
        break;
      case 'guess':
        addMessage(message.player, message.guess, false);
        break;
      case 'correct_guess':
        addMessage(message.player, message.guess, true);
        if (message.player.user_id === user._id) {
          setCanGuess(false);
          toast.success('Correct! 🎉');
        }
        break;
      case 'turn_ended':
        addSystemMessage(`The word was: ${message.word}`);
        setPlayers(message.players);
        break;
      case 'game_ended':
        setGameStatus('ended');
        setPlayers(message.players);
        break;
      case 'nudge':
        if (message.target_id === user._id) {
          toast(`${message.from.full_name} nudged you! 👋`, {
            icon: '👋',
            duration: 2000
          });
        }
        break;
      case 'timer':
        setTimeLeft(message.time);
        break;
    }
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { type: 'system', text, timestamp: Date.now() }]);
  };

  const addMessage = (player, text, isCorrect) => {
    setMessages(prev => [...prev, { 
      type: 'player', 
      player, 
      text, 
      isCorrect,
      timestamp: Date.now() 
    }]);
  };

  // Canvas drawing functions
  const startDrawing = (e) => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    sendDrawData({ type: 'start', x, y, color, size: brushSize, tool });
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    
    sendDrawData({ type: 'draw', x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    sendDrawData({ type: 'end' });
  };

  const sendDrawData = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'draw',
        data: { ...data, color, size: brushSize, tool }
      }));
    }
  };

  const drawFromData = (data) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (data.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
    } else if (data.type === 'draw') {
      ctx.strokeStyle = data.tool === 'eraser' ? '#FFFFFF' : data.color;
      ctx.lineWidth = data.tool === 'eraser' ? data.size * 2 : data.size;
      ctx.lineCap = 'round';
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearCanvas = () => {
    if (!isDrawer) return;
    clearCanvas();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear_canvas' }));
    }
  };

  const sendGuess = () => {
    if (!guessInput.trim() || !canGuess || isDrawer) return;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'guess',
        guess: guessInput.trim()
      }));
      setGuessInput('');
    }
  };

  const sendNudge = (playerId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'nudge',
        target_id: playerId
      }));
      toast.success('Nudge sent! 👋');
    }
  };

  const startGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  };

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#00FF7F', '#FFD700'
  ];

  // If no room, show room creation/join UI
  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
              <Palette className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">ChirpSketch</h1>
            <p className="text-gray-600">Draw, guess, and have fun with friends!</p>
            <p className="text-sm text-gray-500 mt-2">Developed by Fahad Khan</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={createRoom}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Create Room
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Room Code"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/chirpplay/sketch/${e.target.value.trim()}`);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter Room Code"]');
                  if (input.value.trim()) {
                    navigate(`/chirpplay/sketch/${input.value.trim()}`);
                  }
                }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Join Room
              </button>
            </div>

            <button
              onClick={() => navigate('/chirpplay')}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to ChirpPlay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chirpplay')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">ChirpSketch</h1>
            </div>
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
              Room: {roomId}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-bold">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Round {round}/{maxRounds}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                toast.success('Room code copied!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Players */}
        <div className="w-64 bg-white border-r-2 border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players ({players.length}/8)
              </h2>
            </div>

            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.user_id}
                  className={`p-3 rounded-xl ${
                    player.is_drawing 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={player.profile_picture || '/default-avatar.png'}
                        alt={player.full_name}
                        className="w-10 h-10 rounded-full border-2 border-white shadow"
                      />
                      {player.is_drawing && (
                        <div className="absolute -top-1 -right-1 p-1 bg-purple-600 rounded-full">
                          <Palette className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                        {player.full_name}
                        {player.current_streak >= 3 && (
                          <Flame className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Trophy className="w-3 h-3" />
                        {player.score} pts
                      </div>
                    </div>

                    {player.user_id !== user._id && gameStatus === 'playing' && (
                      <button
                        onClick={() => sendNudge(player.user_id)}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Nudge player"
                      >
                        <Bell className="w-4 h-4 text-purple-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {gameStatus === 'waiting' && players.length >= 2 && (
              <button
                onClick={startGame}
                className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Start Game
              </button>
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {gameStatus === 'waiting' && (
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600">Waiting for players...</p>
              <p className="text-gray-500 mt-2">Need at least 2 players to start</p>
            </div>
          )}

          {gameStatus !== 'waiting' && (
            <div className="space-y-4 w-full max-w-4xl">
              {/* Word Hint */}
              <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                <div className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                  {isDrawer ? (
                    <span>Draw: <span className="text-purple-600">{currentWord}</span></span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {wordHint}
                      <Target className="w-5 h-5 text-gray-400" />
                    </span>
                  )}
                </div>
              </div>

              {/* Canvas */}
              <div className="relative bg-white rounded-2xl p-4 shadow-2xl">
                {isDrawer && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold shadow-lg">
                    Your Turn!
                  </div>
                )}
                
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="border-2 border-gray-200 rounded-xl cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />

                {/* Drawing Tools */}
                {isDrawer && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTool('brush')}
                          className={`p-3 rounded-lg transition-all ${
                            tool === 'brush' 
                              ? 'bg-purple-600 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Palette className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setTool('eraser')}
                          className={`p-3 rounded-lg transition-all ${
                            tool === 'eraser' 
                              ? 'bg-purple-600 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Eraser className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleClearCanvas}
                          className="p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 flex items-center gap-4">
                        <span className="text-sm text-gray-600 font-medium">Size:</span>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={brushSize}
                          onChange={(e) => setBrushSize(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-semibold text-gray-700 w-8">{brushSize}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            color === c ? 'border-purple-600 scale-110 shadow-lg' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat */}
        <div className="w-80 bg-white border-l-2 border-gray-200 flex flex-col">
          <div className="p-4 border-b-2 border-gray-200">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={index}>
                {msg.type === 'system' ? (
                  <div className="text-center text-sm text-gray-500 italic">
                    {msg.text}
                  </div>
                ) : (
                  <div className={`${msg.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'} rounded-lg p-3`}>
                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      {msg.player.full_name}
                      {msg.isCorrect && <Trophy className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className={`text-sm ${msg.isCorrect ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isDrawer && canGuess && gameStatus === 'playing' && (
            <div className="p-4 border-t-2 border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendGuess()}
                  placeholder="Type your guess..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                />
                <button
                  onClick={sendGuess}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {!canGuess && gameStatus === 'playing' && (
            <div className="p-4 border-t-2 border-gray-200 text-center text-green-600 font-semibold">
              ✓ You guessed correctly!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChirpSketch;
