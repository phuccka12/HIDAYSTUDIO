import { Router } from 'express';
import Prompt from '../models/Prompt';

const router = Router();

/**
 * GET /writing/random?task_type=IELTS_Task2
 * Return one random prompt (fallback to any if none for requested type)
 */
router.get('/random', async (req, res) => {
  try {
    const task_type = String(req.query.task_type || 'IELTS_Task2');
    // Try to sample one prompt matching task_type
    let docs = await Prompt.aggregate([
      { $match: { task_type } },
      { $sample: { size: 1 } }
    ]);

    // fallback: sample any prompt if none for requested type
    if (!docs || docs.length === 0) {
      docs = await Prompt.aggregate([{ $sample: { size: 1 } }]);
      if (!docs || docs.length === 0) {
        return res.status(404).json({ error: 'No prompts found' });
      }
      return res.json({ prompt: docs[0].text, task_type: docs[0].task_type });
    }

    return res.json({ prompt: docs[0].text, task_type });
  } catch (err: any) {
    console.error('GET /writing/random error', err);
    return res.status(500).json({ error: 'Failed to get random prompt', details: String(err?.message ?? err) });
  }
});

export default router;