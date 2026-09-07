import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { PresentationModel } from '../../models/presentationModel';
import { PresentationAnalyticsService } from '../../services/presentationAnalysticsService';
import {
    createPresentation,
    deletePresentation,
    editPresentation,
    getAvailableCategories,
    getPresentationAnalytics,
    getPresentationByBarcode,
    getPresentationByCategory,
    getPresentationById,
    getPresentationByModelSize,
    getPresentationByPrice,
    getPresentationByProductId,
    getPresentationByStatus,
    getPresentationByStock,
    getPresentations,
    getPresentationsWithStockByProductId,
    home,
    searchPresentationsByProductId,
} from '../presentation.controller';

vi.mock('../../models/presentationModel', () => ({
    PresentationModel: {
        getPresentations: vi.fn(),
        getPresentationByField: vi.fn(),
        getPresentationsByCategory: vi.fn(),
        searchByProductIdAndTerm: vi.fn(),
        getPresentationsWithStockByProductId: vi.fn(),
        create: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../../services/presentationAnalysticsService', () => ({
    PresentationAnalyticsService: { getAnalytics: vi.fn() },
}));

const mockedPresentationModel = vi.mocked(PresentationModel);
const mockedPresentationAnalyticsService = vi.mocked(PresentationAnalyticsService);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, ...overrides }) as unknown as T;

