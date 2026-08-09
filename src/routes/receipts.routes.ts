import { Router } from "express";
import { uploadReceipt } from "../controllers/receipt.controller";

const router = Router();

router.post("/receipts", uploadReceipt);

export default router;