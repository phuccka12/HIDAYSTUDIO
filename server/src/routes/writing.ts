import { Router } from 'express';
import Prompt from '../models/Prompt';

const router = Router();

// Get all prompts with optional filtering
router.get('/prompts', async (req, res) => {
  try {
    const { task, difficulty, topic, limit = 20 } = req.query;
    const filter: any = {};

    // Map short task names (task1/task2) to stored task_type values
    if (task) {
      let tt = String(task);
      if (tt === 'task2') tt = 'IELTS_Task2';
      if (tt === 'task1') tt = 'IELTS_Task1';
      filter.task_type = tt;
    }

    // topic may be stored in tags array
    if (topic) filter.tags = String(topic);
    // difficulty field not present on Prompt by default; keep if provided
    if (difficulty) filter.difficulty = difficulty;
    
    const prompts = await Prompt.find(filter)
      .limit(Number(limit))
      .sort({ created_at: -1 });
    
    res.json(prompts);
  } catch (err) {
    console.error('GET /writing/prompts error', err);
    res.status(500).json({ error: 'Failed to get prompts' });
  }
});

// Get random prompt
router.get('/prompts/random', async (req, res) => {
  try {
    const { task, difficulty } = req.query;
    const filter: any = {};

    if (task) {
      let tt = String(task);
      if (tt === 'task2') tt = 'IELTS_Task2';
      if (tt === 'task1') tt = 'IELTS_Task1';
      filter.task_type = tt;
    }
    if (difficulty) filter.difficulty = difficulty;
    
    const prompts = await Prompt.aggregate([
      { $match: filter },
      { $sample: { size: 1 } }
    ]);
    
    if (!prompts || prompts.length === 0) {
      return res.status(404).json({ error: 'No prompts found' });
    }
    
    // Return format that frontend expects: { prompt: "...", task_type: "..." }
    const doc = prompts[0];
    res.json({ 
      prompt: doc.text, 
      task_type: doc.task_type,
      tags: doc.tags 
    });
  } catch (err) {
    console.error('GET /writing/prompts/random error', err);
    res.status(500).json({ error: 'Failed to get random prompt' });
  }
});


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