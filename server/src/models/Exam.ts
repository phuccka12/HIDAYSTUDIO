import mongoose from 'mongoose';

const { Schema } = mongoose;

// MediaSchema: reusable for media refs
const MediaSchema = new Schema({
  url: { type: String, required: true, trim: true },
  type: { type: String, enum: ['image', 'audio', 'video', 'pdf', 'other'], default: 'other' },
  meta: { type: Map, of: Schema.Types.Mixed }
}, { _id: false });

// Choice schema - keep default _id for stable identity
const ChoiceSchema = new Schema({
  // optional external id; _id provided by mongoose
  id: { type: String },
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false },
  meta: { type: Map, of: Schema.Types.Mixed }
});

// Question schema - embedded, no automatic _id (we use id field)
const QuestionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['mcq','multi','match','fill','essay'] },
  prompt: { type: String, required: true, trim: true },
  points: { type: Number, default: 1, min: 0 },
  choices: { type: [ChoiceSchema], default: [] },
  metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
  media: { type: [MediaSchema], default: [] }
}, { _id: false });

// Validator: enforce correct choices depending on question type
QuestionSchema.path('choices').validate(function (choices: any[]) {
  // `this` is the question subdocument
  const qType = (this as any).type;
  if (!qType) return true;

  const correctCount = (choices || []).filter((c: any) => c && c.isCorrect).length;

  if (qType === 'mcq') {
    // MCQ requires exactly one correct answer
    return (choices && choices.length > 0) && correctCount === 1;
  }

  if (qType === 'multi') {
    // Multi requires at least one correct
    return (choices && choices.length > 0) && correctCount >= 1;
  }

  // For other types, no constraint on choices
  return true;
}, 'Invalid choices for question type');

// Section schema
const SectionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['listening','reading','writing','speaking'] },
  title: { type: String, trim: true },
  instructions: { type: String },
  mediaRefs: { type: [MediaSchema], default: [] },
  questions: { type: [QuestionSchema], default: [] }
}, { _id: false });

// Exam schema
const ExamSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, index: true, unique: true, lowercase: true, trim: true },
  description: { type: String },
  tags: { type: [String], default: [] },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sections: { type: [SectionSchema], default: [] },
  settings: {
    timeLimitMinutes: { type: Number, min: 0 },
    attemptsAllowed: { type: Number, default: 1, min: 1 },
    randomizeQuestions: { type: Boolean, default: false },
    scoring: { type: Map, of: Schema.Types.Mixed, default: {} }
  },
  published: { type: Boolean, default: false },
  scheduledAt: { type: Date },
  version: { type: Number, default: 1 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Pre-save hook: auto-generate slug from title when slug is empty
ExamSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    const s = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    this.slug = s;
  }
  next();
});

// Optional text index for search (uncomment to enable)
// ExamSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Exam', ExamSchema);
