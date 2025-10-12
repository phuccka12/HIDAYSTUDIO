import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam';
import User from '../models/User';
import Lesson from '../models/Lesson';

const router = Router();

// Simple admin guard (copied style from admin.ts)
const requireAdmin = async (req: any, res: any) => {
  const id = req.cookies['ielts_user'];
  if (!id || !mongoose.isValidObjectId(id)) {
    res.status(401).json({ message: 'Not authenticated' });
    return null;
  }
  const user = await User.findById(id).lean();
  if (!user) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  if (user.role === 'admin') return user;
  const adminListRaw = process.env.ADMIN_EMAILS || '';
  const adminList = adminListRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  if (adminList.includes((user.email || '').toLowerCase())) return user;
  res.status(403).json({ message: 'Forbidden' });
  return null;
};

// Helper: parse pagination
function parsePage(q: any) {
  const page = Math.max(1, parseInt(q.page as string || '1', 10));
  const limit = Math.max(1, Math.min(200, parseInt(q.limit as string || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Admin: list exams with filters
router.get('/admin/exams', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { q, tag, published } = req.query;
  const { limit, skip } = parsePage(req.query);
  const filter: any = {};
  if (q) filter.$text = { $search: String(q) };
  if (tag) filter.tags = String(tag);
  if (published !== undefined) filter.published = String(published) === 'true';
  const total = await Exam.countDocuments(filter);
  const items = await Exam.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
  res.json({ total, items });
});

// Admin: create exam
router.post('/admin/exams', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { title, description, tags, sections, settings } = req.body;
  if (!title) return res.status(400).json({ message: 'title required' });
  try {
    const exam = await Exam.create({ title, description, tags: tags || [], sections: sections || [], settings: settings || {}, authorId: admin._id });
    res.json({ ok: true, exam });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to create exam' });
  }
});

// Admin: get exam by id
router.get('/admin/exams/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const exam = await Exam.findById(id).lean();
  if (!exam) return res.status(404).json({ message: 'Not found' });
  res.json(exam);
});

// Admin: update exam
router.put('/admin/exams/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const allowed = ['title','description','tags','sections','settings','published','scheduledAt'];
  const payload: any = {};
  for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
  try {
    const updated = await Exam.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true, exam: updated });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to update' });
  }
});

// Admin: delete exam
router.delete('/admin/exams/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  await Exam.findByIdAndDelete(id);
  res.json({ ok: true });
});

// Admin: publish/unpublish
router.post('/admin/exams/:id/publish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updated = await Exam.findByIdAndUpdate(id, { published: true, $inc: { version: 1 } }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, exam: updated });
});

router.post('/admin/exams/:id/unpublish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updated = await Exam.findByIdAndUpdate(id, { published: false }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, exam: updated });
});

// -----------------------------
// Admin: question-level operations inside sections
// -----------------------------

// Helper to find section and question
function findSectionById(exam: any, sectionId: string) {
  if (!exam || !Array.isArray(exam.sections)) return null;
  return exam.sections.find((s: any) => s.id === sectionId) || null;
}

