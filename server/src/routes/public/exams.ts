import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../../models/Exam';
import { parsePage } from '../../utils/parsePage';

const router = Router();

// Public: list published exams
router.get('/exams', async (req, res) => {
  const { q, tag, page, limit, published } = req.query;
  const { skip, limit: lim } = parsePage(req.query);
  const filter: any = {};
  if (published === undefined) filter.published = true; else filter.published = String(published) === 'true';
  if (tag) filter.tags = String(tag);
  if (q) {
    // try simple text search if index exists; fallback to regex on title
    filter.$or = [ { title: { $regex: String(q), $options: 'i' } }, { description: { $regex: String(q), $options: 'i' } } ];
  }
  const total = await Exam.countDocuments(filter);
  const items = await Exam.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).lean();
  res.json({ total, items });
});

// Public: get exam by slug or id
router.get('/exams/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;
  let exam = await Exam.findOne({ slug: slugOrId, published: true }).lean();
  if (!exam && mongoose.isValidObjectId(slugOrId)) {
    exam = await Exam.findById(slugOrId).lean();
    if (exam && !exam.published) return res.status(404).json({ message: 'Not found' });
  }
  if (!exam) return res.status(404).json({ message: 'Not found' });
  res.json(exam);
});

export default router;
