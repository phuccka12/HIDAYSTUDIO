import mongoose, { Schema, Document } from 'mongoose';

export interface IPrompt extends Document {
  task_type: string;
  text: string;
  tags?: string[];
  created_at: Date;
}

const PromptSchema = new Schema<IPrompt>({
  task_type: { type: String, required: true, index: true },
  text: { type: String, required: true },
  tags: { type: [String], default: [] },
  created_at: { type: Date, default: () => new Date() }
});

export default mongoose.models.Prompt || mongoose.model<IPrompt>('Prompt', PromptSchema);