// Create question in a section
router.post('/admin/exams/:examId/sections/:sectionId/questions', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { examId, sectionId } = req.params;
  if (!mongoose.isValidObjectId(examId)) return res.status(400).json({ message: 'Invalid exam id' });
  const payload = req.body || {};
  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const section = findSectionById(exam, sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    // generate a simple id if not provided
    const qId = payload.id || `q_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const question = Object.assign({ id: qId, points: 1 }, payload);
    section.questions.push(question);
    exam.version = (exam.version || 1) + 1;
    await exam.save();
    res.json({ ok: true, question, exam });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to create question' });
  }
});

// Update a question
router.put('/admin/exams/:examId/sections/:sectionId/questions/:questionId', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { examId, sectionId, questionId } = req.params;
  if (!mongoose.isValidObjectId(examId)) return res.status(400).json({ message: 'Invalid exam id' });
  const payload = req.body || {};
  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const section = findSectionById(exam, sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    const q = section.questions.find((qq: any) => qq.id === questionId);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    // allowed fields to update
    const allowed = ['type','prompt','points','choices','metadata','media'];
    for (const k of allowed) if (k in payload) (q as any)[k] = payload[k];
    exam.version = (exam.version || 1) + 1;
    await exam.save();
    res.json({ ok: true, question: q, exam });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to update question' });
  }
});

// Delete a question
router.delete('/admin/exams/:examId/sections/:sectionId/questions/:questionId', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { examId, sectionId, questionId } = req.params;
  if (!mongoose.isValidObjectId(examId)) return res.status(400).json({ message: 'Invalid exam id' });
  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const section = findSectionById(exam, sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    const before = section.questions.length;
    section.questions = section.questions.filter((qq: any) => qq.id !== questionId);
    if (section.questions.length === before) return res.status(404).json({ message: 'Question not found' });
    exam.version = (exam.version || 1) + 1;
    await exam.save();
    res.json({ ok: true, exam });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to delete question' });
  }
});

// Reorder questions in a section
router.post('/admin/exams/:examId/sections/:sectionId/questions/reorder', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { examId, sectionId } = req.params;
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ message: 'Order must be an array of question ids' });
  if (!mongoose.isValidObjectId(examId)) return res.status(400).json({ message: 'Invalid exam id' });
  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const section = findSectionById(exam, sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    const map = new Map(section.questions.map((q: any) => [q.id, q]));
    const newList: any[] = [];
    for (const id of order) {
      if (map.has(id)) newList.push(map.get(id));
    }
    // append any missing questions at end in original order
    for (const q of section.questions) if (!order.includes(q.id)) newList.push(q);
    section.questions = newList;
    exam.version = (exam.version || 1) + 1;
    await exam.save();
    res.json({ ok: true, exam });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to reorder questions' });
  }
});

// Public: list published exams
router.get('/exams', async (req, res) => {
  const { q, tag, page, limit, published } = req.query;
  const { skip, limit: lim } = parsePage(req.query);
  const filter: any = {};
  if (published === undefined) filter.published = true; else filter.published = String(published) === 'true';
  if (tag) filter.tags = String(tag);
  if (q) {
    // try simple text search if index exists; fallback to regex on title
    filter.$or = [ { title: { $regex: String(q), $options: 'i' } }, { description: { $regex: String(q), $options: 'i' } } ];
  }
  const total = await Exam.countDocuments(filter);
  const items = await Exam.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).lean();
  res.json({ total, items });
});

// Public: get exam by slug or id
router.get('/exams/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;
  let exam = await Exam.findOne({ slug: slugOrId, published: true }).lean();
  if (!exam && mongoose.isValidObjectId(slugOrId)) {
    exam = await Exam.findById(slugOrId).lean();
    if (exam && !exam.published) return res.status(404).json({ message: 'Not found' });
  }
  if (!exam) return res.status(404).json({ message: 'Not found' });
  res.json(exam);
});

// -----------------------------
// Lessons (admin + public)
// -----------------------------

// Admin: list lessons
router.get('/admin/lessons', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { q, tag, published } = req.query;
  const { limit, skip } = parsePage(req.query);
  const filter: any = {};
  if (q) filter.$text = { $search: String(q) };
  if (tag) filter.tags = String(tag);
  if (published !== undefined) filter.published = String(published) === 'true';
  const total = await Lesson.countDocuments(filter);
  const items = await Lesson.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
  res.json({ total, items });
});

// Admin: create lesson
router.post('/admin/lessons', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { title, slug, description, content, tags, media } = req.body;
  if (!title) return res.status(400).json({ message: 'title required' });
  try {
    const lesson = await Lesson.create({ title, slug, description, content: content || '', tags: tags || [], media: media || [], authorId: admin._id });
    res.json({ ok: true, lesson });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to create lesson' });
  }
});

// Admin: get lesson by id
router.get('/admin/lessons/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const lesson = await Lesson.findById(id).lean();
  if (!lesson) return res.status(404).json({ message: 'Not found' });
  res.json(lesson);
});

// Admin: update lesson
router.put('/admin/lessons/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const allowed = ['title','slug','description','content','tags','media','published','scheduledAt'];
  const payload: any = {};
  for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
  try {
    const updated = await Lesson.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true, lesson: updated });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to update' });
  }
});

// Admin: delete lesson
router.delete('/admin/lessons/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  await Lesson.findByIdAndDelete(id);
  res.json({ ok: true });
});

// Admin: publish/unpublish lesson
router.post('/admin/lessons/:id/publish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updated = await Lesson.findByIdAndUpdate(id, { published: true }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, lesson: updated });
});

router.post('/admin/lessons/:id/unpublish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updated = await Lesson.findByIdAndUpdate(id, { published: false }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, lesson: updated });
});

// Public: list published lessons
router.get('/lessons', async (req, res) => {
  const { q, tag, page, limit, published } = req.query;
  const { skip, limit: lim } = parsePage(req.query);
  const filter: any = {};
  if (published === undefined) filter.published = true; else filter.published = String(published) === 'true';
  if (tag) filter.tags = String(tag);
  if (q) {
    filter.$or = [ { title: { $regex: String(q), $options: 'i' } }, { description: { $regex: String(q), $options: 'i' } }, { content: { $regex: String(q), $options: 'i' } } ];
  }
  const total = await Lesson.countDocuments(filter);
  const items = await Lesson.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).lean();
  res.json({ total, items });
});

// Public: get lesson by slug or id
router.get('/lessons/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;
  let lesson = await Lesson.findOne({ slug: slugOrId, published: true }).lean();
  if (!lesson && mongoose.isValidObjectId(slugOrId)) {
    lesson = await Lesson.findById(slugOrId).lean();
    if (lesson && !lesson.published) return res.status(404).json({ message: 'Not found' });
  }
  if (!lesson) return res.status(404).json({ message: 'Not found' });
  res.json(lesson);
});

export default router;

