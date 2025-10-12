import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  url: { type: String },
  type: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  excerpt: { type: String },
  content: { type: String }, // rich HTML or editor output
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: { type: [String], default: [] },
  featuredImage: { type: String },
  media: { type: [MediaSchema], default: [] },
  published: { type: Boolean, default: false },
  scheduledAt: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('Lesson', LessonSchema);
