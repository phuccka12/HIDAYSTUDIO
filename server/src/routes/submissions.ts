import { Router } from 'express';
import Submission from '../models/Submission';

const router = Router();

router.post('/', async (req, res) => {
  const payload = req.body;
  const doc = await Submission.create(payload);
  res.json(doc);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const doc = await Submission.findById(id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const list = await Submission.find({ user_id: userId }).sort({ created_at: -1 }).lean();
  res.json(list);
});

export default router;
