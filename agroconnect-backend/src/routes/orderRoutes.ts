import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getFarmerOrders,
} from '../controllers/orderController';
import { authMiddleware, roleGuard } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, roleGuard(['BUYER']), createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/farmer/my-orders', authMiddleware, roleGuard(['FARMER']), getFarmerOrders);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/status', authMiddleware, updateOrderStatus);

export default router;
