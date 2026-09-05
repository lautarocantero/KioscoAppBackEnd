import { Request, Response } from "express";
import multer from "multer";
import { handleControllerError } from "../utils/handleControllerError";
import { previewReceiptImport, confirmReceiptImport } from "../services/receipts/receiptImportService";
import type {
  ReceiptPreviewResultType,
  ReceiptImportResultType,
  ReceiptProductDoc,
  ReceiptMatchedPresentationDocType,
} from "@typings/receipt";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // 👇 Solo .xlsx: la migración de xlsx (SheetJS) a exceljs (sin CVEs
    // abiertos) dejó sin soporte el binario legacy .xls (pre-2007, OLE2),
    // que exceljs no parsea. Ver docs/usefull/securityAudit.md.
    const ok = /\.xlsx$/i.test(file.originalname);
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo no permitido. Usá .xlsx"));
    }
  },
});

const uploadSingle = upload.single("file");

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
      const preview: ReceiptPreviewResultType = await previewReceiptImport(req.file.buffer, req.kioscoId!);
      res.status(200).json(preview);
    } catch (error: unknown) {
      handleControllerError(res, error);
    }
  });
}

interface ConfirmReceiptBody {
  stats:                    ReceiptPreviewResultType["stats"];
  pendingReview:            ReceiptPreviewResultType["pendingReview"];
  products:                 ReceiptProductDoc[];
  presentations:            ReceiptMatchedPresentationDocType[];
  // El front reenvía tal cual lo que recibió en el preview: no se
  // recalcula acá, solo se transporta hasta el resultado final para
  // que el resumen pueda mostrar el total real de productos.
  productsAlreadyExisting:  string[];
}

export async function confirmReceipt(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<ConfirmReceiptBody>;

  if (!Array.isArray(body.products) || !Array.isArray(body.presentations)) {
    res.status(400).json({ message: "Payload inválido: se esperaban products y presentations." });
    return;
  }

  try {
    // El front reenvía tal cual lo que recibió en el preview — nunca se confía en el
    // kiosco_id que viene en ese payload: se pisa acá con el del header validado.
    const products = body.products.map((p) => ({ ...p, kiosco_id: req.kioscoId! }));
    const presentations = body.presentations.map((p) => ({ ...p, kiosco_id: req.kioscoId! }));

    const { skippedByPlanLimit, ...insertResult } = await confirmReceiptImport(products, presentations, req.kioscoId!);
    const result: ReceiptImportResultType = {
      stats: body.stats ?? {
        totalRows: 0, totalProducts: 0, multiPresentation: 0,
        rubroFallback: 0, noSize: 0, noModelType: 0, noBarcode: 0,
      },
      pendingReview: body.pendingReview ?? [],
      insertResult,
      productsAlreadyExisting: body.productsAlreadyExisting ?? [],
      skippedByPlanLimit,
    };
    res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}