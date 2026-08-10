import express from 'express';
import { previewReceipt, confirmReceipt } from "../controllers/receipt.controller";

const router = express.Router();

router.post("/preview", previewReceipt);
router.post("/confirm", confirmReceipt);

export default router;