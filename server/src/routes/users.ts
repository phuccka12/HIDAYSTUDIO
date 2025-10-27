import { Router } from 'express';
import Submission from '../models/Submission';
import mongoose from 'mongoose';

const router = Router();

// GET /users/:id/progress
// Lightweight endpoint: derive simple progress from submissions (dev-friendly).
router.get('/:id/progress', async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    // Aggregate submissions by task type to derive a simple progress summary
    const userId = String(id);
    const subs = await Submission.find({ user_id: userId }).lean();

    if (!subs || subs.length === 0) {
      // Return empty array (frontend can show sample data or call seed)
      return res.status(200).json([]);
    }

    // Build simple progress items: for demo we map task types to skill_type
    const mapTaskToSkill = (taskType: string | undefined) => {
      if (!taskType) return 'writing';
      const t = taskType.toLowerCase();
      if (t.includes('write') || t.includes('writing') || t.includes('ielts')) return 'writing';
      if (t.includes('read')) return 'reading';
      if (t.includes('listen')) return 'listening';
      if (t.includes('speak') || t.includes('speaking')) return 'speaking';
      return 'writing';
    };

    const grouped: Record<string, { count: number; avgScore: number; items: any[] }> = {};
    subs.forEach(s => {
      const skill = mapTaskToSkill(s.task_type as any);
      if (!grouped[skill]) grouped[skill] = { count: 0, avgScore: 0, items: [] };
      grouped[skill].count += 1;
      const score = typeof s.ai_score === 'number' ? s.ai_score : 0;
      grouped[skill].avgScore += score;
      grouped[skill].items.push(s);
    });

    const result = Object.keys(grouped).map((skill, idx) => {
      const g = grouped[skill];
      const avg = g.count ? +(g.avgScore / g.count).toFixed(2) : 0;
      return {
        id: `${id}-${idx}`,
        user_id: id,
        skill_type: skill,
        current_level: avg || 0,
        // Note: target_score is intentionally omitted — use real stored target from DB when available
        completed_exercises: g.count,
        created_at: new Date().toISOString(),
      };
    });

    return res.json(result);
  } catch (err: any) {
    console.error('GET /users/:id/progress error', err);
    return res.status(500).json({ message: 'Failed to compute progress', details: String(err?.message ?? err) });
  }
});

export default router;
