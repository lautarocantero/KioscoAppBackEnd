import express from 'express';
import { uploadReceipt } from "../controllers/receipt.controller";

const router = express.Router();

// ── POST / PUT / DELETE ───────────────────────────────────────────────────────
router.post("/", uploadReceipt);

export default router;