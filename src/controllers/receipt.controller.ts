import { Request, Response } from "express";
import multer from "multer";
import { handleControllerError } from "../utils/handleControllerError";
import { processReceiptFile } from "../services/receipts/receiptImportService";
import type { ReceiptImportResultType } from "@typings/receipt";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, igual al front
  fileFilter: (_req, file, cb) => {
    const ok = /\.(xlsx|xls)$/i.test(file.originalname);
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo no permitido. Usá .xlsx o .xls"));
    }
  },
});

// Se invoca manualmente (en vez de como middleware de router) para poder
// canalizar sus errores (formato inválido, tamaño excedido) por
// handleControllerError igual que el resto de los controllers.
const uploadSingle = upload.single("file");

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con boletas 🕹️                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Tipo   | Link       | Función        | Descripción                          | Params            | Return                | Auth Req | Status      ║
║--------|------------|-----------------|----------------------------------------|--------------------|------------------------|----------|-------------║
║ POST   | /receipts  | uploadReceipt   | Importa boleta xls/xlsx a productos    | file: multipart    | JSON ReceiptImportResult | No     | 200,400,500 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 uploadReceipt → Recibe un xls/xlsx, lo analiza, agrupa e inserta productos/presentations                               ║
║ 📥 Entrada: multipart/form-data, campo "file"                                                                             ║
║ 📤 Salida: JSON ReceiptImportResult (stats, pendingReview, insertResult)                                                  ║
║ 🛠️ Errores: handleControllerError (incluye errores de multer: formato/tamaño)                                            ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function uploadReceipt(req: Request, res: Response): Promise<void> {
  uploadSingle(req, res, async (err: unknown) => {
    if (err) {
      handleControllerError(res, err);
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No se recibió ningún archivo." });
      return;
    }

    try {
      const result: ReceiptImportResultType = await processReceiptFile(req.file.buffer);
      res.status(200).json(result);
    } catch (error: unknown) {
      handleControllerError(res, error);
    }
  });
}