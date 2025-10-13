import { Router } from 'express';
import examsRouter from './exams';
import lessonsRouter from './lessons';

const router = Router();

// mount sub-routers; they keep the same paths as before
router.use('/', examsRouter);
router.use('/', lessonsRouter);

export default router;

