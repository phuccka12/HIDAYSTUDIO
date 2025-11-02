// ...existing code...
import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  task_type: { type: String },
  prompt: { type: String },
  content: { type: String },

  // AI grading (IELTS bands)
  ai_score: { type: Number }, // overall band (0-9, can be .5)
  ai_criteria: {
    task_response: { type: Number }, // band per criterion
    coherence: { type: Number },
    lexical: { type: Number },
    grammar: { type: Number }
  },
  ai_feedback: { type: [String], default: [] }, // bullet feedback
  ai_corrections: { type: String }, // optional suggested corrections/rewrite
  ai_corrected: { type: String }, // corrected/edited student answer (if provided by grader)
  ai_confidence: { type: mongoose.Schema.Types.Mixed }, // optional confidence object from LLM
  ai_raw: { type: mongoose.Schema.Types.Mixed }, // raw LLM output for audit
  graded_by: { type: String }, // e.g. 'claude-sonnet-4.5'
  graded_at: { type: Date },

  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Submission', SubmissionSchema);
// ...existing code...