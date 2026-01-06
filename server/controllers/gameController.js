import GameStats from '../models/GameStats.js';
import SketchRoom from '../models/SketchRoom.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load word list
let wordList = { easy: [], medium: [], hard: [] };
try {
  const wordsPath = path.join(__dirname, '../data/words.json');
  wordList = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load word list:', error);
}

// Get player stats
export const getPlayerStats = async (req, res) => {
  try {
    const { userId } = req.auth();
    
    let stats = await GameStats.findOne({ user_id: userId });
    
    // Create stats if not exists
    if (!stats) {
      stats = await GameStats.create({
        user_id: userId,
        total_games: 0,
        total_wins: 0,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0
      });
    }
    
    // Calculate global rank
    const higherRankedCount = await GameStats.countDocuments({
      total_points: { $gt: stats.total_points }
    });
    const rank = higherRankedCount + 1;
    
    res.status(200).json({
      success: true,
      stats: {
        total_points: stats.total_points,
        total_wins: stats.total_wins,
        total_games: stats.total_games,
        current_streak: stats.current_streak,
        longest_streak: stats.longest_streak,
        rank: rank,
        games_breakdown: stats.games_breakdown
      }
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player stats'
    });
  }
};

// Get global leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'points'; // points, wins, streak
    
    let sortField = {};
    if (type === 'points') sortField = { total_points: -1 };
    else if (type === 'wins') sortField = { total_wins: -1 };
    else if (type === 'streak') sortField = { current_streak: -1 };
    
    const leaderboard = await GameStats.find()
      .sort(sortField)
      .limit(limit)
      .lean();
    
    // Populate user details
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (stat, index) => {
        const user = await User.findOne({ clerk_id: stat.user_id })
          .select('full_name profile_picture username')
          .lean();
        
        return {
          rank: index + 1,
          user_id: stat.user_id,
          full_name: user?.full_name || 'Unknown',
          profile_picture: user?.profile_picture || '',
          username: user?.username || '',
          total_points: stat.total_points,
          total_wins: stat.total_wins,
          current_streak: stat.current_streak,
          total_games: stat.total_games,
          average_time: stat.average_time || 0
        };
      })
    );
    
    res.status(200).json({
      success: true,
      leaderboard: leaderboardWithUsers
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};

// Create ChirpSketch room
export const createSketchRoom = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { max_players, rounds, draw_time } = req.body;
    
    // Get user details
    const user = await User.findOne({ clerk_id: userId })
      .select('full_name profile_picture')
      .lean();
    
    // Generate unique room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create room
    const room = await SketchRoom.create({
      room_id: roomId,
      host_id: userId,
      max_players: max_players || 8,
      rounds: rounds || 3,
      draw_time: draw_time || 80,
      players: [{
        user_id: userId,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        score: 0,
        is_drawing: false,
        has_guessed: false,
        current_streak: 0
      }]
    });
    
    res.status(201).json({
      success: true,
      room: {
        room_id: room.room_id,
        host_id: room.host_id,
        max_players: room.max_players,
        rounds: room.rounds,
        draw_time: room.draw_time
      }
    });
  } catch (error) {
    console.error('Create sketch room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

// Join ChirpSketch room
export const joinSketchRoom = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { roomId } = req.params;
    
    // Get room
    const room = await SketchRoom.findOne({ room_id: roomId });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if room is full
    if (room.players.length >= room.max_players) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }
    
    // Check if already in room
    const isInRoom = room.players.some(p => p.user_id === userId);
    if (isInRoom) {
      return res.status(200).json({
        success: true,
        room: {
          room_id: room.room_id,
          host_id: room.host_id,
          max_players: room.max_players,
          rounds: room.rounds,
          draw_time: room.draw_time,
          players: room.players,
          status: room.status
        }
      });
    }
    
    // Get user details
    const user = await User.findOne({ clerk_id: userId })
      .select('full_name profile_picture')
      .lean();
    
    // Get player streak
    const stats = await GameStats.findOne({ user_id: userId });
    
    // Add player to room
    room.players.push({
      user_id: userId,
      full_name: user.full_name,
      profile_picture: user.profile_picture,
      score: 0,
      is_drawing: false,
      has_guessed: false,
      current_streak: stats?.current_streak || 0
    });
    
    await room.save();
    
    res.status(200).json({
      success: true,
      room: {
        room_id: room.room_id,
        host_id: room.host_id,
        max_players: room.max_players,
        rounds: room.rounds,
        draw_time: room.draw_time,
        players: room.players,
        status: room.status
      }
    });
  } catch (error) {
    console.error('Join sketch room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
};

// Get room details
export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await SketchRoom.findOne({ room_id: roomId });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      room: {
        room_id: room.room_id,
        host_id: room.host_id,
        max_players: room.max_players,
        rounds: room.rounds,
        draw_time: room.draw_time,
        current_round: room.current_round,
        status: room.status,
        players: room.players,
        current_drawer_id: room.current_drawer_id,
        word_hint: room.word_hint
      }
    });
  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room details'
    });
  }
};

// Update player stats after game
export const updatePlayerStats = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { gameType, points, timeTaken, metadata } = req.body;
    
    let stats = await GameStats.findOne({ user_id: userId });
    
    if (!stats) {
      stats = await GameStats.create({
        user_id: userId
      });
    }
    
    // Update total stats
    stats.total_games += 1;
    stats.total_points += points || 0;
    
    // Calculate average time
    if (timeTaken) {
      const currentAvgTime = stats.average_time || 0;
      const totalGames = stats.total_games;
      stats.average_time = Math.round((currentAvgTime * (totalGames - 1) + timeTaken) / totalGames);
    }
    
    // Update streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastPlayed = stats.last_played ? new Date(stats.last_played).setHours(0, 0, 0, 0) : null;
    
    if (!lastPlayed) {
      stats.current_streak = 1;
    } else {
      const daysDiff = (today - lastPlayed) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === 1) {
        stats.current_streak += 1;
      } else if (daysDiff > 1) {
        stats.current_streak = 1;
      }
    }
    
    stats.longest_streak = Math.max(stats.longest_streak, stats.current_streak);
    stats.last_played = new Date();
    
    // Update game-specific stats
    const gameKey = gameType || 'other';
    if (!stats.games_breakdown[gameKey]) {
      stats.games_breakdown[gameKey] = { played: 0, points: 0 };
    }
    stats.games_breakdown[gameKey].played += 1;
    stats.games_breakdown[gameKey].points += points || 0;
    
    await stats.save();
    
    res.status(200).json({
      success: true,
      stats: {
        total_points: stats.total_points,
        total_wins: stats.total_wins,
        current_streak: stats.current_streak
      }
    });
  } catch (error) {
    console.error('Update player stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stats'
    });
  }
};

// Helper function to get random word
export const getRandomWord = (difficulty = 'medium') => {
  const words = wordList[difficulty] || wordList.medium;
  return words[Math.floor(Math.random() * words.length)];
};

// Helper function to create word hint
export const createWordHint = (word) => {
  return word.split('').map((char, index) => {
    if (char === ' ') return ' ';
    if (index === 0) return char; // Show first letter
    return '_';
  }).join(' ');
};
