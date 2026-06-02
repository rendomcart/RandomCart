import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getAdminProducts,
  getLowStockProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/admin/all', protect, admin, getAdminProducts);
router.get('/inventory/low', protect, admin, getLowStockProducts);
router.get('/id/:id', protect, admin, getProductById);
router.get('/:slug', getProductBySlug);

// Max 5 images as per Section 5 constraints
router.post('/', protect, admin, upload.array('images', 5), createProduct);
router.put('/:id', protect, admin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
