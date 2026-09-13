import express from 'express';
import { previewReceipt, confirmReceipt } from "../controllers/receipt.controller";
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireKioscoContext } from '../middlewares/kioscoMiddleware';
import { requireActiveMembership } from '../middlewares/requireActiveMembership';

const router = express.Router();

router.use(authMiddleware, requireActiveMembership, requireKioscoContext);

router.post("/preview", previewReceipt);
router.post("/confirm", confirmReceipt);

export default router;