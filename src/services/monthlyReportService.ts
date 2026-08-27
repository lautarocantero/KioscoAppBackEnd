import { SellSchema } from '../schemas/sellSchema';
import { PresentationMongo } from '../schemas/presentationSchema';
import { PlanService } from './planService';
import type {
  MonthlyReportCompareWithType,
  MonthlyReportDetailType,
  MonthlyReportMetaType,
  DailySalePointType,
  PaymentMethodBreakdownType,
  SellerReportRowType,
  HourlyBucketType,
  StockAlertsType,
  CurrentAccountSummaryType,
} from '@typings/sell';

/*──────────────────────────────
📊 MonthlyReportService
──────────────────────────────
📜 Propósito:
Arma el detalle del reporte mensual de un kiosco (ventas por día, medios de
pago, por vendedor, franjas horarias, quiebres/stock muerto y cuenta
corriente), todo calculado server-side. No vive en SellModel porque cruza
Sell + Presentation — misma regla que separa PresentationAnalyticsService de
SellModel/PresentationModel.

🏪 Todo scoped por kiosco_id. El mes pedido y la disponibilidad de
comparación respetan PlanService.getSellsDateFloor (Standard = solo el mes
en curso, sin comparación).
──────────────────────────────*/

const HOURLY_BUCKET_START_HOUR = 8; // el reporte cubre 08:00–24:00 (kiosco diurno), 8 franjas de 2h
const HOURLY_BUCKET_COUNT = 8;
const DEAD_STOCK_DAYS = 60;
const LAST_SOLD_LOOKBACK_MONTHS = 12; // ventana acotada para "última venta" de una presentación
const AVAILABLE_MONTHS_COUNT = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

type RawSell = {
  purchase_date: string;
  payment_method: string;
  seller_id: string;
  seller_name: string;
  total_amount: number;
  status: string;
  debtor_name: string | null;
  amount_paid: number | null;
  settles_sell_id: string | null;
  products: { _id: string }[];
};

type RawPresentation = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
};

