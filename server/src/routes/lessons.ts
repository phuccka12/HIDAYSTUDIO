import { Router } from 'express';
import mongoose from 'mongoose';
import Lesson from '../models/Lesson';
import User from '../models/User';

const router = Router();

const requireAdmin = async (req: any, res: any) => {
  const id = req.cookies['ielts_user'];
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
};

function parsePage(q: any) {
  const page = Math.max(1, parseInt(q.page as string || '1', 10));
  const limit = Math.max(1, Math.min(200, parseInt(q.limit as string || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Admin: list lessons
router.get('/admin/lessons', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { q, tag, published } = req.query;
  const { limit, skip } = parsePage(req.query);
  const filter: any = {};
  if (q) filter.$text = { $search: String(q) };
  if (tag) filter.tags = String(tag);
  if (published !== undefined) filter.published = String(published) === 'true';
  const total = await Lesson.countDocuments(filter);
  const items = await Lesson.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
  res.json({ total, items });
});

// Admin: create lesson
router.post('/admin/lessons', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { title, slug, description, content, tags, media } = req.body;
  if (!title) return res.status(400).json({ message: 'title required' });
  try {
    const lesson = await Lesson.create({ title, slug, description, content: content || '', tags: tags || [], media: media || [], authorId: admin._id });
    res.json({ ok: true, lesson });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to create lesson' });
  }
});

// Admin: get lesson by id
router.get('/admin/lessons/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const lesson = await Lesson.findById(id).lean();
  if (!lesson) return res.status(404).json({ message: 'Not found' });
  res.json(lesson);
});

// Admin: update lesson
router.put('/admin/lessons/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const allowed = ['title','slug','description','content','tags','media','published','scheduledAt'];
  const payload: any = {};
  for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
  try {
    const updated = await Lesson.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true, lesson: updated });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Failed to update' });
  }
});

// Admin: delete lesson
router.delete('/admin/lessons/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  await Lesson.findByIdAndDelete(id);
  res.json({ ok: true });
});

// Admin: publish/unpublish lesson
router.post('/admin/lessons/:id/publish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updated = await Lesson.findByIdAndUpdate(id, { published: true }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, lesson: updated });
});

router.post('/admin/lessons/:id/unpublish', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const updated = await Lesson.findByIdAndUpdate(id, { published: false }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, lesson: updated });
});

// Public: list published lessons
router.get('/lessons', async (req, res) => {
  const { q, tag, page, limit, published } = req.query;
  const { skip, limit: lim } = parsePage(req.query);
  const filter: any = {};
  if (published === undefined) filter.published = true; else filter.published = String(published) === 'true';
  if (tag) filter.tags = String(tag);
  if (q) {
    filter.$or = [ { title: { $regex: String(q), $options: 'i' } }, { description: { $regex: String(q), $options: 'i' } }, { content: { $regex: String(q), $options: 'i' } } ];
  }
  const total = await Lesson.countDocuments(filter);
  const items = await Lesson.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).lean();
  res.json({ total, items });
});

// Public: get lesson by slug or id
router.get('/lessons/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;
  let lesson = await Lesson.findOne({ slug: slugOrId, published: true }).lean();
  if (!lesson && mongoose.isValidObjectId(slugOrId)) {
    lesson = await Lesson.findById(slugOrId).lean();
    if (lesson && !lesson.published) return res.status(404).json({ message: 'Not found' });
  }
  if (!lesson) return res.status(404).json({ message: 'Not found' });
  res.json(lesson);
});

export default router;
