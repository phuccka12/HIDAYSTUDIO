import { Router } from 'express';
import adminExams from './admin/exams';
import publicExams from './public/exams';
import attempts from './attempts';

const router = Router();

// mount routers: admin routes prefixed with /admin
router.use('/admin', adminExams);

// public exam listing / details
router.use('/', publicExams);

// attempts and start/save/submit
router.use('/', attempts);

export default router;
