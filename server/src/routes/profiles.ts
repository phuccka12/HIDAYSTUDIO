import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Submission from '../models/Submission';
import Attempt from '../models/Attempt';
import Exam from '../models/Exam';
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

    // Parallel fetch: recent submissions (writing), recent attempts (exams), user progress
    const [submissions, attempts, userProgress] = await Promise.all([
      Submission.find({ user_id: userId }).sort({ created_at: -1 }).limit(20).lean(),
      Attempt.find({ userId: userId }).sort({ submittedAt: -1 }).limit(20).lean(),
      UserProgress.find({ user_id: userId }).lean()
    ]);

    console.log('[Dashboard] Found submissions:', submissions.length);
    console.log('[Dashboard] Found attempts:', attempts.length);

    // Fetch exams for attempts to get section information
    const examIds = attempts.map(a => a.examId).filter(Boolean);
    const exams = await Exam.find({ _id: { $in: examIds } }).lean();
    const examMap = new Map(exams.map(e => [e._id.toString(), e]));

    // Calculate skill progress dynamically based on attempts and submissions
    const skillStats: Record<string, { scores: number[], count: number }> = {
      listening: { scores: [], count: 0 },
      reading: { scores: [], count: 0 },
      writing: { scores: [], count: 0 },
      speaking: { scores: [], count: 0 }
    };

    // Process exam attempts - extract skills from exam sections AND slug/title
    attempts.forEach(attempt => {
      // Accept both 'graded' and 'submitted' status since attempts auto-grade on submit
      const isGraded = attempt.status === 'graded' || attempt.status === 'submitted';
      if (isGraded && attempt.score != null && attempt.details?.totalPossible) {
        const exam = examMap.get(attempt.examId.toString());
        if (exam && exam.sections) {
          // Convert raw score to scale of 10
          const scoreOutOf10 = (attempt.score / attempt.details.totalPossible) * 10;
          const roundedScore = Math.round(scoreOutOf10 * 10) / 10;
          
          // Get unique section types from this exam
          const sectionTypes = [...new Set(exam.sections.map(s => s.type))];
          
          // Check if exam slug or title indicates a specific skill test
          const slug = exam.slug?.toLowerCase() || '';
          const title = exam.title?.toLowerCase() || '';
          let targetSkill: string | null = null;
          
          if (slug.includes('listening') || title.includes('listening')) targetSkill = 'listening';
          else if (slug.includes('reading') || title.includes('reading')) targetSkill = 'reading';
          else if (slug.includes('writing') || title.includes('writing')) targetSkill = 'writing';
          else if (slug.includes('speaking') || title.includes('speaking')) targetSkill = 'speaking';
          
          // If slug/title specifies a skill, only count for that skill
          if (targetSkill && skillStats[targetSkill]) {
            skillStats[targetSkill].scores.push(roundedScore);
            skillStats[targetSkill].count++;
          } else {
            // Otherwise distribute across all section types
            sectionTypes.forEach(skillType => {
              if (skillStats[skillType]) {
                skillStats[skillType].scores.push(roundedScore);
                skillStats[skillType].count++;
              }
            });
          }
        }
      }
    });

    // Process writing submissions - AI graded writing counts as writing skill (scaled to 10)
    submissions.forEach(submission => {
      if (submission.ai_score != null) {
        // AI score is already on IELTS scale (0-9), convert to 10-point scale
        const scoreOutOf10 = (submission.ai_score / 9) * 10;
        const roundedScore = Math.round(scoreOutOf10 * 10) / 10;
        skillStats.writing.scores.push(roundedScore);
        skillStats.writing.count++;
      }
    });

    // Build skill progress array with calculated averages
    const skillProgress = Object.entries(skillStats).map(([skillType, stats]) => {
      const avgScore = stats.scores.length > 0 
        ? stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length 
        : 0;
      
      // Round to nearest 0.5 (IELTS standard)
      const currentLevel = Math.round(avgScore * 2) / 2;
      
      // Get target from UserProgress if exists, otherwise default to 7.0
      const existingProgress = userProgress.find(p => p.skill_type === skillType);
      const targetScore = existingProgress?.target_score || 7.0;

      return {
        id: existingProgress?._id || new mongoose.Types.ObjectId(),
        user_id: userId,
        skill_type: skillType,
        current_level: currentLevel,
        target_score: targetScore,
        completed_exercises: stats.count,
        created_at: existingProgress?.created_at || new Date(),
        updated_at: new Date()
      };
    });

    console.log('[Dashboard] Calculated skill progress:', skillProgress);

    // Aggregate simple stats
    const aiScores = {
      average: submissions && submissions.length ? (submissions.reduce((s: number, x: any) => s + (x.ai_score || 0), 0) / submissions.length) : null,
      latest: submissions.slice(0, 5).map(s => ({ id: s._id, ai_score: s.ai_score, graded_at: s.graded_at }))
    };

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

    // Map attempts with exam details for test history
    const testHistory = attempts.map(attempt => {
      const exam = examMap.get(attempt.examId?.toString());
      
      // Convert raw score to scale of 10
      let displayScore = attempt.score;
      if (attempt.details && attempt.details.totalPossible) {
        // Calculate score out of 10: (correct / total) * 10
        displayScore = (attempt.score / attempt.details.totalPossible) * 10;
        displayScore = Math.round(displayScore * 10) / 10; // Round to 1 decimal place
      }
      
      return {
        id: attempt._id,
        examId: attempt.examId,
        examTitle: exam?.title || 'Bài thi IELTS',
        examSections: exam?.sections ? [...new Set(exam.sections.map((s: any) => s.type))] : [],
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        score: displayScore,
        rawScore: attempt.score,
        totalQuestions: attempt.details?.totalPossible || null,
        details: attempt.details
      };
    });

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
      testHistory,
      aiScores,
      progress
    });
  } catch (err) {
    console.error('Error fetching /profiles/me/dashboard:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});

export default router;
