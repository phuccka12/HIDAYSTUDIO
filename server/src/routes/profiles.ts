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

export default router;
