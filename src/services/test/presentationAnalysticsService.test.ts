import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresentationAnalyticsService } from '../presentationAnalysticsService';
import { SellSchema } from '../../schemas/sellSchema';

vi.mock('../../schemas/sellSchema', () => ({
    SellSchema: { find: vi.fn() },
}));

const mockedSellSchema = vi.mocked(SellSchema);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

describe('PresentationAnalyticsService.getAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('arma el filtro con kiosco_id/products._id y agrega seller_id solo si viene', async () => {
        mockedSellSchema.find.mockReturnValueOnce(lean([]) as never);

        await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1', '2026-01-05', '2026-01-05');

        expect(mockedSellSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', 'products._id': 'pres-1' });
    });

    it('agrega seller_id al filtro cuando viene', async () => {
        mockedSellSchema.find.mockReturnValueOnce(lean([]) as never);

        await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1', '2026-01-05', '2026-01-05', 'seller-1');

        expect(mockedSellSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', 'products._id': 'pres-1', seller_id: 'seller-1' });
    });

    it('sin start_date/end_date usa hoy como fin y los últimos 30 días como rango', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
        mockedSellSchema.find.mockReturnValueOnce(lean([]) as never);

        const result = await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1');

        // Se calcula en hora local (setHours), así que se replica el mismo cálculo acá
        // en vez de hardcodear fechas UTC — evita que el test dependa del TZ del runner.
        const expectedEnd = new Date('2026-03-15T12:00:00.000Z');
        expectedEnd.setHours(23, 59, 59, 999);
        const expectedStart = new Date(expectedEnd.getTime() - 29 * 24 * 60 * 60 * 1000);
        expectedStart.setHours(0, 0, 0, 0);

        expect(result.range.end).toBe(expectedEnd.toISOString().slice(0, 10));
        expect(result.range.start).toBe(expectedStart.toISOString().slice(0, 10));
    });

    it('calcula units/revenue por día, dividiendo por 100 el precio de las presentaciones weight, e ignora ventas de otra presentation o fuera de rango', async () => {
        const sells = [
            { purchase_date: '2026-01-05T10:00:00.000Z', seller_id: 's1', products: [{ _id: 'pres-1', price: 100, stock_required: 2, sale_type: 'unit' }] },
            { purchase_date: '2026-01-05T15:00:00.000Z', seller_id: 's1', products: [{ _id: 'pres-1', price: 500, stock_required: 150, sale_type: 'weight' }] },
            { purchase_date: '2026-01-05T09:00:00.000Z', seller_id: 's1', products: [{ _id: 'other-pres', price: 999, stock_required: 5, sale_type: 'unit' }] },
            { purchase_date: '2026-01-10T09:00:00.000Z', seller_id: 's1', products: [{ _id: 'pres-1', price: 100, stock_required: 1, sale_type: 'unit' }] },
        ];
        mockedSellSchema.find.mockReturnValueOnce(lean(sells) as never);

        const result = await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1', '2026-01-05', '2026-01-05');

        // units: 2 (unit) + 150 (weight) = 152; revenue: 2*100 + (150*500)/100 = 200 + 750 = 950
        expect(result.totals.units).toBe(152);
        expect(result.totals.revenue).toBe(950);
        expect(result.totals.activeDays).toBe(1);
        // avgTicket = revenue / cantidad de VENTAS que matchean (2), no de unidades
        expect(result.totals.avgTicket).toBe(475);
        expect(result.dailySales).toHaveLength(1);
        expect(result.dailySales[0]).toMatchObject({ isoDate: '2026-01-05', units: 152, revenue: 950 });
    });

    it('deltas: si el período previo no tuvo ventas y el actual sí, el % de cambio es null (no Infinity)', async () => {
        const sells = [
            { purchase_date: '2026-01-05T10:00:00.000Z', seller_id: 's1', products: [{ _id: 'pres-1', price: 100, stock_required: 2, sale_type: 'unit' }] },
        ];
        mockedSellSchema.find.mockReturnValueOnce(lean(sells) as never);

        const result = await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1', '2026-01-05', '2026-01-05');

        expect(result.previousTotals.units).toBe(0);
        expect(result.deltas.unitsPct).toBeNull();
        expect(result.deltas.revenuePct).toBeNull();
    });

    it('deltas: si ni el período actual ni el previo tuvieron ventas, el % de cambio es 0 (no null)', async () => {
        mockedSellSchema.find.mockReturnValueOnce(lean([]) as never);

        const result = await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1', '2026-01-05', '2026-01-05');

        expect(result.deltas.unitsPct).toBe(0);
        expect(result.deltas.revenuePct).toBe(0);
        expect(result.deltas.avgTicketPct).toBe(0);
    });

    it('topSellingDays: solo días con ventas, ordenados desc por unidades, tope 5', async () => {
        const sells = Array.from({ length: 6 }, (_, i) => ({
            purchase_date: `2026-01-0${i + 1}T10:00:00.000Z`,
            seller_id: 's1',
            products: [{ _id: 'pres-1', price: 100, stock_required: i + 1, sale_type: 'unit' }],
        }));
        mockedSellSchema.find.mockReturnValueOnce(lean(sells) as never);

        const result = await PresentationAnalyticsService.getAnalytics('kiosco-1', 'pres-1', '2026-01-01', '2026-01-06');

        expect(result.topSellingDays).toHaveLength(5);
        expect(result.topSellingDays[0]).toMatchObject({ isoDate: '2026-01-06', units: 6 });
        expect(result.topSellingDays.map((d) => d.units)).toEqual([6, 5, 4, 3, 2]);
    });
});
