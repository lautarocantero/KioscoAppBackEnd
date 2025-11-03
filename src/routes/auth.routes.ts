import express from 'express';
import { home, register } from '../controllers/auth.controller';

const router = express.Router();

router.get('/', home)

router.post('/register', register)

export default router;