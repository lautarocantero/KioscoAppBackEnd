import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import type {
    CreateSellRequestType,
    EditSellRequestType,
    GetSellsByDateRequestType,
    GetSellsByProductRequestType,
    GetSellsBySellerRequestType,
} from '@typings/sell';
import { buildRes } from '../../test/controllerTestUtils';
import { SellModel } from '../../models/sellModel';
import { PresentationModel } from '../../models/presentationModel';
import { NotificationModel } from '../../models/notificationModel';
import { MonthlyReportService } from '../../services/monthlyReportService';
import {
    createSell,
    deleteSell,
    editSell,
    getMonthlySalesReport,
    getMonthlySalesReportDetail,
    getSellById,
    getSells,
    getSellsByDate,
    getSellsByProduct,
    getSellsBySeller,
    getTodaySellsCount,
    home,
    searchSells,
} from '../sell.controller';

vi.mock('../../models/sellModel', () => ({
    SellModel: {
        getSells: vi.fn(),
        getSellsByField: vi.fn(),
        getSellsByProduct: vi.fn(),
        getTodaySellsCount: vi.fn(),
        getMonthlySummary: vi.fn(),
        searchSells: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        edit: vi.fn(),
    },
}));

vi.mock('../../models/presentationModel', () => ({
    PresentationModel: { decreaseStock: vi.fn() },
}));

vi.mock('../../models/notificationModel', () => ({
    NotificationModel: {
        createLowStockNotification: vi.fn(),
        createSaleNotification: vi.fn(),
    },
}));

vi.mock('../../services/monthlyReportService', () => ({
    MonthlyReportService: { getDetail: vi.fn() },
}));

const mockedSellModel = vi.mocked(SellModel);
const mockedPresentationModel = vi.mocked(PresentationModel);
const mockedNotificationModel = vi.mocked(NotificationModel);
const mockedMonthlyReportService = vi.mocked(MonthlyReportService);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, ...overrides }) as unknown as T;

