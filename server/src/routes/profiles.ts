import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Submission from '../models/Submission';
import Attempt from '../models/Attempt';
import Notification from '../models/Notification';
import UserProgress from '../models/UserProgress';
import requireAuth from '../middleware/auth';

const router = Router();

// Get all profiles
router.get('/', async (_req, res) => {
  const users = await User.find().lean();
  res.json(users);
});

// Get profile by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const user = await User.findById(id).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

// Update current authenticated user's profile (convenience endpoint)
router.put('/me', async (req, res) => {
  const id = req.cookies['ielts_user'];
  if (!id || !mongoose.isValidObjectId(id)) return res.status(401).json({ message: 'Not authenticated' });
  const updates = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, { ...updates, updated_at: new Date() }, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    return res.json(user);
  } catch (err) {
    console.error('Error updating /profiles/me:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update profile
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updates = req.body;
  const user = await User.findByIdAndUpdate(id, { ...updates, updated_at: new Date() }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

// Admin endpoint - LIST all submissions (for cleanup purposes)
router.get('/admin/all-submissions', requireAuth, async (req: any, res) => {
  try {
    // Only admin can use this
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const submissions = await Submission.find({})
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    
    res.json({
      success: true,
      total: submissions.length,
      submissions: submissions.map(s => ({
        id: s._id,
        userId: s.user_id,
        taskType: s.task_type,
        prompt: s.prompt?.slice(0, 50),
        score: s.ai_score,
        createdAt: s.created_at,
        gradedAt: s.graded_at
      }))
    });
  } catch (error) {
    console.error('[Admin] Error listing submissions:', error);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

// Admin cleanup endpoint - DELETE submissions by user_id (use with caution!)
router.delete('/admin/cleanup-submissions/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // Only admin can use this
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    
    const result = await Submission.deleteMany({ user_id: userId });
    
    console.log(`[Cleanup] Deleted ${result.deletedCount} submissions for user ${userId}`);
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} submissions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    res.status(500).json({ error: 'Failed to cleanup submissions' });
  }
});

// Dashboard for current authenticated user
router.get('/me/dashboard', requireAuth, async (req: any, res) => {
  const user = req.user;

  try {
    // Ensure user._id is ObjectId for proper filtering
    const userId = mongoose.Types.ObjectId.isValid(user._id) 
      ? new mongoose.Types.ObjectId(user._id) 
      : user._id;

    console.log('[Dashboard] Fetching data for user:', userId.toString());

    // Parallel fetch: recent submissions (writing), recent attempts (exams), notifications, user progress
    const [submissions, attempts, notifications, userProgress] = await Promise.all([
      Submission.find({ user_id: userId }).sort({ created_at: -1 }).limit(20).lean(),
      Attempt.find({ userId: userId }).sort({ submittedAt: -1 }).limit(20).lean(),
      Notification.find({ $or: [{ userId: userId }, { broadcast: true }] }).sort({ created_at: -1 }).limit(20).lean(),
      UserProgress.find({ user_id: userId }).lean()
    ]);

    console.log('[Dashboard] Found submissions:', submissions.length);

    // Aggregate simple stats
    const aiScores = {
      average: submissions && submissions.length ? (submissions.reduce((s: number, x: any) => s + (x.ai_score || 0), 0) / submissions.length) : null,
      latest: submissions.slice(0, 5).map(s => ({ id: s._id, ai_score: s.ai_score, graded_at: s.graded_at }))
    };

    // Map user progress to match frontend expectations
    const skillProgress = userProgress.map(p => ({
      id: p._id,
      user_id: p.user_id,
      skill_type: p.skill_type,
      current_level: p.current_level,
      target_score: p.target_score,
      completed_exercises: p.completed_exercises,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    const progress = {
      attemptsCount: attempts.length,
      gradedAttempts: attempts.filter(a => a.status === 'graded').length,
      lastAttempt: attempts[0] || null,
      skills: skillProgress
    };

    const gradingHistory = submissions.map(s => ({
      id: s._id,
      task_type: s.task_type,
      prompt: s.prompt,
      content: s.content,
      created_at: s.created_at,
      ai_score: s.ai_score,
      ai_criteria: s.ai_criteria,
      ai_feedback: s.ai_feedback,
      ai_corrected: s.ai_corrected,
      ai_corrections: s.ai_corrections,
      graded_at: s.graded_at
    }));

    res.json({
      account: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.created_at
      },
      gradingHistory,
      aiScores,
      progress,
      notifications: notifications.map(n => ({ id: n._id, title: n.title, body: n.body, read: n.read, created_at: n.created_at }))
    });
  } catch (err) {
    console.error('Error fetching /profiles/me/dashboard:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});

export default router;
