import mongoose from 'mongoose';

const gameStatsSchema = new mongoose.Schema({
  user_id: {
    type: String,
    ref: 'User',
    required: true,
    unique: true
  },
  total_games: {
    type: Number,
    default: 0
  },
  total_wins: {
    type: Number,
    default: 0
  },
  total_points: {
    type: Number,
    default: 0
  },
  current_streak: {
    type: Number,
    default: 0
  },
  longest_streak: {
    type: Number,
    default: 0
  },
  last_played: {
    type: Date
  },
  average_time: {
    type: Number,
    default: 0
  },
  games_breakdown: {
    type: Map,
    of: {
      played: { type: Number, default: 0 },
      points: { type: Number, default: 0 }
    },
    default: {}
  }
}, {
  timestamps: true
});

// Index for leaderboard queries
gameStatsSchema.index({ total_points: -1 });
gameStatsSchema.index({ current_streak: -1 });

const GameStats = mongoose.model('GameStats', gameStatsSchema);

export default GameStats;
