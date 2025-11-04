import express from 'express';
import { home, login, register } from '../controllers/auth.controller';

const router = express.Router();

router.get('/', home);

router.post('/register', register);

router.post('/login', login);

// router.post('/logout', logout);

export default router;