describe('sell.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('home', () => {
        it('devuelve 200 con el listado de endpoints en HTML', async () => {
            const res = buildRes();

            await home(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('API de Ventas de Kiosco'));
        });
    });

    describe('getSells', () => {
        it('devuelve las ventas con paginación', async () => {
            mockedSellModel.getSells.mockResolvedValueOnce([{ _id: '1' }] as never);
            const res = buildRes();

            await getSells(buildReq({ query: { limit: '10', offset: '5' } }), res);

            expect(mockedSellModel.getSells).toHaveBeenCalledWith('kiosco-1', 10, 5);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: [{ _id: '1' }],
                pagination: { limit: 10, offset: 5, count: 1 },
            });
        });

        it('usa límites por defecto (100/0) cuando no vienen en la query', async () => {
            mockedSellModel.getSells.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getSells(buildReq(), res);

            expect(mockedSellModel.getSells).toHaveBeenCalledWith('kiosco-1', 100, 0);
        });

        it('responde 400 si SellModel lanza un Error', async () => {
            mockedSellModel.getSells.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await getSells(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'boom' });
        });
    });

    describe('getSellById', () => {
        it('devuelve la venta encontrada', async () => {
            mockedSellModel.getSellsByField.mockResolvedValueOnce([{ _id: 'sell-1' }] as never);
            const res = buildRes();

            await getSellById(buildReq({ params: { _id: 'sell-1' } }), res);

            expect(mockedSellModel.getSellsByField).toHaveBeenCalledWith('kiosco-1', '_id', 'sell-1', 'string');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ _id: 'sell-1' }]);
        });
    });

    describe('getSellsBySeller', () => {
        it('filtra por seller_name', async () => {
            mockedSellModel.getSellsByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getSellsBySeller(buildReq<GetSellsBySellerRequestType>({ body: { seller_name: 'Juan' } }), res);

            expect(mockedSellModel.getSellsByField).toHaveBeenCalledWith('kiosco-1', 'seller_name', 'Juan', 'string');
        });
    });

    describe('getSellsByDate', () => {
        it('filtra por purchase_date', async () => {
            mockedSellModel.getSellsByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getSellsByDate(buildReq<GetSellsByDateRequestType>({ body: { purchase_date: '01/01/2026' } }), res);

            expect(mockedSellModel.getSellsByField).toHaveBeenCalledWith('kiosco-1', 'purchase_date', '01/01/2026', 'string');
        });
    });

    describe('getSellsByProduct', () => {
        it('filtra por producto', async () => {
            mockedSellModel.getSellsByProduct.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getSellsByProduct(buildReq<GetSellsByProductRequestType>({ body: { _id: 'product-1' } }), res);

            expect(mockedSellModel.getSellsByProduct).toHaveBeenCalledWith('kiosco-1', { _id: 'product-1' });
        });
    });

    describe('getTodaySellsCount', () => {
        it('devuelve las estadísticas del día', async () => {
            mockedSellModel.getTodaySellsCount.mockResolvedValueOnce({
                count: 3,
                lastSaleAt: null,
                totalAmount: 300,
            } as never);
            const res = buildRes();

            await getTodaySellsCount(buildReq(), res);

            expect(res.json).toHaveBeenCalledWith({ count: 3, lastSaleAt: null, totalAmount: 300 });
        });
    });

    describe('getMonthlySalesReport', () => {
        it('devuelve el resumen mensual', async () => {
            mockedSellModel.getMonthlySummary.mockResolvedValueOnce({ month: '2026-01' } as never);
            const res = buildRes();

            await getMonthlySalesReport(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ month: '2026-01' });
        });
    });

    describe('getMonthlySalesReportDetail', () => {
        it('rechaza compareWith inválido con 400 sin llamar al servicio', async () => {
            const res = buildRes();

            await getMonthlySalesReportDetail(buildReq({ query: { compareWith: 'invalid' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockedMonthlyReportService.getDetail).not.toHaveBeenCalled();
        });

        it('acepta compareWith válido y delega en MonthlyReportService', async () => {
            mockedMonthlyReportService.getDetail.mockResolvedValueOnce({} as never);
            const res = buildRes();

            await getMonthlySalesReportDetail(
                buildReq({ query: { month: '2026-01', compareWith: 'previous_month' } }),
                res
            );

            expect(mockedMonthlyReportService.getDetail).toHaveBeenCalledWith('kiosco-1', '2026-01', 'previous_month');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('searchSells', () => {
        it('busca por el término recibido', async () => {
            mockedSellModel.searchSells.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await searchSells(buildReq({ query: { term: 'juan' } }), res);

            expect(mockedSellModel.searchSells).toHaveBeenCalledWith('kiosco-1', 'juan');
        });
    });

    describe('createSell', () => {
        const baseBody = {
            currency: 'ars',
            iva: 21,
            payment_method: 'cash',
            products: [{ _id: 'presentation-1', stock_required: 2 }],
            purchase_date: '01/01/2026',
            seller_id: 'seller-1',
            seller_name: 'Juan',
            sub_total: 100,
            total_amount: 121,
            status: 'completada',
            amount_paid: 121,
            debtor_name: null,
        };

        it('crea la venta, descuenta stock y crea la notificación de venta', async () => {
            mockedSellModel.create.mockResolvedValueOnce('sell-1' as never);
            mockedPresentationModel.decreaseStock.mockResolvedValueOnce([
                { _id: 'presentation-1', product_id: 'product-1', name: 'Coca', stock: 5, min_stock: 2 },
            ] as never);
            const res = buildRes();

            await createSell(buildReq<CreateSellRequestType>({ body: baseBody }), res);

            expect(mockedPresentationModel.decreaseStock).toHaveBeenCalledWith('kiosco-1', [
                { _id: 'presentation-1', stock_required: 2 },
            ]);
            expect(mockedNotificationModel.createSaleNotification).toHaveBeenCalledWith(
                'kiosco-1',
                expect.objectContaining({ sellId: 'sell-1' })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'sell-1', message: 'Sell saved successfully' });
        });

        it('crea una notificación de stock bajo si la presentación queda debajo del mínimo', async () => {
            mockedSellModel.create.mockResolvedValueOnce('sell-1' as never);
            mockedPresentationModel.decreaseStock.mockResolvedValueOnce([
                { _id: 'presentation-1', product_id: 'product-1', name: 'Coca', stock: 1, min_stock: 2 },
            ] as never);
            const res = buildRes();

            await createSell(buildReq<CreateSellRequestType>({ body: baseBody }), res);

            expect(mockedNotificationModel.createLowStockNotification).toHaveBeenCalledWith(
                'kiosco-1',
                expect.objectContaining({ presentationId: 'presentation-1', units: 1, minStock: 2 })
            );
        });

        it('no descuenta stock cuando skip_stock es true (venta de saldo)', async () => {
            mockedSellModel.create.mockResolvedValueOnce('sell-1' as never);
            const res = buildRes();

            await createSell(buildReq<CreateSellRequestType>({ body: { ...baseBody, skip_stock: true } }), res);

            expect(mockedPresentationModel.decreaseStock).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si falla la creación en el modelo', async () => {
            mockedSellModel.create.mockRejectedValueOnce(new Error('DB caída'));
            const res = buildRes();

            await createSell(buildReq<CreateSellRequestType>({ body: baseBody }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'DB caída' });
        });

        it('no rompe la respuesta si falla la notificación de venta (se atrapa internamente)', async () => {
            mockedSellModel.create.mockResolvedValueOnce('sell-1' as never);
            mockedPresentationModel.decreaseStock.mockResolvedValueOnce([] as never);
            mockedNotificationModel.createSaleNotification.mockRejectedValueOnce(new Error('notif error'));
            const res = buildRes();

            await createSell(buildReq<CreateSellRequestType>({ body: baseBody }), res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('deleteSell', () => {
        it('elimina la venta y confirma', async () => {
            mockedSellModel.delete.mockResolvedValueOnce(undefined as never);
            const res = buildRes();

            await deleteSell(buildReq({ params: { _id: 'sell-1' } }), res);

            expect(mockedSellModel.delete).toHaveBeenCalledWith('kiosco-1', { _id: 'sell-1' });
            expect(res.json).toHaveBeenCalledWith({ _id: 'sell-1', message: 'Sell has been deleted successfully' });
        });

        it('responde 400 si falla el borrado', async () => {
            mockedSellModel.delete.mockRejectedValueOnce(new Error('no existe'));
            const res = buildRes();

            await deleteSell(buildReq({ params: { _id: 'sell-1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('editSell', () => {
        it('edita la venta y confirma', async () => {
            mockedSellModel.edit.mockResolvedValueOnce(undefined as never);
            const res = buildRes();

            await editSell(buildReq<EditSellRequestType>({ body: { _id: 'sell-1' } }), res);

            expect(mockedSellModel.edit).toHaveBeenCalledWith('kiosco-1', expect.objectContaining({ _id: 'sell-1' }));
            expect(res.json).toHaveBeenCalledWith({ _id: 'sell-1', message: 'Sell has been edited successfully' });
        });

        it('responde 400 si falla la edición', async () => {
            mockedSellModel.edit.mockRejectedValueOnce(new Error('venta no encontrada'));
            const res = buildRes();

            await editSell(buildReq<EditSellRequestType>({ body: { _id: 'sell-1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
