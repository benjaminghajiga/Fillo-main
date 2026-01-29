import { Router } from 'express';
import {
  initiatePaystackPayment,
  handlePaystackWebhook,
  initiateStacksPayment,
  verifyStacksTransaction,
  getPaymentStatus,
} from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Paystack routes
router.post('/paystack/initiate', authMiddleware, initiatePaystackPayment);
router.post('/paystack/webhook', handlePaystackWebhook);

// Stacks crypto routes
router.post('/stacks/initiate', authMiddleware, initiateStacksPayment);
router.post('/stacks/verify', authMiddleware, verifyStacksTransaction);

// General payment status
router.get('/:paymentId', getPaymentStatus);

export default router;
