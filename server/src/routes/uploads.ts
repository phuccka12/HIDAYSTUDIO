import { Router } from 'express';
// use require() to avoid ESM/CommonJS interop issues at runtime
const multer = require('multer');
import * as path from 'path';
import * as fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/User';

const router = Router();

// ensure upload dir exists
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const requireAdmin = async (req: any, res: any) => {
  const id = req.cookies['ielts_user'];
  if (!id || !mongoose.isValidObjectId(id)) { res.status(401).json({ message: 'Not authenticated' }); return null; }
  const user = await User.findById(id).lean();
  if (!user) { res.status(403).json({ message: 'Forbidden' }); return null; }
  if (user.role === 'admin') return user;
  const adminListRaw = process.env.ADMIN_EMAILS || '';
  const adminList = adminListRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  if (adminList.includes((user.email || '').toLowerCase())) return user;
  res.status(403).json({ message: 'Forbidden' });
  return null;
};

// Admin upload
router.post('/admin/uploads', upload.single('file'), async (req: any, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const urlPath = `/uploads/${req.file.filename}`;
  res.json({ ok: true, url: urlPath, filename: req.file.filename });
});

export default router;
