import { Request, Response } from "express";
import multer from "multer";
import { handleControllerError } from "../utils/handleControllerError";
import { previewReceiptImport, confirmReceiptImport } from "../services/receipts/receiptImportService";
import type {
  ReceiptPreviewResultType,
  ReceiptImportResultType,
  ReceiptProductDocType,
  ReceiptPresentationDocType,
} from "@typings/receipt";

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

const uploadSingle = upload.single("file");

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con boletas 🕹️                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Tipo   | Link              | Función        | Descripción                                | Params            | Return         ║
║--------|-------------------|-----------------|--------------------------------------------|--------------------|---------------║
║ POST   | /receipts/preview | previewReceipt  | Analiza xls/xlsx, arma docs, NO inserta     | file: multipart    | ReceiptPreview ║
║ POST   | /receipts/confirm | confirmReceipt  | Inserta los docs devueltos por el preview   | JSON (preview)     | ReceiptImport  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function previewReceipt(req: Request, res: Response): Promise<void> {
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
      const preview: ReceiptPreviewResultType = await previewReceiptImport(req.file.buffer);
      res.status(200).json(preview);
    } catch (error: unknown) {
      handleControllerError(res, error);
    }
  });
}

interface ConfirmReceiptBody {
  stats:         ReceiptPreviewResultType["stats"];
  pendingReview: ReceiptPreviewResultType["pendingReview"];
  products:      ReceiptProductDocType[];
  presentations: ReceiptPresentationDocType[];
}

export async function confirmReceipt(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<ConfirmReceiptBody>;

  if (!Array.isArray(body.products) || !Array.isArray(body.presentations)) {
    res.status(400).json({ message: "Payload inválido: se esperaban products y presentations." });
    return;
  }

  try {
    const insertResult = await confirmReceiptImport(body.products, body.presentations);
    const result: ReceiptImportResultType = {
      stats: body.stats ?? {
        totalRows: 0, totalProducts: 0, multiPresentation: 0,
        rubroFallback: 0, noSize: 0, noModelType: 0, noBarcode: 0,
      },
      pendingReview: body.pendingReview ?? [],
      insertResult,
    };
    res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}