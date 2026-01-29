import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFarmerProducts,
} from '../controllers/productController';
import { authMiddleware, roleGuard } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, roleGuard(['FARMER']), createProduct);
router.get('/', getProducts);
router.get('/farmer/my-products', authMiddleware, roleGuard(['FARMER']), getFarmerProducts);
router.get('/:id', getProductById);
router.put('/:id', authMiddleware, roleGuard(['FARMER']), updateProduct);
router.delete('/:id', authMiddleware, roleGuard(['FARMER']), deleteProduct);

export default router;
