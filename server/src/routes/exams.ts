import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam';
import Attempt from '../models/Attempt';
import { mergeAnswers, isAttemptExpired } from '../utils/attemptHelpers';
import { gradeAttempt } from '../services/grader';
import User from '../models/User';

const router = Router();

// Simple admin guard (copied style from original content)
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
  // validate settings if present
  if (settings && typeof settings === 'object') {
    if (settings.passThresholdPercent !== undefined) {
      const v = Number(settings.passThresholdPercent);
      if (isNaN(v) || v < 0 || v > 100) return res.status(400).json({ message: 'Invalid passThresholdPercent' });
    }
    if (settings.attemptsAllowed !== undefined) {
      const a = Number(settings.attemptsAllowed);
      if (isNaN(a) || a < 0) return res.status(400).json({ message: 'Invalid attemptsAllowed' });
    }
    // negativeMarking shape
    if (settings.negativeMarking !== undefined) {
      const nm = settings.negativeMarking;
      if (typeof nm !== 'object' || nm === null) return res.status(400).json({ message: 'Invalid negativeMarking' });
      if (nm.enabled !== undefined && typeof nm.enabled !== 'boolean') return res.status(400).json({ message: 'negativeMarking.enabled must be boolean' });
      if (nm.perWrong !== undefined && isNaN(Number(nm.perWrong))) return res.status(400).json({ message: 'negativeMarking.perWrong must be a number' });
      if (nm.penalty !== undefined && isNaN(Number(nm.penalty))) return res.status(400).json({ message: 'negativeMarking.penalty must be a number' });
    }
    // autoGradeTypes must be subset of allowed types
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
    // negativeMarking shape
    if (settings.negativeMarking !== undefined) {
      const nm = settings.negativeMarking;
      if (typeof nm !== 'object' || nm === null) return res.status(400).json({ message: 'Invalid negativeMarking' });
      if (nm.enabled !== undefined && typeof nm.enabled !== 'boolean') return res.status(400).json({ message: 'negativeMarking.enabled must be boolean' });
      if (nm.perWrong !== undefined && isNaN(Number(nm.perWrong))) return res.status(400).json({ message: 'negativeMarking.perWrong must be a number' });
      if (nm.penalty !== undefined && isNaN(Number(nm.penalty))) return res.status(400).json({ message: 'negativeMarking.penalty must be a number' });
    }
    // autoGradeTypes must be subset of allowed types
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
  // ensure exam has at least one section with questions before publishing
  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: 'Not found' });
  const hasQuestions = Array.isArray(exam.sections) && exam.sections.some((s: any) => Array.isArray(s.questions) && s.questions.length > 0);
  if (!hasQuestions) return res.status(400).json({ message: 'Cannot publish exam without questions' });
  exam.published = true;
  exam.version = (exam.version || 1) + 1;
  await exam.save();
  res.json({ ok: true, exam });
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

// Public: start an attempt for an exam
router.post('/exams/:id/start', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid exam id' });
  try {
    const exam = await Exam.findById(id).lean();
    if (!exam || !exam.published) return res.status(404).json({ message: 'Not found' });

    // check attemptsAllowed (0 means unlimited)
    const attemptsAllowed = (exam.settings && typeof exam.settings.attemptsAllowed === 'number') ? Number(exam.settings.attemptsAllowed) : 0;

    // identify user if logged in via cookie
    const userId = req.cookies && req.cookies['ielts_user'] && mongoose.isValidObjectId(req.cookies['ielts_user']) ? req.cookies['ielts_user'] : null;

    if (userId && attemptsAllowed > 0) {
      const prevCount = await Attempt.countDocuments({ examId: exam._id, userId: userId, status: { $in: ['submitted','graded'] } });
      if (prevCount >= attemptsAllowed) return res.status(400).json({ message: 'Attempts limit reached' });
    }

    // set expiresAt if timeLimitMinutes provided
    let expiresAt = null;
    if (exam.settings && exam.settings.timeLimitMinutes && Number(exam.settings.timeLimitMinutes) > 0) {
      const mins = Number(exam.settings.timeLimitMinutes);
      expiresAt = new Date(Date.now() + mins * 60 * 1000);
    }

    // Optionally persist a randomized question order if configured
    let order: string[] = [];
    try {
      if (exam.settings && exam.settings.randomizeQuestions) {
        // collect all question ids in exam order
        const qids: string[] = [];
        for (const s of (exam.sections || [])) {
          for (const q of (s.questions || [])) qids.push(q.id);
        }
        // simple shuffle (Fisher-Yates)
        for (let i = qids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = qids[i]; qids[i] = qids[j]; qids[j] = tmp;
        }
        order = qids;
      }
    } catch (err) {
      // ignore order generation issues
    }

    const attempt = await Attempt.create({ examId: exam._id, userId: userId, expiresAt: expiresAt, order });
    res.json({ ok: true, attemptId: attempt._id, expiresAt: attempt.expiresAt, order: attempt.order });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to start attempt' });
  }
});

