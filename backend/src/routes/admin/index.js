import { Router } from 'express';
import authRouter from './auth.js';
import statsRouter from './stats.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';

const router = Router();

// Auth routes (login is unprotected; logout needs session)
router.use(authRouter);

// All stats routes require admin session
router.use('/stats', requireAdmin, statsRouter);

export default router;
