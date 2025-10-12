import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';

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

// Update profile
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updates = req.body;
  const user = await User.findByIdAndUpdate(id, { ...updates, updated_at: new Date() }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

export default router;