function parseMonthParam(month: string | undefined): Date {
  if (!month) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error('El mes debe tener formato YYYY-MM');
  const [, yearStr, monthStr] = match;
  const monthIndex = Number(monthStr) - 1;
  if (monthIndex < 0 || monthIndex > 11) throw new Error('El mes debe tener formato YYYY-MM');
  return new Date(Number(yearStr), monthIndex, 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function inRange(purchaseDateRaw: string, start: Date, end: Date): boolean {
  const purchaseDate = new Date(purchaseDateRaw);
  if (Number.isNaN(purchaseDate.getTime())) return false;
  return purchaseDate >= start && purchaseDate < end;
}

export class MonthlyReportService {

  static async getDetail(
    kioscoId: string,
    monthParam?: string,
    compareWithParam?: MonthlyReportCompareWithType,
  ): Promise<MonthlyReportDetailType> {
    const dateFloor = await PlanService.getSellsDateFloor(kioscoId);
    const monthStart = parseMonthParam(monthParam);
    const monthEnd = addMonths(monthStart, 1);

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (dateFloor && !isSameMonth(monthStart, currentMonthStart)) {
      throw new Error('Tu plan solo permite ver el reporte del mes en curso');
    }

    const compareWith: MonthlyReportCompareWithType = compareWithParam ?? 'previous_month';
    const comparisonStart = compareWith === 'previous_month'
      ? addMonths(monthStart, -1)
      : compareWith === 'previous_year'
        ? new Date(monthStart.getFullYear() - 1, monthStart.getMonth(), 1)
        : null;
    const comparisonEnd = comparisonStart ? addMonths(comparisonStart, 1) : null;
    const comparisonAvailable = comparisonStart !== null && (!dateFloor || comparisonStart.getTime() >= dateFloor.getTime());

    // Sobre-traemos por createdAt (indexado) con margen para no perder ventas
    // cargadas con fecha retroactiva, y filtramos con precisión por
    // purchase_date (guardado como Date.toString(), no Date real — mismo
    // criterio que SellModel.getTodaySellsCount/searchSells).
    const fetchFloorMonth = comparisonStart && comparisonStart < monthStart ? comparisonStart : monthStart;
    const createdAtFloor = new Date(fetchFloorMonth.getTime() - 35 * DAY_MS);

    const rawSells = await SellSchema.find(
      { kiosco_id: kioscoId, createdAt: { $gte: createdAtFloor } },
      {
        purchase_date: 1, payment_method: 1, seller_id: 1, seller_name: 1,
        total_amount: 1, status: 1, debtor_name: 1, amount_paid: 1,
        settles_sell_id: 1, 'products._id': 1,
      },
    ).lean();

    const sells = rawSells as unknown as RawSell[];
    const monthSells = sells.filter((s) => inRange(s.purchase_date, monthStart, monthEnd));
    const comparisonSells = comparisonAvailable && comparisonStart && comparisonEnd
      ? sells.filter((s) => inRange(s.purchase_date, comparisonStart, comparisonEnd))
      : [];

    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

    const [dailySales, dailySalesSummary] = this.buildDailySales(monthSells, monthStart, daysInMonth);
    const summary = this.buildSummary(monthSells, comparisonSells, comparisonAvailable, daysInMonth);
    const paymentMethods = this.buildPaymentMethods(monthSells, summary.totalRevenue);
    const [sellers, sellersNote] = this.buildSellers(monthSells, comparisonSells, comparisonAvailable, summary.totalRevenue);
    const [hourlyBuckets, hourlySummary] = this.buildHourlyBuckets(monthSells);
    const stockAlerts = await this.buildStockAlerts(kioscoId, comparisonSells, now);
    const currentAccount = await this.buildCurrentAccount(kioscoId, monthStart, monthEnd);

    const meta: MonthlyReportMetaType = this.buildMeta(dateFloor, currentMonthStart, daysInMonth);

    return {
      month: monthStart.toISOString(),
      comparisonMonth: comparisonAvailable && comparisonStart ? comparisonStart.toISOString() : null,
      meta,
      summary,
      dailySales,
      dailySalesSummary,
      paymentMethods,
      sellers,
      sellersNote,
      hourlyBuckets,
      hourlySummary,
      stockAlerts,
      currentAccount,
    };
  }

  //──────────────────────────────────────────── 📈 Ventas por día ───────────────────────────────────────────//

  private static buildDailySales(
    monthSells: RawSell[],
    monthStart: Date,
    daysInMonth: number,
  ): [DailySalePointType[], MonthlyReportDetailType['dailySalesSummary']] {
    const amountsByDay = new Map<number, number>();
    for (const sell of monthSells) {
      const date = new Date(sell.purchase_date);
      if (Number.isNaN(date.getTime())) continue;
      const dayOfMonth = date.getDate();
      amountsByDay.set(dayOfMonth, (amountsByDay.get(dayOfMonth) ?? 0) + (sell.total_amount ?? 0));
    }

    const maxAmount = Math.max(0, ...Array.from(amountsByDay.values()));
    let bestMarked = false;

    const dailySales: DailySalePointType[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const amount = amountsByDay.get(day) ?? 0;
      const isBest = amount > 0 && amount === maxAmount && !bestMarked;
      if (isBest) bestMarked = true;
      const isoDate = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailySales.push({ isoDate, label: String(day).padStart(2, '0'), amount, isBest });
    }

    const closedDays = dailySales.filter((d) => d.amount === 0).length;
    const totalRevenue = dailySales.reduce((sum, d) => sum + d.amount, 0);
    const avgPerDay = daysInMonth > 0 ? totalRevenue / daysInMonth : 0;

    const bestDay = dailySales.find((d) => d.isBest) ?? null;
    const activeDays = dailySales.filter((d) => d.amount > 0);
    const worstDay = activeDays.reduce<DailySalePointType | null>(
      (worst, d) => (!worst || d.amount < worst.amount ? d : worst), null,
    );

    // Semanas lunes-domingo dentro del mes.
    const weekMap = new Map<string, { start: number; end: number; amount: number }>();
    for (const point of dailySales) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), Number(point.label));
      const diffToMonday = (date.getDay() + 6) % 7;
      const weekStartDay = Number(point.label) - diffToMonday;
      const key = String(weekStartDay);
      const entry = weekMap.get(key) ?? { start: weekStartDay, end: weekStartDay + 6, amount: 0 };
      entry.amount += point.amount;
      weekMap.set(key, entry);
    }
    const bestWeekEntry = Array.from(weekMap.values()).reduce<{ start: number; end: number; amount: number } | null>(
      (best, w) => (!best || w.amount > best.amount ? w : best), null,
    );
    const bestWeek = bestWeekEntry
      ? {
        label: `${String(Math.max(1, bestWeekEntry.start)).padStart(2, '0')}–${String(Math.min(daysInMonth, bestWeekEntry.end)).padStart(2, '0')}`,
        amount: bestWeekEntry.amount,
      }
      : null;

    return [dailySales, { avgPerDay, closedDays, bestDay, worstDay, bestWeek }];
  }

  //──────────────────────────────────────────── 💰 Resumen KPIs ───────────────────────────────────────────//

  private static buildSummary(
    monthSells: RawSell[],
    comparisonSells: RawSell[],
    comparisonAvailable: boolean,
    daysInMonth: number,
  ): MonthlyReportDetailType['summary'] {
    const totalSales = monthSells.length;
    const totalRevenue = monthSells.reduce((sum, s) => sum + (s.total_amount ?? 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const ticketsPerDay = daysInMonth > 0 ? totalSales / daysInMonth : 0;

    if (!comparisonAvailable) {
      return { totalSales, totalRevenue, averageTicket, ticketsPerDay, previous: null };
    }

    const previousTotalSales = comparisonSells.length;
    const previousTotalRevenue = comparisonSells.reduce((sum, s) => sum + (s.total_amount ?? 0), 0);
    const previousAverageTicket = previousTotalSales > 0 ? previousTotalRevenue / previousTotalSales : 0;

    return {
      totalSales, totalRevenue, averageTicket, ticketsPerDay,
      previous: { totalSales: previousTotalSales, totalRevenue: previousTotalRevenue, averageTicket: previousAverageTicket },
    };
  }

  //──────────────────────────────────────────── 💳 Medios de pago ───────────────────────────────────────────//

  private static buildPaymentMethods(monthSells: RawSell[], totalRevenue: number): PaymentMethodBreakdownType[] {
    const amountByMethod = new Map<string, number>();
    for (const sell of monthSells) {
      amountByMethod.set(sell.payment_method, (amountByMethod.get(sell.payment_method) ?? 0) + (sell.total_amount ?? 0));
    }

    return Array.from(amountByMethod.entries())
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  //──────────────────────────────────────────── 🧑‍💼 Vendedores ───────────────────────────────────────────//

  private static buildSellers(
    monthSells: RawSell[],
    comparisonSells: RawSell[],
    comparisonAvailable: boolean,
    totalRevenue: number,
  ): [SellerReportRowType[], MonthlyReportDetailType['sellersNote']] {
    type SellerAgg = { sellerName: string; amount: number; ticketsCount: number; maxTicketAmount: number };
    const sellerMap = new Map<string, SellerAgg>();

    for (const sell of monthSells) {
      const entry = sellerMap.get(sell.seller_id) ?? { sellerName: sell.seller_name, amount: 0, ticketsCount: 0, maxTicketAmount: 0 };
      entry.amount += sell.total_amount ?? 0;
      entry.ticketsCount += 1;
      entry.maxTicketAmount = Math.max(entry.maxTicketAmount, sell.total_amount ?? 0);
      sellerMap.set(sell.seller_id, entry);
    }

    const previousAmountBySeller = new Map<string, number>();
    for (const sell of comparisonSells) {
      previousAmountBySeller.set(sell.seller_id, (previousAmountBySeller.get(sell.seller_id) ?? 0) + (sell.total_amount ?? 0));
    }

    const sellers: SellerReportRowType[] = Array.from(sellerMap.entries())
      .map(([sellerId, agg]) => {
        const previousAmount = previousAmountBySeller.get(sellerId);
        const isNew = comparisonAvailable && previousAmount === undefined;
        const changePct = comparisonAvailable && previousAmount !== undefined
          ? (previousAmount > 0 ? ((agg.amount - previousAmount) / previousAmount) * 100 : null)
          : null;

        return {
          sellerId,
          sellerName: agg.sellerName,
          amount: agg.amount,
          ticketsCount: agg.ticketsCount,
          participationPct: totalRevenue > 0 ? (agg.amount / totalRevenue) * 100 : 0,
          changePct,
          isNew,
          maxTicketAmount: agg.maxTicketAmount,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const topTicketSeller = sellers.reduce<SellerReportRowType | null>(
      (top, seller) => (!top || seller.maxTicketAmount > top.maxTicketAmount ? seller : top), null,
    );
    const sellersNote = topTicketSeller && topTicketSeller.maxTicketAmount > 0
      ? { sellerName: topTicketSeller.sellerName, maxTicketAmount: topTicketSeller.maxTicketAmount }
      : null;

    return [sellers, sellersNote];
  }

  //──────────────────────────────────────────── 🕑 Franjas horarias ───────────────────────────────────────────//

  private static buildHourlyBuckets(monthSells: RawSell[]): [HourlyBucketType[], MonthlyReportDetailType['hourlySummary']] {
    const amounts = new Array<number>(HOURLY_BUCKET_COUNT).fill(0);

    for (const sell of monthSells) {
      const date = new Date(sell.purchase_date);
      if (Number.isNaN(date.getTime())) continue;
      const bucketIndex = Math.floor((date.getHours() - HOURLY_BUCKET_START_HOUR) / 2);
      if (bucketIndex < 0 || bucketIndex >= HOURLY_BUCKET_COUNT) continue; // fuera de 08–24, el reporte no lo muestra
      amounts[bucketIndex] += sell.total_amount ?? 0;
    }

    const maxAmount = Math.max(0, ...amounts);
    const positiveAmounts = amounts.filter((a) => a > 0);
    const minAmount = positiveAmounts.length > 0 ? Math.min(...positiveAmounts) : 0;

    let peakLabel: string | null = null;
    let lowLabel: string | null = null;

    const hourlyBuckets: HourlyBucketType[] = amounts.map((amount, index) => {
      const startHour = HOURLY_BUCKET_START_HOUR + index * 2;
      const label = `${String(startHour).padStart(2, '0')}–${String(startHour + 2).padStart(2, '0')}`;
      const isPeak = maxAmount > 0 && amount === maxAmount;
      const isLow = minAmount > 0 && amount === minAmount && !isPeak;
      if (isPeak && !peakLabel) peakLabel = label;
      if (isLow && !lowLabel) lowLabel = label;
      return { label, amount, isPeak, isLow };
    });

    return [hourlyBuckets, { peakLabel, lowLabel }];
  }

  //──────────────────────────────────────────── 📦 Quiebres / stock muerto ───────────────────────────────────────────//

  private static async buildStockAlerts(kioscoId: string, comparisonSells: RawSell[], now: Date): Promise<StockAlertsType> {
    const outOfStockPresentations = await PresentationMongo.find(
      { kiosco_id: kioscoId, stock: { $lte: 0 } },
      { _id: 1, name: 1, price: 1 },
    ).lean() as unknown as { _id: string; name: string; price: number }[];

    // Frecuencia de venta en el mes de comparación por presentación — se usa
    // como estimación simple de "unidades que se habrían vendido este mes"
    // para las presentaciones sin stock que sí rotaban antes.
    const comparisonFrequencyByPresentation = new Map<string, number>();
    for (const sell of comparisonSells) {
      for (const product of sell.products ?? []) {
        comparisonFrequencyByPresentation.set(product._id, (comparisonFrequencyByPresentation.get(product._id) ?? 0) + 1);
      }
    }

    const outOfStockSoldBefore = outOfStockPresentations.filter((p) => comparisonFrequencyByPresentation.has(p._id));
    const estimatedLostRevenue = outOfStockSoldBefore.reduce(
      (sum, p) => sum + (p.price ?? 0) * (comparisonFrequencyByPresentation.get(p._id) ?? 0), 0,
    );

    // Última venta por presentación, acotada a los últimos
    // LAST_SOLD_LOOKBACK_MONTHS meses (independiente del plan: es una foto de
    // "esto no rota", no un reporte histórico).
    const lookbackFloor = new Date(now.getFullYear(), now.getMonth() - LAST_SOLD_LOOKBACK_MONTHS, 1);
    const historicalSells = await SellSchema.find(
      { kiosco_id: kioscoId, createdAt: { $gte: lookbackFloor } },
      { purchase_date: 1, 'products._id': 1 },
    ).lean() as unknown as { purchase_date: string; products: { _id: string }[] }[];

    const lastSoldByPresentation = new Map<string, Date>();
    for (const sell of historicalSells) {
      const date = new Date(sell.purchase_date);
      if (Number.isNaN(date.getTime())) continue;
      for (const product of sell.products ?? []) {
        const previous = lastSoldByPresentation.get(product._id);
        if (!previous || date > previous) lastSoldByPresentation.set(product._id, date);
      }
    }

    const allPresentations = await PresentationMongo.find(
      { kiosco_id: kioscoId },
      { _id: 1, name: 1, price: 1, stock: 1, created_at: 1 },
    ).lean() as unknown as RawPresentation[];

    const deadStockItems = allPresentations
      .map((presentation) => {
        const lastSold = lastSoldByPresentation.get(presentation._id) ?? null;
        const referenceDate = lastSold ?? new Date(presentation.created_at);
        const days = Number.isNaN(referenceDate.getTime())
          ? 0
          : Math.floor((now.getTime() - referenceDate.getTime()) / DAY_MS);
        return { name: presentation.name, price: presentation.price, stock: presentation.stock, days };
      })
      .filter((item) => item.days >= DEAD_STOCK_DAYS);

    const deadStockValue = deadStockItems.reduce((sum, item) => sum + (item.price ?? 0) * (item.stock ?? 0), 0);
    const oldestDeadStock = deadStockItems.reduce<{ name: string; price: number; stock: number; days: number } | null>(
      (oldest, item) => (!oldest || item.days > oldest.days ? item : oldest), null,
    );

    return {
      outOfStockCount: outOfStockPresentations.length,
      outOfStockSoldInComparisonCount: outOfStockSoldBefore.length,
      estimatedLostRevenue,
      deadStockCount: deadStockItems.length,
      deadStockValue,
      oldestDeadStock: oldestDeadStock ? { name: oldestDeadStock.name, days: oldestDeadStock.days } : null,
    };
  }

  //──────────────────────────────────────────── 💸 Cuenta corriente ───────────────────────────────────────────//

  private static async buildCurrentAccount(kioscoId: string, monthStart: Date, monthEnd: Date): Promise<CurrentAccountSummaryType> {
    // La deuda vigente no está acotada al mes del reporte (puede venir de
    // meses anteriores), así que se trae aparte, sin piso de createdAt.
    const debtRelatedSells = await SellSchema.find(
      { kiosco_id: kioscoId, $or: [{ status: 'parcial' }, { settles_sell_id: { $ne: null } }] },
      { purchase_date: 1, status: 1, debtor_name: 1, total_amount: 1, amount_paid: 1, settles_sell_id: 1 },
    ).lean() as unknown as RawSell[];

    const outstandingDebtSells = debtRelatedSells.filter((s) => s.status === 'parcial');
    const debtorNames = new Set(outstandingDebtSells.map((s) => s.debtor_name).filter((name): name is string => Boolean(name)));
    const totalDebt = outstandingDebtSells.reduce((sum, s) => sum + ((s.total_amount ?? 0) - (s.amount_paid ?? 0)), 0);

    const settlementSellsThisMonth = debtRelatedSells.filter((s) => s.settles_sell_id && inRange(s.purchase_date, monthStart, monthEnd));
    const collectedThisMonth = settlementSellsThisMonth.reduce((sum, s) => sum + (s.total_amount ?? 0), 0);

    const newDebtSellsThisMonth = outstandingDebtSells.filter((s) => inRange(s.purchase_date, monthStart, monthEnd));
    const newDebtThisMonth = newDebtSellsThisMonth.reduce((sum, s) => sum + ((s.total_amount ?? 0) - (s.amount_paid ?? 0)), 0);

    return {
      debtorsCount: debtorNames.size,
      totalDebt,
      collectedThisMonth,
      newDebtThisMonth,
      paymentsCount: settlementSellsThisMonth.length,
    };
  }

  //──────────────────────────────────────────── 🗓️ Meta ───────────────────────────────────────────//

  private static buildMeta(dateFloor: Date | null, currentMonthStart: Date, daysInMonth: number): MonthlyReportMetaType {
    const availableMonths = dateFloor
      ? [monthKey(currentMonthStart)]
      : Array.from({ length: AVAILABLE_MONTHS_COUNT }, (_, i) => monthKey(addMonths(currentMonthStart, -i)));

    return {
      availableMonths,
      canCompare: dateFloor === null,
      daysInMonth,
      generatedAt: new Date().toISOString(),
    };
  }
}
