import express from 'express';
import { checkAuth, home, login, logout, register } from '../controllers/auth.controller';

const router = express.Router();

router.get('/', home);

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.post('/checkAuth', checkAuth);

export default router;