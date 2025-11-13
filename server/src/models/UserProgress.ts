import mongoose from 'mongoose';

interface UserProgress {
  user_id: mongoose.Types.ObjectId;
  skill_type: 'listening' | 'reading' | 'writing' | 'speaking';
  current_level: number;
  target_score: number;
  completed_exercises: number;
  created_at: Date;
  updated_at: Date;
}

const userProgressSchema = new mongoose.Schema<UserProgress>({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill_type: { 
    type: String, 
    enum: ['listening', 'reading', 'writing', 'speaking'], 
    required: true 
  },
  current_level: { type: Number, default: 0, min: 0, max: 9 },
  target_score: { type: Number, default: 6.5, min: 0, max: 9 },
  completed_exercises: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Compound index to ensure one progress record per user per skill
userProgressSchema.index({ user_id: 1, skill_type: 1 }, { unique: true });

const UserProgress = mongoose.model<UserProgress>('UserProgress', userProgressSchema);

export default UserProgress;