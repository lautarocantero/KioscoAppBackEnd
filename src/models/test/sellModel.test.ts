import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SellModel } from '../sellModel';
import { SellSchema } from '../../schemas/sellSchema';
import { PlanService } from '../../services/planService';

vi.mock('../../schemas/sellSchema', () => ({
    SellSchema: {
        find: vi.fn(),
        create: vi.fn(),
        findOneAndDelete: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock('../../services/planService', () => ({
    PlanService: { getSellsDateFloor: vi.fn() },
}));

const mockedSellSchema = vi.mocked(SellSchema);
const mockedPlanService = vi.mocked(PlanService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });
const limitedLean = (value: unknown) => ({ limit: vi.fn().mockReturnValue(lean(value)) });
const sortSkipLimitLean = (value: unknown) => ({
    sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(lean(value)),
        }),
    }),
});

const validTicket = {
    _id: 'pres-1', name: 'Coca 500ml', description: 'Gaseosa', image_url: '', brand: 'Coca-Cola',
    product_id: 'prod-1', sku: 'SKU1', model_type: 'bottle', model_size: 500,
    price: 1000, expiration_date: '', stock_required: 1,
};

const validCreatePayload = {
    currency: 'ARS',
    iva: 0,
    payment_method: 'cash',
    products: [validTicket],
    purchase_date: '15/03/2026',
    seller_id: 'seller-1',
    seller_name: 'Juan',
    sub_total: 1000,
    total_amount: 1000,
    status: 'completed',
};

