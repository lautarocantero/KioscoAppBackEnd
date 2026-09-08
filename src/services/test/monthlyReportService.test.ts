import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MonthlyReportService } from '../monthlyReportService';
import { SellSchema } from '../../schemas/sellSchema';
import { PresentationMongo } from '../../schemas/presentationSchema';
import { PlanService } from '../planService';

vi.mock('../../schemas/sellSchema', () => ({
    SellSchema: { find: vi.fn() },
}));

vi.mock('../../schemas/presentationSchema', () => ({
    PresentationMongo: { find: vi.fn() },
}));

vi.mock('../planService', () => ({
    PlanService: { getSellsDateFloor: vi.fn() },
}));

const mockedSellSchema = vi.mocked(SellSchema);
const mockedPresentationMongo = vi.mocked(PresentationMongo);
const mockedPlanService = vi.mocked(PlanService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

// Fecha local (no ISO en UTC): evita que un test que corre cerca de medianoche
// en un TZ distinto al del runner mande la venta a otro día/mes.
const localISO = (y: number, m: number, d: number, h = 10, min = 0): string =>
    new Date(y, m, d, h, min, 0, 0).toISOString();

type SellFixture = {
    purchase_date: string;
    payment_method?: string;
    seller_id?: string;
    seller_name?: string;
    total_amount?: number;
    status?: string;
    debtor_name?: string | null;
    amount_paid?: number | null;
    settles_sell_id?: string | null;
    products?: { _id: string }[];
};

const mkSell = (overrides: SellFixture): Required<SellFixture> => ({
    payment_method: 'cash',
    seller_id: 'seller-1',
    seller_name: 'Juan',
    total_amount: 1000,
    status: 'completed',
    debtor_name: null,
    amount_paid: null,
    settles_sell_id: null,
    products: [],
    ...overrides,
});

// getDetail hace, en este orden fijo: (1) SellSchema.find de rawSells del mes
// [+comparación], (2) PresentationMongo.find de outOfStock, (3) SellSchema.find
// de historicalSells (lookback 12 meses), (4) PresentationMongo.find de
// allPresentations, (5) SellSchema.find de debtRelatedSells (cuenta corriente).
function mockQueries(opts: {
    mainSells?: unknown[];
    outOfStock?: unknown[];
    historicalSells?: unknown[];
    allPresentations?: unknown[];
    debtSells?: unknown[];
} = {}) {
    const { mainSells = [], outOfStock = [], historicalSells = [], allPresentations = [], debtSells = [] } = opts;
    mockedSellSchema.find
        .mockReturnValueOnce(lean(mainSells) as never)
        .mockReturnValueOnce(lean(historicalSells) as never)
        .mockReturnValueOnce(lean(debtSells) as never);
    mockedPresentationMongo.find
        .mockReturnValueOnce(lean(outOfStock) as never)
        .mockReturnValueOnce(lean(allPresentations) as never);
}

describe('MonthlyReportService.getDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 20, 12, 0, 0)); // 2026-03-20 local, plan Deluxe por default
        mockedPlanService.getSellsDateFloor.mockResolvedValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('validación y gating por plan', () => {
        it('rechaza un monthParam con formato inválido', async () => {
            await expect(MonthlyReportService.getDetail('kiosco-1', '2026/03')).rejects.toThrow('El mes debe tener formato YYYY-MM');
        });

        it('plan Standard (dateFloor seteado) pidiendo un mes que no es el actual: rechaza', async () => {
            mockedPlanService.getSellsDateFloor.mockResolvedValue(new Date(2026, 2, 1));

            await expect(MonthlyReportService.getDetail('kiosco-1', '2026-02')).rejects.toThrow('Tu plan solo permite ver el reporte del mes en curso');
        });

        it('plan Standard pidiendo el mes actual: no rechaza, y meta.canCompare es false', async () => {
            mockedPlanService.getSellsDateFloor.mockResolvedValue(new Date(2026, 2, 1));
            mockQueries();

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.meta.canCompare).toBe(false);
            expect(result.meta.availableMonths).toEqual(['2026-03']);
            expect(result.summary.previous).toBeNull();
            expect(result.comparisonMonth).toBeNull();
        });

        it('sin monthParam, usa el mes actual', async () => {
            mockQueries();

            const result = await MonthlyReportService.getDetail('kiosco-1');

            expect(result.month).toBe(new Date(2026, 2, 1).toISOString());
        });
    });

    describe('comparación entre meses', () => {
        it('compareWith=none: sin comparación, aunque el plan la permita', async () => {
            mockQueries();

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03', 'none');

            expect(result.comparisonMonth).toBeNull();
            expect(result.summary.previous).toBeNull();
        });

        it('compareWith=previous_month (default): compara contra febrero', async () => {
            mockQueries({
                mainSells: [mkSell({ purchase_date: localISO(2026, 2, 15), total_amount: 1000 })],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.comparisonMonth).toBe(new Date(2026, 1, 1).toISOString());
        });

        it('compareWith=previous_year: compara contra marzo del año anterior', async () => {
            mockQueries();

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03', 'previous_year');

            expect(result.comparisonMonth).toBe(new Date(2025, 2, 1).toISOString());
        });

        it('plan Standard: si el mes de comparación cae antes del dateFloor, no está disponible', async () => {
            // dateFloor = inicio del mes actual (marzo) => comparar contra febrero no está disponible
            mockedPlanService.getSellsDateFloor.mockResolvedValue(new Date(2026, 2, 1));
            mockQueries();

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03', 'previous_month');

            expect(result.comparisonMonth).toBeNull();
            expect(result.summary.previous).toBeNull();
        });
    });

    describe('summary (KPIs del mes)', () => {
        it('calcula totalSales/totalRevenue/averageTicket/ticketsPerDay y la comparación previa', async () => {
            // La comparación (mes anterior, febrero) sale del MISMO find que trae marzo
            // (createdAtFloor cubre ambos meses) — no del find separado de stockAlerts.
            mockQueries({
                mainSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 10), total_amount: 1000 }),
                    mkSell({ purchase_date: localISO(2026, 2, 20), total_amount: 3000 }),
                    mkSell({ purchase_date: localISO(2026, 1, 10), total_amount: 500 }),
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.summary.totalSales).toBe(2);
            expect(result.summary.totalRevenue).toBe(4000);
            expect(result.summary.averageTicket).toBe(2000);
            expect(result.summary.ticketsPerDay).toBeCloseTo(2 / 31, 5);
            expect(result.summary.previous).toEqual({ totalSales: 1, totalRevenue: 500, averageTicket: 500 });
        });
    });

    describe('paymentMethods', () => {
        it('agrupa por método, calcula % del total y ordena desc por monto', async () => {
            mockQueries({
                mainSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 10), payment_method: 'cash', total_amount: 250 }),
                    mkSell({ purchase_date: localISO(2026, 2, 11), payment_method: 'card', total_amount: 750 }),
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.paymentMethods).toEqual([
                { method: 'card', amount: 750, percentage: 75 },
                { method: 'cash', amount: 250, percentage: 25 },
            ]);
        });
    });

    describe('sellers', () => {
        it('agrega por vendedor, marca isNew si no vendió en el mes de comparación, y changePct null si antes vendió 0', async () => {
            mockQueries({
                mainSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 10), seller_id: 's1', seller_name: 'Juan', total_amount: 1000 }),
                    mkSell({ purchase_date: localISO(2026, 2, 11), seller_id: 's2', seller_name: 'Ana', total_amount: 2000 }),
                    mkSell({ purchase_date: localISO(2026, 1, 10), seller_id: 's1', total_amount: 500 }),
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            const juan = result.sellers.find((s) => s.sellerId === 's1')!;
            const ana = result.sellers.find((s) => s.sellerId === 's2')!;

            expect(juan.isNew).toBe(false);
            expect(juan.changePct).toBe(100); // (1000-500)/500*100
            expect(ana.isNew).toBe(true);
            expect(ana.changePct).toBeNull();
            // ordenado desc por amount: Ana (2000) antes que Juan (1000)
            expect(result.sellers.map((s) => s.sellerId)).toEqual(['s2', 's1']);
        });

        it('sellersNote apunta al vendedor con el ticket más alto, o null si todos son 0', async () => {
            mockQueries({
                mainSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 10), seller_id: 's1', seller_name: 'Juan', total_amount: 5000 }),
                    mkSell({ purchase_date: localISO(2026, 2, 11), seller_id: 's2', seller_name: 'Ana', total_amount: 1000 }),
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.sellersNote).toEqual({ sellerName: 'Juan', maxTicketAmount: 5000 });
        });
    });

    describe('dailySales', () => {
        it('marca isBest solo en el primer día que alcanza el monto máximo, calcula avgPerDay/closedDays/bestWeek', async () => {
            mockQueries({
                mainSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 5), total_amount: 900 }),
                    mkSell({ purchase_date: localISO(2026, 2, 12), total_amount: 900 }), // empate, no debe marcarse best
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            const bestDays = result.dailySales.filter((d) => d.isBest);
            expect(bestDays).toHaveLength(1);
            expect(bestDays[0].isoDate).toBe('2026-03-05');
            expect(result.dailySalesSummary.closedDays).toBe(29); // 31 días de marzo, 2 con ventas
            expect(result.dailySalesSummary.avgPerDay).toBeCloseTo(1800 / 31, 5);
            expect(result.dailySalesSummary.bestDay?.isoDate).toBe('2026-03-05');
        });
    });

    describe('hourlyBuckets', () => {
        it('asigna cada venta a su franja de 2h (08–24) e ignora ventas fuera de ese rango', async () => {
            mockQueries({
                mainSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 10, 9, 0), total_amount: 100 }), // bucket 08–10
                    mkSell({ purchase_date: localISO(2026, 2, 10, 23, 30), total_amount: 300 }), // bucket 22–24
                    mkSell({ purchase_date: localISO(2026, 2, 10, 3, 0), total_amount: 999 }), // fuera de rango, ignorada
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            const totalHourly = result.hourlyBuckets.reduce((sum, b) => sum + b.amount, 0);
            expect(totalHourly).toBe(400); // la venta de las 03:00 no entra a ningún bucket
            expect(result.hourlySummary.peakLabel).toBe('22–24');
            const bucket0810 = result.hourlyBuckets.find((b) => b.label === '08–10');
            expect(bucket0810?.amount).toBe(100);
        });
    });

    describe('stockAlerts', () => {
        it('cuenta out-of-stock, estima ingreso perdido solo de los que rotaban en el mes de comparación, y arma dead stock >= 60 días', async () => {
            mockQueries({
                // La venta de pres-a en febrero (mes de comparación) sale del find
                // principal (mainSells), no del find de historicalSells de acá abajo
                // (ese es el lookback de 12 meses para "última venta", otro cálculo).
                mainSells: [
                    { purchase_date: localISO(2026, 1, 10), products: [{ _id: 'pres-a' }] },
                ],
                outOfStock: [
                    { _id: 'pres-a', name: 'Sin stock rotaba', price: 200 },
                    { _id: 'pres-b', name: 'Sin stock nunca vendida', price: 50 },
                ],
                allPresentations: [
                    { _id: 'pres-c', name: 'Vieja', price: 10, stock: 5, created_at: localISO(2025, 11, 1) }, // >=60 días sin última venta conocida -> usa created_at
                    { _id: 'pres-d', name: 'Reciente', price: 10, stock: 5, created_at: localISO(2026, 2, 15) }, // hace pocos días, no es dead stock
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.stockAlerts.outOfStockCount).toBe(2);
            expect(result.stockAlerts.outOfStockSoldInComparisonCount).toBe(1);
            expect(result.stockAlerts.estimatedLostRevenue).toBe(200); // 1 venta histórica de pres-a * price 200
            expect(result.stockAlerts.deadStockCount).toBe(1);
            expect(result.stockAlerts.oldestDeadStock?.name).toBe('Vieja');
        });
    });

    describe('currentAccount', () => {
        it('calcula deuda vigente, cobros y deuda nueva del mes, contando deudores únicos', async () => {
            mockQueries({
                debtSells: [
                    mkSell({ purchase_date: localISO(2026, 2, 10), status: 'parcial', debtor_name: 'Pedro', total_amount: 1000, amount_paid: 400 }),
                    mkSell({ purchase_date: localISO(2026, 1, 5), status: 'parcial', debtor_name: 'Pedro', total_amount: 500, amount_paid: 0 }),
                    mkSell({ purchase_date: localISO(2026, 2, 15), status: 'completed', settles_sell_id: 'sell-x', total_amount: 300 }),
                ],
            });

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.currentAccount.debtorsCount).toBe(1); // Pedro, aunque tenga 2 ventas parciales
            expect(result.currentAccount.totalDebt).toBe(600 + 500); // (1000-400) + (500-0)
            expect(result.currentAccount.collectedThisMonth).toBe(300); // settlement dentro de marzo
            expect(result.currentAccount.newDebtThisMonth).toBe(600); // solo la deuda parcial generada EN marzo
            expect(result.currentAccount.paymentsCount).toBe(1);
        });
    });

    describe('meta', () => {
        it('plan Deluxe (sin dateFloor): canCompare true y 12 meses disponibles, empezando por el actual', async () => {
            mockQueries();

            const result = await MonthlyReportService.getDetail('kiosco-1', '2026-03');

            expect(result.meta.canCompare).toBe(true);
            expect(result.meta.availableMonths).toHaveLength(12);
            expect(result.meta.availableMonths[0]).toBe('2026-03');
            expect(result.meta.availableMonths[11]).toBe('2025-04');
            expect(result.meta.daysInMonth).toBe(31);
        });
    });
});
