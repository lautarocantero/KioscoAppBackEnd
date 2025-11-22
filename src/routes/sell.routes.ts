import express from 'express';
import { createSell, home } from '../controllers/sell.controller';

const router = express.Router();

router.get('/', home);

router.post('/crete-sell', createSell);


export default router;