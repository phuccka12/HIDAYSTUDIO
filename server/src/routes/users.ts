import { Router } from 'express';
import Submission from '../models/Submission';
import UserProgress from '../models/UserProgress';
import mongoose from 'mongoose';

const router = Router();

// GET /users/:id/progress
// Return real UserProgress data from database
router.get('/:id/progress', async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    // Convert string id to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);
    
    // Get UserProgress records for this user
    const progressRecords = await UserProgress.find({ user_id: objectId }).lean();

    // If no progress records found, also look at submissions to create initial data
    if (progressRecords.length === 0) {
      // Look for submissions to create initial progress data
      const subs = await Submission.find({ user_id: id }).lean();
      
      if (subs.length > 0) {
        // Map submissions to skills and create initial progress records
        const mapTaskToSkill = (taskType: string | undefined) => {
          if (!taskType) return 'writing';
          const t = taskType.toLowerCase();
          if (t.includes('write') || t.includes('writing') || t.includes('ielts')) return 'writing';
          if (t.includes('read')) return 'reading';
          if (t.includes('listen')) return 'listening';
          if (t.includes('speak') || t.includes('speaking')) return 'speaking';
          return 'writing';
        };

        const grouped: Record<string, { count: number; avgScore: number }> = {};
        subs.forEach(s => {
          const skill = mapTaskToSkill(s.task_type as any);
          if (!grouped[skill]) grouped[skill] = { count: 0, avgScore: 0 };
          grouped[skill].count += 1;
          const score = typeof s.ai_score === 'number' ? s.ai_score : 0;
          grouped[skill].avgScore += score;
        });

        // Create UserProgress records from submissions
        const newProgressRecords = [];
        for (const [skill, data] of Object.entries(grouped)) {
          const avgLevel = data.count ? data.avgScore / data.count : 0;
          const progress = new UserProgress({
            user_id: objectId,
            skill_type: skill,
            current_level: avgLevel,
            target_score: 6.5, // Default target
            completed_exercises: data.count,
            created_at: new Date(),
            updated_at: new Date()
          });
          
          await progress.save();
          newProgressRecords.push(progress.toObject());
        }
        
        return res.json(newProgressRecords.map(p => ({
          id: p._id,
          user_id: p.user_id,
          skill_type: p.skill_type,
          current_level: p.current_level,
          target_score: p.target_score,
          completed_exercises: p.completed_exercises,
          created_at: p.created_at
        })));
      }
      
      // No submissions either, return empty array
      return res.json([]);
    }

    // Return existing progress records
    const result = progressRecords.map(p => ({
      id: p._id,
      user_id: p.user_id,
      skill_type: p.skill_type,
      current_level: p.current_level,
      target_score: p.target_score,
      completed_exercises: p.completed_exercises,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return res.json(result);
  } catch (err: any) {
    console.error('GET /users/:id/progress error', err);
    return res.status(500).json({ message: 'Failed to get progress', details: String(err?.message ?? err) });
  }
});

// PUT /users/:id/progress/:skillType/target
// Update target score for specific skill
router.put('/:id/progress/:skillType/target', async (req, res) => {
  const { id, skillType } = req.params;
  const { target_score } = req.body;
  
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  
  if (!skillType || !['listening', 'reading', 'writing', 'speaking'].includes(skillType)) {
    return res.status(400).json({ message: 'Invalid skill type' });
  }
  
  if (!target_score || typeof target_score !== 'number' || target_score < 0 || target_score > 9) {
    return res.status(400).json({ message: 'Invalid target score (must be 0-9)' });
  }
  
  try {
    // Convert string id to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);
    
    // Update or create UserProgress record
    const progress = await UserProgress.findOneAndUpdate(
      { user_id: objectId, skill_type: skillType },
      {
        $set: {
          target_score: target_score,
          updated_at: new Date()
        },
        $setOnInsert: {
          user_id: objectId,
          skill_type: skillType,
          current_level: 0,
          completed_exercises: 0,
          created_at: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    console.log(`[UserProgress] Updated target for user ${id} ${skillType}: ${target_score}`);
    return res.json({ 
      message: 'Target score updated successfully',
      progress: {
        id: progress._id,
        user_id: progress.user_id,
        skill_type: progress.skill_type,
        current_level: progress.current_level,
        target_score: progress.target_score,
        completed_exercises: progress.completed_exercises
      }
    });
  } catch (err: any) {
    console.error(`PUT /users/:id/progress/:skillType/target error`, err);
    return res.status(500).json({ message: 'Failed to update target score', details: String(err?.message ?? err) });
  }
});

export default router;
