import mongoose from 'mongoose';

const sketchRoomSchema = new mongoose.Schema({
  room_id: {
    type: String,
    required: true,
    unique: true
  },
  host_id: {
    type: String,
    ref: 'User',
    required: true
  },
  max_players: {
    type: Number,
    default: 8,
    min: 2,
    max: 12
  },
  rounds: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  draw_time: {
    type: Number,
    default: 80,
    min: 30,
    max: 180
  },
  current_round: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'ended'],
    default: 'waiting'
  },
  players: [{
    user_id: { type: String, ref: 'User' },
    full_name: String,
    profile_picture: String,
    score: { type: Number, default: 0 },
    is_drawing: { type: Boolean, default: false },
    has_guessed: { type: Boolean, default: false },
    current_streak: { type: Number, default: 0 },
    joined_at: { type: Date, default: Date.now }
  }],
  current_word: String,
  word_hint: String,
  current_drawer_id: String,
  turn_start_time: Date,
  words_used: [String],
  canvas_data: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  }
}, {
  timestamps: true
});

// TTL index to auto-delete old rooms after 24 hours
sketchRoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const SketchRoom = mongoose.model('SketchRoom', sketchRoomSchema);

export default SketchRoom;
