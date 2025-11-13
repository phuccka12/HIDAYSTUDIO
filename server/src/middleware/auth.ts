import mongoose from 'mongoose';
import User from '../models/User';

// Middleware to require authentication (extract user from cookie)
export default async function requireAuth(req: any, res: any, next: any) {
  const id = req.cookies && req.cookies['ielts_user'];
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await User.findById(id).lean();
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }
  // Attach user to request
  req.user = user;
  next();
}
