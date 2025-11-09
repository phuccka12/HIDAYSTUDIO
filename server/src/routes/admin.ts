import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Submission from '../models/Submission';
import Exam from '../models/Exam';
import Attempt from '../models/Attempt';
import Lesson from '../models/Lesson';
import { gradeWriting } from '../services/writingGrader';

const router = Router();

// Simple admin guard using cookie (dev). In production use real auth and RBAC.
// Only users with role === 'admin' in the DB are accepted. Environment-based admin mapping removed.
const requireAdmin = async (req: any, res: any) => {
  const id = req.cookies['ielts_user'];
  // debug log
  console.debug('requireAdmin: cookie id=', id);
  if (!id || !mongoose.isValidObjectId(id)) {
    res.status(401).json({ message: 'Not authenticated' });
    return null;
  }
  const user = await User.findById(id).lean();
  console.debug('requireAdmin: found user=', user?.email);
  if (!user) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }

  // Check role in DB
  if (user.role === 'admin') return user;

  // No environment-based admin mapping: require DB role === 'admin' only.

  res.status(403).json({ message: 'Forbidden' });
  return null;
};

router.get('/stats', async (req, res) => {
  // require admin
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // run independent counts/aggregations in parallel
    const [
      totalUsers,
      newUsers7Days,
      totalSubmissions,
      pendingSubmissions,
      totalExams,
      publishedExams,
      lessonsCount,
      totalAttempts,
      inProgressAttempts,
      submittedAttempts,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      Submission.countDocuments(),
      Submission.countDocuments({ $or: [{ graded_at: { $exists: false } }, { graded_at: null }] }),
      Exam.countDocuments(),
      Exam.countDocuments({ published: true }),
      Lesson.countDocuments(),
      Attempt.countDocuments(),
      Attempt.countDocuments({ status: 'in_progress' }),
      Attempt.countDocuments({ status: 'submitted' }),
      User.countDocuments({ updated_at: { $gte: thirtyDaysAgo } })
    ]);

    // averages via aggregation (may return empty result)
    const avgScoreAgg = await Attempt.aggregate([
      { $match: { score: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const avgAttemptScore = (avgScoreAgg && avgScoreAgg[0] && avgScoreAgg[0].avgScore) ? Number(avgScoreAgg[0].avgScore) : null;

    const avgAttemptsPerUserAgg = await Attempt.aggregate([
      { $match: { userId: { $ne: null } } },
      { $group: { _id: '$userId', attempts: { $sum: 1 } } },
      { $group: { _id: null, avgAttempts: { $avg: '$attempts' } } }
    ]);
    const avgAttemptsPerUser = (avgAttemptsPerUserAgg && avgAttemptsPerUserAgg[0] && avgAttemptsPerUserAgg[0].avgAttempts) ? Number(avgAttemptsPerUserAgg[0].avgAttempts) : 0;

    const avgAiScoreAgg = await Submission.aggregate([
      { $match: { ai_score: { $ne: null } } },
      { $group: { _id: null, avgAi: { $avg: '$ai_score' } } }
    ]);
    const avgAiScore = (avgAiScoreAgg && avgAiScoreAgg[0] && avgAiScoreAgg[0].avgAi) ? Number(avgAiScoreAgg[0].avgAi) : null;

    // try to get DB stats (may require permissions)
    let databaseSize = 'N/A';
    try {
      // mongoose.connection.db is available when connected
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const stats = await mongoose.connection.db.stats();
      if (stats && typeof stats.storageSize !== 'undefined') {
        // storageSize in bytes -> human readable
        const bytes = Number(stats.storageSize || stats.dataSize || 0);
        const human = bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : '0 MB';
        databaseSize = human;
      }
    } catch (err) {
      // ignore DB stats errors
    }

    res.json({
      totalUsers,
      newUsers7Days,
      totalSubmissions,
      pendingSubmissions,
      totalExams,
      publishedExams,
      lessonsCount,
      totalAttempts,
      inProgressAttempts,
      submittedAttempts,
      avgAttemptScore,
      avgAttemptsPerUser,
      avgAiScore,
      activeUsers,
      databaseSize
    });
  } catch (e: any) {
    console.error('Error building admin stats', e);
    res.status(500).json({ message: e.message || 'Failed to build stats' });
  }
});

router.get('/recent-submissions', async (req, res) => {
  // support pagination: ?page=1&limit=20
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    Submission.countDocuments(),
    Submission.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // populate user info
  const enriched = await Promise.all(items.map(async (it: any) => {
    let user: any = null;
    if (it.user_id && mongoose.isValidObjectId(it.user_id)) {
      user = await User.findById(it.user_id).lean();
    }
    return {
      ...it,
      userId: it.user_id || null,
      userEmail: user?.email || null,
      userFullName: user?.full_name || null,
    };
  }));

  res.json({ items: enriched, total });
});

// Admin: re-run AI grader for a submission (re-grade)
router.put('/submissions/:id/grade', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

  const doc = await Submission.findById(id);
  if (!doc) return res.status(404).json({ message: 'Submission not found' });

  try {
    const prompt = doc.prompt || '';
    const content = doc.content || '';
    const result = await gradeWriting(prompt, content);

    doc.ai_score = result.score;
    if (result.details) doc.ai_criteria = result.details;
    doc.ai_feedback = Array.isArray(result.feedback) ? result.feedback : [];
    const suggestedCorrections = (result as any).suggested_corrections ?? (result as any).suggestedCorrections;
    if (suggestedCorrections) doc.ai_corrections = suggestedCorrections;
  if ((result as any).corrected_answer) doc.ai_corrected = (result as any).corrected_answer;
  if ((result as any).confidence) doc.ai_confidence = (result as any).confidence;
  doc.ai_raw = result.raw;
    doc.graded_by = `manual-regrade:${admin.email || admin._id}`;
    doc.graded_at = new Date();

    await doc.save();
    return res.json(await Submission.findById(id).lean());
  } catch (err: any) {
    console.error('Regrade failed', err);
    return res.status(500).json({ message: 'Regrade failed', details: String(err?.message ?? err) });
  }
});

// Admin: list users
router.get('/users', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return; // response already sent
  const users = await User.find().select('-passwordHash -resetToken -resetTokenExpires').lean();
  res.json(users.map(u => ({ id: u._id, email: u.email, full_name: u.full_name, role: u.role, created_at: u.created_at })));
});

// Admin: update user role
router.put('/users/:id/role', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  const { role } = req.body;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  if (!role || !['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const updated = await User.findByIdAndUpdate(id, { role, updated_at: new Date() }, { new: true }).select('-passwordHash -resetToken -resetTokenExpires').lean();
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, user: updated });
});

// Admin: delete user
router.delete('/users/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  await User.findByIdAndDelete(id);
  res.json({ ok: true });
});

// Admin: create user
router.post('/users', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { email, password, full_name, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already exists' });
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash: hash, full_name, role: role || 'user' });
  res.json({ ok: true, user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role } });
});

// Admin: change user password
router.put('/users/:id/password', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  if (!newPassword) return res.status(400).json({ message: 'newPassword required' });
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(id, { passwordHash: hash, updated_at: new Date() });
  res.json({ ok: true });
});

export default router;
