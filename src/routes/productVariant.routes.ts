import express from 'express';
import { home } from '../controllers/auth.controller';
import { createProductVariant, getProductVariant } from '../controllers/productVariant.controller';

const router = express.Router();

router.get('/', home);

router.get('/get-product-variant', getProductVariant);

router.post('/create-product-variant', createProductVariant);

export default router;