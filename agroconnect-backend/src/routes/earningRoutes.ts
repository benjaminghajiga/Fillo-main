import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getFarmerEarnings,
  getEarningsStats,
  getMonthlyEarnings,
  createEarning,
  updateEarningStatus,
  withdrawEarnings,
} from '../controllers/earningController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get farmer's earnings
router.get('/', getFarmerEarnings);

// Get earnings statistics
router.get('/stats', getEarningsStats);

// Get monthly earnings breakdown
router.get('/monthly', getMonthlyEarnings);

// Create earning record
router.post('/', createEarning);

// Update earning status
router.patch('/:id', updateEarningStatus);

// Withdraw earnings
router.post('/withdraw', withdrawEarnings);

export default router;
