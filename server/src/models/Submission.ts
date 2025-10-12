import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  task_type: { type: String },
  prompt: { type: String },
  content: { type: String },
  ai_score: { type: Number },
  ai_feedback: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Submission', SubmissionSchema);
