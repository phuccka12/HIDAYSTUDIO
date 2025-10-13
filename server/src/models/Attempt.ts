import mongoose from 'mongoose';

const { Schema } = mongoose;

const AnswerSchema = new Schema({
  questionId: { type: String, required: true },
  answer: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const AttemptSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  submittedAt: { type: Date },
  status: { type: String, enum: ['in_progress','submitted','graded'], default: 'in_progress' },
  answers: { type: [AnswerSchema], default: [] },
  // optional persisted randomized order of question ids
  order: { type: [String], default: [] },
  score: { type: Number },
  details: { type: Schema.Types.Mixed },
  meta: { type: Schema.Types.Mixed },
  version: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('Attempt', AttemptSchema);
