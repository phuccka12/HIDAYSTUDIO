import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../../models/Exam';
import requireAdmin from '../../middleware/requireAdmin';

const router = Router();

// Helper to find section and question
function findSectionById(exam: any, sectionId: string) {
  if (!exam || !Array.isArray(exam.sections)) return null;
  return exam.sections.find((s: any) => s.id === sectionId) || null;
}

// Admin: list exams with filters
router.get('/exams', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { q, tag, published } = req.query;
  const { limit, skip } = (req as any).query && (req as any).query.page ? { limit: Number((req as any).query.limit || 20), skip: 0 } : { limit: 20, skip: 0 };
  const filter: any = {};
  if (q) filter.$text = { $search: String(q) };
  if (tag) filter.tags = String(tag);
  if (published !== undefined) filter.published = String(published) === 'true';
  const total = await Exam.countDocuments(filter);
  const items = await Exam.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
  res.json({ total, items });
});

// Admin: create exam
router.post('/exams', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { title, description, tags, sections, settings } = req.body;
  if (!title) return res.status(400).json({ message: 'title required' });
  // validate settings if present (same rules as original file)
  if (settings && typeof settings === 'object') {
    if (settings.passThresholdPercent !== undefined) {
      const v = Number(settings.passThresholdPercent);
      if (isNaN(v) || v < 0 || v > 100) return res.status(400).json({ message: 'Invalid passThresholdPercent' });
    }
    if (settings.attemptsAllowed !== undefined) {
      const a = Number(settings.attemptsAllowed);
      if (isNaN(a) || a < 0) return res.status(400).json({ message: 'Invalid attemptsAllowed' });
    }
    if (settings.negativeMarking !== undefined) {
      const nm = settings.negativeMarking;
      if (typeof nm !== 'object' || nm === null) return res.status(400).json({ message: 'Invalid negativeMarking' });
      if (nm.enabled !== undefined && typeof nm.enabled !== 'boolean') return res.status(400).json({ message: 'negativeMarking.enabled must be boolean' });
      if (nm.perWrong !== undefined && isNaN(Number(nm.perWrong))) return res.status(400).json({ message: 'negativeMarking.perWrong must be a number' });
      if (nm.penalty !== undefined && isNaN(Number(nm.penalty))) return res.status(400).json({ message: 'negativeMarking.penalty must be a number' });
    }
    if (settings.autoGradeTypes !== undefined) {
      const allowedAuto = ['mcq','multi','true_false','match','fill','essay'];
      if (!Array.isArray(settings.autoGradeTypes) || settings.autoGradeTypes.some((x: any) => !allowedAuto.includes(x))) {
        return res.status(400).json({ message: 'Invalid autoGradeTypes' });
      }
    }
  }
  try {
    const exam = await Exam.create({ title, description, tags: tags || [], sections: sections || [], settings: settings || {}, authorId: admin._id });
    res.json({ ok: true, exam });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to create exam' });
  }
});

// Admin: get exam by id
router.get('/exams/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const exam = await Exam.findById(id).lean();
  if (!exam) return res.status(404).json({ message: 'Not found' });
  res.json(exam);
});

// Admin: update exam
router.put('/exams/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const allowed = ['title','description','tags','sections','settings','published','scheduledAt'];
  const payload: any = {};
  for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
  // validate settings if present
  if (payload.settings && typeof payload.settings === 'object') {
    const settings = payload.settings;
    if (settings.passThresholdPercent !== undefined) {
      const v = Number(settings.passThresholdPercent);
      if (isNaN(v) || v < 0 || v > 100) return res.status(400).json({ message: 'Invalid passThresholdPercent' });
    }
    if (settings.attemptsAllowed !== undefined) {
      const a = Number(settings.attemptsAllowed);
      if (isNaN(a) || a < 0) return res.status(400).json({ message: 'Invalid attemptsAllowed' });
    }
    if (settings.negativeMarking !== undefined) {
      const nm = settings.negativeMarking;
      if (typeof nm !== 'object' || nm === null) return res.status(400).json({ message: 'Invalid negativeMarking' });
      if (nm.enabled !== undefined && typeof nm.enabled !== 'boolean') return res.status(400).json({ message: 'negativeMarking.enabled must be boolean' });
      if (nm.perWrong !== undefined && isNaN(Number(nm.perWrong))) return res.status(400).json({ message: 'negativeMarking.perWrong must be a number' });
      if (nm.penalty !== undefined && isNaN(Number(nm.penalty))) return res.status(400).json({ message: 'negativeMarking.penalty must be a number' });
    }
    if (settings.autoGradeTypes !== undefined) {
      const allowedAuto = ['mcq','multi','true_false','match','fill','essay'];
      if (!Array.isArray(settings.autoGradeTypes) || settings.autoGradeTypes.some((x: any) => !allowedAuto.includes(x))) {
        return res.status(400).json({ message: 'Invalid autoGradeTypes' });
      }
    }
  }
  try {
    // optimistic version check to avoid silent overwrite
    if ('version' in payload) {
      const v = Number(payload.version);
      if (isNaN(v)) return res.status(400).json({ message: 'Invalid version' });
      const existing = await Exam.findById(id);
      if (!existing) return res.status(404).json({ message: 'Not found' });
      if ((existing.version || 0) !== v) return res.status(409).json({ message: 'Version conflict' });
    }
    const updated = await Exam.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true, exam: updated });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to update' });
  }
});

// Admin: delete exam
router.delete('/exams/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  await Exam.findByIdAndDelete(id);
  res.json({ ok: true });
});

// Admin: publish/unpublish
router.post('/exams/:id/publish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: 'Not found' });
  const hasQuestions = Array.isArray(exam.sections) && exam.sections.some((s: any) => Array.isArray(s.questions) && s.questions.length > 0);
  if (!hasQuestions) return res.status(400).json({ message: 'Cannot publish exam without questions' });
  exam.published = true;
  exam.version = (exam.version || 1) + 1;
  await exam.save();
  res.json({ ok: true, exam });
});

router.post('/exams/:id/unpublish', async (req, res) => {
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

// Create question in a section
router.post('/exams/:examId/sections/:sectionId/questions', async (req, res) => {
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
router.put('/exams/:examId/sections/:sectionId/questions/:questionId', async (req, res) => {
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
router.delete('/exams/:examId/sections/:sectionId/questions/:questionId', async (req, res) => {
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
router.post('/exams/:examId/sections/:sectionId/questions/reorder', async (req, res) => {
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

export default router;
