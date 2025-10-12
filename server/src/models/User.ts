import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  full_name: { type: String },
  // Fields for password reset flow
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
  role: { type: String, default: 'user' },
  avatar_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
