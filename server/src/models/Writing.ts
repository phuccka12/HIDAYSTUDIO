import mongoose, { Schema, Document } from 'mongoose';

export interface IWriting extends Document {
  userId: string;
  promptId: string;
  promptText: string;
  content: string;
  submittedAt: Date;
  score?: number;
  feedback?: string[];
  aiDetails?: any;
  raw?: string;
}

const WritingSchema = new Schema<IWriting>({
  userId: { type: String, required: true },
  promptId: { type: String, required: true },
  promptText: { type: String, required: true },
  content: { type: String, required: true },
  submittedAt: { type: Date, default: () => new Date() },
  score: { type: Number },
  feedback: { type: [String], default: [] },
  aiDetails: { type: Schema.Types.Mixed },
  raw: { type: String }, // thêm trường raw để lưu đầu ra thô từ Gemini
});

export default mongoose.models.Writing || mongoose.model<IWriting>('Writing', WritingSchema);