// Autosave answers for an attempt
router.post('/exams/:id/attempts/:attemptId/save', async (req, res) => {
  const { id: examId, attemptId } = req.params;
  if (!mongoose.isValidObjectId(examId) || !mongoose.isValidObjectId(attemptId)) return res.status(400).json({ message: 'Invalid id' });
  const payload = req.body || {};
  const incomingAnswers = Array.isArray(payload.answers) ? payload.answers : [];
  try {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (String(attempt.examId) !== String(examId)) return res.status(400).json({ message: 'Attempt does not belong to exam' });
    if (attempt.status !== 'in_progress') return res.status(400).json({ message: 'Attempt not in progress' });
    if (attempt.expiresAt && attempt.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'Attempt expired' });

    // merge answers and persist
    attempt.answers = mergeAnswers(attempt.answers || [], incomingAnswers);
    attempt.version = (attempt.version || 1) + 1;
    await attempt.save();
    res.json({ ok: true, version: attempt.version });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to save attempt' });
  }
});

// Submit attempt and grade
router.post('/exams/:id/attempts/:attemptId/submit', async (req, res) => {
  const { id: examId, attemptId } = req.params;
  if (!mongoose.isValidObjectId(examId) || !mongoose.isValidObjectId(attemptId)) return res.status(400).json({ message: 'Invalid id' });
  const payload = req.body || {};
  const incomingAnswers = Array.isArray(payload.answers) ? payload.answers : [];
  try {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (String(attempt.examId) !== String(examId)) return res.status(400).json({ message: 'Attempt does not belong to exam' });
    if (attempt.status !== 'in_progress') return res.status(409).json({ message: 'Attempt already submitted or closed' });
    if (attempt.expiresAt && attempt.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'Attempt expired' });

    // merge answers
    attempt.answers = mergeAnswers(attempt.answers || [], incomingAnswers);

    // grade using centralized grader
    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const result = gradeAttempt(exam, attempt.answers || []);

    attempt.score = result.totalScore;
    attempt.details = { totalPossible: result.totalPossible, details: result.details, percent: result.percent, passThreshold: (exam.settings && exam.settings.passThresholdPercent) };
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.version = (attempt.version || 1) + 1;
    await attempt.save();

  res.json({ ok: true, score: result.totalScore, total: result.totalPossible, pass: result.pass, details: attempt.details });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to submit attempt' });
  }
});

  // Public: get attempt by id (used by frontend to resume/view attempt)
  router.get('/attempts/:attemptId', async (req, res) => {
    const { attemptId } = req.params;
    if (!mongoose.isValidObjectId(attemptId)) return res.status(400).json({ message: 'Invalid attempt id' });
    try {
      const attempt = await Attempt.findById(attemptId).lean();
      if (!attempt) return res.status(404).json({ message: 'Not found' });
      // attach a snapshot of the exam for rendering (do not enforce published)
      const exam = await Exam.findById(attempt.examId).lean();
      if (exam) (attempt as any).exam = exam;
      res.json(attempt);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e.message || 'Failed to fetch attempt' });
    }
  });

export default router;
