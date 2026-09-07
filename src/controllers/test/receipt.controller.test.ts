import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { previewReceiptImport, confirmReceiptImport } from '../../services/receipts/receiptImportService';
import { confirmReceipt, previewReceipt } from '../receipt.controller';

vi.mock('multer', () => {
    const single = vi.fn(() => (req: Request, _res: unknown, cb: (err?: unknown) => void) => {
        const mockedFile = (req as unknown as { __mockFile?: unknown }).__mockFile;
        if (mockedFile !== undefined) (req as unknown as { file?: unknown }).file = mockedFile;
        cb((req as unknown as { __mockUploadError?: unknown }).__mockUploadError);
    });
    const multerMock = Object.assign(() => ({ single }), { memoryStorage: vi.fn() });
    return { default: multerMock };
});

vi.mock('../../services/receipts/receiptImportService', () => ({
    previewReceiptImport: vi.fn(),
    confirmReceiptImport: vi.fn(),
}));

const mockedPreviewReceiptImport = vi.mocked(previewReceiptImport);
const mockedConfirmReceiptImport = vi.mocked(confirmReceiptImport);

const buildReq = (overrides: Record<string, unknown> = {}): Request =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, ...overrides }) as unknown as Request;

describe('receipt.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('previewReceipt', () => {
        it('devuelve el preview del archivo subido', async () => {
            mockedPreviewReceiptImport.mockResolvedValueOnce({ report: [] } as never);
            const res = buildRes();
            const req = buildReq({ __mockFile: { buffer: Buffer.from('x') } });

            await previewReceipt(req, res);

            expect(mockedPreviewReceiptImport).toHaveBeenCalledWith(Buffer.from('x'), 'kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si no se recibió ningún archivo', async () => {
            const res = buildRes();
            const req = buildReq();

            await previewReceipt(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'No se recibió ningún archivo.' });
            expect(mockedPreviewReceiptImport).not.toHaveBeenCalled();
        });

        it('propaga el error de multer (ej. extensión no permitida) via handleControllerError', async () => {
            const res = buildRes();
            const req = buildReq({ __mockUploadError: new Error('Formato de archivo no permitido. Usá .xlsx') });

            await previewReceipt(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Formato de archivo no permitido. Usá .xlsx' });
        });

        it('responde 400 si el servicio de análisis falla', async () => {
            mockedPreviewReceiptImport.mockRejectedValueOnce(new Error('archivo corrupto'));
            const res = buildRes();
            const req = buildReq({ __mockFile: { buffer: Buffer.from('x') } });

            await previewReceipt(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('confirmReceipt', () => {
        it('pisa el kiosco_id de cada item con el del header validado antes de insertar', async () => {
            mockedConfirmReceiptImport.mockResolvedValueOnce({ insertedProducts: 1, insertedPresentations: 1, skippedByPlanLimit: 0 } as never);
            const res = buildRes();

            await confirmReceipt(buildReq({
                body: {
                    products: [{ _id: 'p1', kiosco_id: 'otro-kiosco' }],
                    presentations: [{ _id: 'pr1', kiosco_id: 'otro-kiosco' }],
                    stats: { totalRows: 1 },
                    pendingReview: [],
                    productsAlreadyExisting: [],
                },
            }), res);

            expect(mockedConfirmReceiptImport).toHaveBeenCalledWith(
                [{ _id: 'p1', kiosco_id: 'kiosco-1' }],
                [{ _id: 'pr1', kiosco_id: 'kiosco-1' }],
                'kiosco-1',
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si products/presentations no son arrays', async () => {
            const res = buildRes();

            await confirmReceipt(buildReq({ body: { products: 'no-es-array' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockedConfirmReceiptImport).not.toHaveBeenCalled();
        });

        it('responde 400 si el import falla', async () => {
            mockedConfirmReceiptImport.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await confirmReceipt(buildReq({ body: { products: [], presentations: [] } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
