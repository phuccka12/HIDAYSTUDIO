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
  attemptsAllowed: { type: Number, default: 0, min: 0 },
    allowRetakeAfterMinutes: { type: Number, min: 0 },
    randomizeQuestions: { type: Boolean, default: false },
    randomizePerSection: { type: Boolean, default: false },
    showAnswersAfterSubmit: { type: String, enum: ['immediately','after_grading','never'], default: 'after_grading' },
    passThresholdPercent: { type: Number, min: 0, max: 100 },
    negativeMarking: { enabled: { type: Boolean, default: false }, perWrong: { type: Number } },
    autoGradeTypes: { type: [String], default: ['mcq','true_false','multi'] },
    shuffleOptions: { type: Boolean, default: false },
    allowSaveProgress: { type: Boolean, default: false },
    showTimer: { type: Boolean, default: true },
    publishState: { type: String, enum: ['draft','published','archived'], default: 'draft' },
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

// Pre-validate: coerce some frontend-friendly shapes into the schema's expected types
ExamSchema.pre('validate', function (next) {
  try {
    if (this.settings) {
      // allow frontend to send boolean or string boolean for showAnswersAfterSubmit
      let sas = (this.settings as any).showAnswersAfterSubmit;
      if (typeof sas === 'boolean') {
        (this.settings as any).showAnswersAfterSubmit = sas ? 'immediately' : 'after_grading';
      } else if (typeof sas === 'string') {
        const s = sas.toLowerCase().trim();
        if (s === 'true') (this.settings as any).showAnswersAfterSubmit = 'immediately';
        else if (s === 'false') (this.settings as any).showAnswersAfterSubmit = 'after_grading';
        // otherwise, if it's already one of allowed enum strings, leave as-is
      }

      // map negativeMarking.penalty (frontend) -> negativeMarking.perWrong (schema)
      const nm = (this.settings as any).negativeMarking;
      if (nm && typeof nm.penalty !== 'undefined' && typeof nm.perWrong === 'undefined') {
        (this.settings as any).negativeMarking.perWrong = Number(nm.penalty);
      }
    }
  } catch (err) {
    // ignore coercion errors, let validation handle real issues
  }
  next();
});

// Optional text index for search (uncomment to enable)
// ExamSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Exam', ExamSchema);
