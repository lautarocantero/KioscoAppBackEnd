import express from 'express';
import { createProduct, getProducts } from '../controllers/product.controller';

const router = express.Router();

router.get('/', getProducts);

// router.get('/product-id', getProductById);

router.post('/create-product', createProduct);

// router.post('/edit-product', editProductById);t

// router.delete('/product-id', deleteProductById);

export default router;