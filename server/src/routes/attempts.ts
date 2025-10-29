import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam';
import Attempt from '../models/Attempt';
import { mergeAnswers } from '../utils/attemptHelpers';
import { gradeAttempt } from '../services/grader';

const router = Router();

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
        const qids: string[] = [];
        for (const s of (exam.sections || [])) {
          for (const q of (s.questions || [])) qids.push(q.id);
        }
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
