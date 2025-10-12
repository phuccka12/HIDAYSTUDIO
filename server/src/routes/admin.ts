import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Submission from '../models/Submission';

const router = Router();

// Simple admin guard using cookie (dev). In production use real auth and RBAC.
// Accepts users who have role === 'admin' in DB OR whose email is listed in ADMIN_EMAILS env var.
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

  // Check ADMIN_EMAILS env var (comma-separated list)
  const adminListRaw = process.env.ADMIN_EMAILS || '';
  const adminList = adminListRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  console.debug('requireAdmin: adminList=', adminList);
  if (adminList.includes((user.email || '').toLowerCase())) return user;

  res.status(403).json({ message: 'Forbidden' });
  return null;
};

router.get('/stats', async (_req, res) => {
  const totalUsers = await User.countDocuments();
  const totalSubmissions = await Submission.countDocuments();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUsers = await User.countDocuments({ updated_at: { $gte: thirtyDaysAgo } });

  res.json({ totalUsers, totalSubmissions, activeUsers, databaseSize: 'N/A' });
});

router.get('/recent-submissions', async (req, res) => {
  const limit = parseInt((req.query.limit as string) || '10', 10);
  const items = await Submission.find().sort({ created_at: -1 }).limit(limit).lean();
  // populate user email
  const enriched = await Promise.all(items.map(async (it: any) => {
    let user: any = null;
    if (it.user_id && mongoose.isValidObjectId(it.user_id)) {
      user = await User.findById(it.user_id).lean();
    }
    return { ...it, profiles: { email: user?.email } };
  }));
  res.json(enriched);
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