describe('presentation.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('home', () => {
        it('devuelve 200 con el listado de endpoints en HTML', async () => {
            const res = buildRes();

            await home(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('/create-presentation'));
        });
    });

    describe('getPresentations', () => {
        it('devuelve las presentaciones del kiosco activo', async () => {
            mockedPresentationModel.getPresentations.mockResolvedValueOnce([{ _id: 'pres-1' }] as never);
            const res = buildRes();

            await getPresentations(buildReq(), res);

            expect(mockedPresentationModel.getPresentations).toHaveBeenCalledWith('kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el modelo lanza un Error', async () => {
            mockedPresentationModel.getPresentations.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await getPresentations(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getPresentationById', () => {
        it('filtra por _id desde el path param', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([{ _id: 'pres-1' }] as never);
            const res = buildRes();

            await getPresentationById(buildReq({ params: { product_presentation_id: 'pres-1' } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', '_id', 'pres-1', 'string');
        });
    });

    describe('getPresentationByProductId', () => {
        it('filtra por product_id desde el path param', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([{ _id: 'pres-1' }] as never);
            const res = buildRes();

            await getPresentationByProductId(buildReq({ params: { product_id: 'prod-1' } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', 'product_id', 'prod-1', 'string');
        });
    });

    describe('getPresentationsWithStockByProductId', () => {
        it('devuelve solo presentaciones con stock', async () => {
            mockedPresentationModel.getPresentationsWithStockByProductId.mockResolvedValueOnce([{ _id: 'pres-1' }] as never);
            const res = buildRes();

            await getPresentationsWithStockByProductId(buildReq({ params: { product_id: 'prod-1' } }), res);

            expect(mockedPresentationModel.getPresentationsWithStockByProductId).toHaveBeenCalledWith('kiosco-1', 'prod-1');
        });
    });

    describe('getPresentationByStock', () => {
        it('filtra por stock desde el body', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getPresentationByStock(buildReq({ body: { stock: 5 } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', 'stock', 5, 'number');
        });
    });

    describe('getPresentationByPrice', () => {
        it('filtra por price desde el body', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getPresentationByPrice(buildReq({ body: { price: 1000 } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', 'price', 1000, 'number');
        });
    });

    describe('getPresentationByStatus', () => {
        it('filtra por status desde el body', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getPresentationByStatus(buildReq({ body: { status: 'available' } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', 'status', 'available', 'string');
        });
    });

    describe('getPresentationByModelSize', () => {
        it('filtra por model_size desde el body', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getPresentationByModelSize(buildReq({ body: { model_size: 500 } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', 'model_size', 500, 'number');
        });
    });

    describe('searchPresentationsByProductId', () => {
        it('busca con el término de la query string', async () => {
            mockedPresentationModel.searchByProductIdAndTerm.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await searchPresentationsByProductId(buildReq({ params: { product_id: 'prod-1' }, query: { term: 'coca' } }), res);

            expect(mockedPresentationModel.searchByProductIdAndTerm).toHaveBeenCalledWith('kiosco-1', 'prod-1', 'coca');
        });

        it('usa string vacío si no viene term', async () => {
            mockedPresentationModel.searchByProductIdAndTerm.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await searchPresentationsByProductId(buildReq({ params: { product_id: 'prod-1' }, query: {} }), res);

            expect(mockedPresentationModel.searchByProductIdAndTerm).toHaveBeenCalledWith('kiosco-1', 'prod-1', '');
        });
    });

    describe('getPresentationByBarcode', () => {
        it('filtra por barcode desde el path param', async () => {
            mockedPresentationModel.getPresentationByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getPresentationByBarcode(buildReq({ params: { barcode: '7790000000012' } }), res);

            expect(mockedPresentationModel.getPresentationByField).toHaveBeenCalledWith('kiosco-1', 'barcode', '7790000000012', 'string');
        });
    });

    describe('getPresentationByCategory', () => {
        it('filtra por categoría desde el body', async () => {
            mockedPresentationModel.getPresentationsByCategory.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getPresentationByCategory(buildReq({ body: { category: 'bebidas' } }), res);

            expect(mockedPresentationModel.getPresentationsByCategory).toHaveBeenCalledWith('kiosco-1', 'bebidas');
        });
    });

    describe('getAvailableCategories', () => {
        it('devuelve el listado fijo de categorías', async () => {
            const res = buildRes();

            await getAvailableCategories(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(expect.any(Array));
        });
    });

    describe('getPresentationAnalytics', () => {
        it('pasa los filtros de query al servicio de analítica', async () => {
            mockedPresentationAnalyticsService.getAnalytics.mockResolvedValueOnce({ total: 10 } as never);
            const res = buildRes();

            await getPresentationAnalytics(buildReq({
                params: { presentation_id: 'pres-1' },
                query: { start_date: '2026-01-01', end_date: '2026-01-31', seller_id: 'seller-1' },
            }), res);

            expect(mockedPresentationAnalyticsService.getAnalytics).toHaveBeenCalledWith('kiosco-1', 'pres-1', '2026-01-01', '2026-01-31', 'seller-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('createPresentation', () => {
        it('convierte los campos numéricos y booleanos del body antes de crear', async () => {
            mockedPresentationModel.create.mockResolvedValueOnce('pres-1');
            const res = buildRes();

            await createPresentation(buildReq({
                body: {
                    product_id: 'prod-1', name: 'Coca', description: 'Gaseosa', sale_type: 'unit',
                    is_perishable: 'true', min_stock: '5', stock: '10', price: '1000',
                    image_url: 'http://x/a.png',
                },
            }), res);

            expect(mockedPresentationModel.create).toHaveBeenCalledWith('kiosco-1', expect.objectContaining({
                is_perishable: true, min_stock: 5, stock: 10, price: 1000, image_url: 'http://x/a.png',
            }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'pres-1', message: 'Product presentation created successfully' });
        });

        it('usa la ruta del archivo subido como image_url si hay un archivo', async () => {
            mockedPresentationModel.create.mockResolvedValueOnce('pres-1');
            const res = buildRes();

            await createPresentation(buildReq({
                body: { product_id: 'prod-1', name: 'Coca', description: 'Gaseosa', sale_type: 'unit', min_stock: '5', stock: '10', price: '1000' },
                file: { path: '/uploads/coca.png' },
            }), res);

            expect(mockedPresentationModel.create).toHaveBeenCalledWith('kiosco-1', expect.objectContaining({ image_url: '/uploads/coca.png' }));
        });

        it('responde 400 si el modelo rechaza la creación (ej. límite de catálogo)', async () => {
            mockedPresentationModel.create.mockRejectedValueOnce(new Error('This kiosco reached its plan catalog limit (products + presentations)'));
            const res = buildRes();

            await createPresentation(buildReq({ body: { product_id: 'prod-1', name: 'Coca' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('editPresentation', () => {
        it('edita la presentación del path param convirtiendo los campos numéricos', async () => {
            mockedPresentationModel.edit.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await editPresentation(buildReq({
                params: { presentation_id: 'pres-1' },
                body: { price: '1200', stock: '8', min_stock: '3', is_perishable: 'false' },
            }), res);

            expect(mockedPresentationModel.edit).toHaveBeenCalledWith('kiosco-1', expect.objectContaining({
                _id: 'pres-1', price: 1200, stock: 8, min_stock: 3, is_perishable: false,
            }));
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si no existe la presentación', async () => {
            mockedPresentationModel.edit.mockRejectedValueOnce(new Error('There is not any presentation with that id'));
            const res = buildRes();

            await editPresentation(buildReq({ params: { presentation_id: 'pres-1' }, body: {} }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deletePresentation', () => {
        it('elimina la presentación del kiosco activo', async () => {
            mockedPresentationModel.delete.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await deletePresentation(buildReq({ body: { _id: 'pres-1' } }), res);

            expect(mockedPresentationModel.delete).toHaveBeenCalledWith('kiosco-1', { _id: 'pres-1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