describe('SellModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getSells', () => {
        it('plan Standard (dateFloor seteado): filtra por createdAt >= dateFloor', async () => {
            mockedPlanService.getSellsDateFloor.mockResolvedValueOnce(new Date(2026, 2, 1));
            mockedSellSchema.find.mockReturnValueOnce(sortSkipLimitLean([]) as never);

            await SellModel.getSells('kiosco-1');

            expect(mockedSellSchema.find).toHaveBeenCalledWith({
                kiosco_id: 'kiosco-1',
                createdAt: { $gte: new Date(2026, 2, 1) },
            });
        });

        it('plan Deluxe (sin dateFloor): sin filtro de fecha', async () => {
            mockedPlanService.getSellsDateFloor.mockResolvedValueOnce(null);
            mockedSellSchema.find.mockReturnValueOnce(sortSkipLimitLean([{ _id: 'sell-1' }]) as never);

            const result = await SellModel.getSells('kiosco-1');

            expect(mockedSellSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
            expect(result).toEqual([{ _id: 'sell-1' }]);
        });
    });

    describe('getMonthlySummary', () => {
        it('calcula totales del mes en curso a partir de total_amount', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
            mockedSellSchema.find.mockReturnValueOnce(lean([{ total_amount: 1000 }, { total_amount: 3000 }]) as never);

            const result = await SellModel.getMonthlySummary('kiosco-1');

            expect(mockedSellSchema.find).toHaveBeenCalledWith(
                { kiosco_id: 'kiosco-1', createdAt: { $gte: new Date(2026, 2, 1) } },
                { total_amount: 1 },
            );
            expect(result).toEqual({
                month: new Date(2026, 2, 1).toISOString(),
                totalSales: 2,
                totalRevenue: 4000,
                averageTicket: 2000,
            });
        });

        it('sin ventas en el mes: averageTicket es 0 (no NaN)', async () => {
            mockedSellSchema.find.mockReturnValueOnce(lean([]) as never);

            const result = await SellModel.getMonthlySummary('kiosco-1');

            expect(result.totalSales).toBe(0);
            expect(result.averageTicket).toBe(0);
        });
    });

    describe('getSellsByField', () => {
        it('rechaza un type no soportado', async () => {
            await expect(SellModel.getSellsByField('kiosco-1', 'seller_name', 'x', 'boolean' as never)).rejects.toThrow('Unsupported field type for seller_name');
        });

        it('valida y consulta por campo string', async () => {
            mockedSellSchema.find.mockReturnValueOnce(lean([{ _id: 'sell-1' }]) as never);

            await SellModel.getSellsByField('kiosco-1', 'seller_name', 'Juan', 'string');

            expect(mockedSellSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', seller_name: 'Juan' });
        });

        it('valida y consulta por campo number', async () => {
            mockedSellSchema.find.mockReturnValueOnce(lean([]) as never);

            await SellModel.getSellsByField('kiosco-1', 'total_amount', 1000, 'number');

            expect(mockedSellSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', total_amount: 1000 });
        });
    });

    describe('getSellsByProduct', () => {
        it('valida _id y busca por products.product_id, limitado a 100', async () => {
            mockedSellSchema.find.mockReturnValueOnce(limitedLean([{ _id: 'sell-1' }]) as never);

            const result = await SellModel.getSellsByProduct('kiosco-1', { _id: 'prod-1' });

            expect(mockedSellSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', 'products.product_id': 'prod-1' });
            expect(result).toEqual([{ _id: 'sell-1' }]);
        });

        it('rechaza sin _id', async () => {
            await expect(SellModel.getSellsByProduct('kiosco-1', { _id: '' } as never)).rejects.toThrow();
        });
    });

    describe('getTodaySellsCount', () => {
        it('sin ventas hoy: count 0, lastSaleAt null, totalAmount 0', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
            mockedSellSchema.find.mockReturnValueOnce(lean([
                { purchase_date: new Date(2026, 2, 14, 10, 0, 0).toString(), createdAt: new Date(2026, 2, 14), total_amount: 500 },
            ]) as never);

            const result = await SellModel.getTodaySellsCount('kiosco-1');

            expect(result).toEqual({ count: 0, lastSaleAt: null, totalAmount: 0 });
        });

        it('con ventas hoy: cuenta, suma total_amount y toma el createdAt más reciente como lastSaleAt', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 2, 15, 18, 0, 0));
            const earlier = new Date(2026, 2, 15, 9, 0, 0);
            const later = new Date(2026, 2, 15, 14, 0, 0);
            mockedSellSchema.find.mockReturnValueOnce(lean([
                { purchase_date: earlier.toString(), createdAt: earlier, total_amount: 500 },
                { purchase_date: later.toString(), createdAt: later, total_amount: 800 },
                { purchase_date: new Date(2026, 2, 14, 10, 0, 0).toString(), createdAt: new Date(2026, 2, 14), total_amount: 999 },
            ]) as never);

            const result = await SellModel.getTodaySellsCount('kiosco-1');

            expect(result.count).toBe(2);
            expect(result.totalAmount).toBe(1300);
            expect(result.lastSaleAt).toBe(later.toISOString());
        });
    });

    describe('searchSells', () => {
        it('term simple: solo matchea por _id/seller_name', async () => {
            mockedSellSchema.find.mockReturnValueOnce(limitedLean([]) as never);

            await SellModel.searchSells('kiosco-1', 'Juan');

            expect(mockedSellSchema.find).toHaveBeenCalledWith({
                kiosco_id: 'kiosco-1',
                $or: [
                    { _id: { $regex: 'Juan', $options: 'i' } },
                    { seller_name: { $regex: 'Juan', $options: 'i' } },
                ],
            });
        });

        it('term numérico: agrega match exacto de total_amount', async () => {
            mockedSellSchema.find.mockReturnValueOnce(limitedLean([]) as never);

            await SellModel.searchSells('kiosco-1', '1500');

            const [query] = mockedSellSchema.find.mock.calls[0];
            expect((query as unknown as { $or: unknown[] }).$or).toContainEqual({ total_amount: 1500 });
        });

        it('term con forma dd/mm/yyyy: agrega match de purchase_date por el toDateString esperado', async () => {
            mockedSellSchema.find.mockReturnValueOnce(limitedLean([]) as never);

            await SellModel.searchSells('kiosco-1', '01/07/2026');

            const expectedDateStr = new Date(2026, 6, 1).toDateString();
            const [query] = mockedSellSchema.find.mock.calls[0];
            expect((query as unknown as { $or: unknown[] }).$or).toContainEqual({ purchase_date: { $regex: expectedDateStr, $options: 'i' } });
        });

        it('rechaza un term vacío', async () => {
            await expect(SellModel.searchSells('kiosco-1', '')).rejects.toThrow();
        });
    });

    describe('create', () => {
        it('crea una venta completa (status distinto de parcial): amount_paid/debtor_name quedan null', async () => {
            mockedSellSchema.create.mockResolvedValueOnce({} as never);

            const id = await SellModel.create('kiosco-1', validCreatePayload as never);

            expect(typeof id).toBe('string');
            expect(mockedSellSchema.create).toHaveBeenCalledWith(expect.objectContaining({
                _id: id,
                kiosco_id: 'kiosco-1',
                status: 'completed',
                amount_paid: null,
                debtor_name: null,
                settles_sell_id: null,
            }));
        });

        it('parsea purchase_date dd/mm/yyyy a un Date real', async () => {
            mockedSellSchema.create.mockResolvedValueOnce({} as never);

            await SellModel.create('kiosco-1', validCreatePayload as never);

            const [payload] = mockedSellSchema.create.mock.calls[0];
            const purchaseDate = new Date((payload as { purchase_date: string }).purchase_date);
            expect(purchaseDate.getDate()).toBe(15);
            expect(purchaseDate.getMonth()).toBe(2); // marzo (0-indexed)
            expect(purchaseDate.getFullYear()).toBe(2026);
        });

        it('status parcial: exige y persiste amount_paid/debtor_name', async () => {
            mockedSellSchema.create.mockResolvedValueOnce({} as never);

            await SellModel.create('kiosco-1', { ...validCreatePayload, status: 'parcial', amount_paid: 400, debtor_name: 'Pedro' } as never);

            expect(mockedSellSchema.create).toHaveBeenCalledWith(expect.objectContaining({
                status: 'parcial', amount_paid: 400, debtor_name: 'Pedro',
            }));
        });

        it('status parcial sin debtor_name: rechaza sin crear', async () => {
            await expect(SellModel.create('kiosco-1', { ...validCreatePayload, status: 'parcial', amount_paid: 400 } as never)).rejects.toThrow();
            expect(mockedSellSchema.create).not.toHaveBeenCalled();
        });

        it('settles_sell_id presente: se valida y persiste', async () => {
            mockedSellSchema.create.mockResolvedValueOnce({} as never);

            await SellModel.create('kiosco-1', { ...validCreatePayload, settles_sell_id: 'sell-original-1' } as never);

            expect(mockedSellSchema.create).toHaveBeenCalledWith(expect.objectContaining({ settles_sell_id: 'sell-original-1' }));
        });

        it('un producto que no tiene forma de ProductTicket: rechaza', async () => {
            await expect(SellModel.create('kiosco-1', { ...validCreatePayload, products: [{ foo: 'bar' }] } as never)).rejects.toThrow();
        });
    });

    describe('delete', () => {
        it('rechaza si no existe una venta con ese id en el kiosco', async () => {
            mockedSellSchema.findOneAndDelete.mockResolvedValueOnce(null as never);

            await expect(SellModel.delete('kiosco-1', { _id: 'sell-1' })).rejects.toThrow('There is not any sell with that id sell-1');
        });

        it('borra la venta scoped por kiosco', async () => {
            mockedSellSchema.findOneAndDelete.mockResolvedValueOnce({ _id: 'sell-1' } as never);

            await SellModel.delete('kiosco-1', { _id: 'sell-1' });

            expect(mockedSellSchema.findOneAndDelete).toHaveBeenCalledWith({ _id: 'sell-1', kiosco_id: 'kiosco-1' });
        });
    });

    describe('edit', () => {
        const baseEdit = {
            _id: 'sell-1', products: [validTicket], purchase_date: '2026-03-15T00:00:00.000Z',
            seller_name: 'Juan', total_amount: 1000,
        };

        it('rechaza si no existe una venta con ese id en el kiosco', async () => {
            mockedSellSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(SellModel.edit('kiosco-1', baseEdit as never)).rejects.toThrow('There is not any sell with that id sell-1');
        });

        it('sin status ni settled_by_sell_id: no los incluye en el $set', async () => {
            mockedSellSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'sell-1' } as never);

            await SellModel.edit('kiosco-1', baseEdit as never);

            const [, update] = mockedSellSchema.findOneAndUpdate.mock.calls[0];
            const setFields = (update as { $set: Record<string, unknown> }).$set;
            expect(setFields).not.toHaveProperty('status');
            expect(setFields).not.toHaveProperty('settled_by_sell_id');
            expect(setFields).toHaveProperty('modification_date');
        });

        it('status=parcial: setea amount_paid/debtor_name validados', async () => {
            mockedSellSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'sell-1' } as never);

            await SellModel.edit('kiosco-1', { ...baseEdit, status: 'parcial', amount_paid: 300, debtor_name: 'Pedro' } as never);

            const [, update] = mockedSellSchema.findOneAndUpdate.mock.calls[0];
            const setFields = (update as { $set: Record<string, unknown> }).$set;
            expect(setFields).toMatchObject({ status: 'parcial', amount_paid: 300, debtor_name: 'Pedro' });
        });

        it('status distinto de parcial (ej. saldar deuda): amount_paid/debtor_name quedan null', async () => {
            mockedSellSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'sell-1' } as never);

            await SellModel.edit('kiosco-1', { ...baseEdit, status: 'completed' } as never);

            const [, update] = mockedSellSchema.findOneAndUpdate.mock.calls[0];
            const setFields = (update as { $set: Record<string, unknown> }).$set;
            expect(setFields).toMatchObject({ status: 'completed', amount_paid: null, debtor_name: null });
        });

        it('settled_by_sell_id truthy: se valida y persiste', async () => {
            mockedSellSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'sell-1' } as never);

            await SellModel.edit('kiosco-1', { ...baseEdit, settled_by_sell_id: 'sell-settlement-1' } as never);

            const [, update] = mockedSellSchema.findOneAndUpdate.mock.calls[0];
            const setFields = (update as { $set: Record<string, unknown> }).$set;
            expect(setFields.settled_by_sell_id).toBe('sell-settlement-1');
        });

        it('settled_by_sell_id falsy pero presente (ej. "" al desvincular): queda null', async () => {
            mockedSellSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'sell-1' } as never);

            await SellModel.edit('kiosco-1', { ...baseEdit, settled_by_sell_id: '' } as never);

            const [, update] = mockedSellSchema.findOneAndUpdate.mock.calls[0];
            const setFields = (update as { $set: Record<string, unknown> }).$set;
            expect(setFields.settled_by_sell_id).toBeNull();
        });
    });
});
