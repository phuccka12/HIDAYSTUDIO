import mongoose from 'mongoose';
import User from '../models/User';

export default async function requireAdmin(req: any, res: any) {
  const id = req.cookies && req.cookies['ielts_user'];
  if (!id || !mongoose.isValidObjectId(id)) {
    res.status(401).json({ message: 'Not authenticated' });
    return null;
  }
  const user = await User.findById(id).lean();
  if (!user) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  if (user.role === 'admin') return user;
  const adminListRaw = process.env.ADMIN_EMAILS || '';
  const adminList = adminListRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  if (adminList.includes((user.email || '').toLowerCase())) return user;
  res.status(403).json({ message: 'Forbidden' });
  return null;
}
