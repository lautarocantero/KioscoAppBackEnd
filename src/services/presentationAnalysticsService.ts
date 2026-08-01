import { SellSchema } from '../schemas/sellSchema';
import { DailySalePoint, PresentationAnalyticsRaw, WeeklySalePoint } from '@typings/sell';

// ─── PresentationAnalyticsService ──────────────────────────────────
// Cruza presentation + sell. No vive en PresentationModel porque ese
// modelo solo debe conocer la colección "presentations" — misma regla
// que separa CatalogService de ProductModel.

const GRAMS_PER_WEIGHT_UNIT = 100; // el precio de las presentaciones "weight" está expresado por cada 100g

export class PresentationAnalyticsService {

  static async getAnalytics(
    presentation_id: string,
    start_date?: string,
    end_date?: string,
    seller_id?: string,
  ): Promise<PresentationAnalyticsRaw> {

    const end = end_date ? new Date(`${end_date}T23:59:59`) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = start_date
      ? new Date(`${start_date}T00:00:00`)
      : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const rangeDaysMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - rangeDaysMs);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    const sells = await SellSchema.find({
      'products._id': presentation_id,
      ...(seller_id ? { seller_id } : {}),
    }).lean();

    type RawSell = {
      purchase_date: string;
      seller_id: string;
      products: { _id: string; price: number; stock_required: number; sale_type?: string }[];
    };

    // El precio de las presentaciones "weight" está expresado por cada 100g,
    // mientras que stock_required guarda los gramos reales — hay que dividir
    // por GRAMS_PER_WEIGHT_UNIT antes de multiplicar por el precio, igual que
    // en el resto de los cálculos de importe del front (calculateItemAmount).
    const calculateRevenue = (price: number, quantity: number, saleType?: string): number =>
      saleType === 'weight'
        ? (quantity * price) / GRAMS_PER_WEIGHT_UNIT
        : quantity * price;

    const buildBucket = (from: Date, to: Date) => {
      const perDay = new Map<string, { units: number; revenue: number }>();
      let salesCount = 0;

      for (const raw of sells as unknown as RawSell[]) {
        const purchaseDate = new Date(raw.purchase_date);
        if (isNaN(purchaseDate.getTime())) continue;
        if (purchaseDate < from || purchaseDate > to) continue;

        const matching = raw.products.filter((p) => p._id === presentation_id);
        if (matching.length === 0) continue;

        salesCount += 1;
        const dayKey = purchaseDate.toISOString().slice(0, 10);
        const bucket = perDay.get(dayKey) ?? { units: 0, revenue: 0 };

        for (const product of matching) {
          const units = Number(product.stock_required) || 1;
          const price = Number(product.price ?? 0);
          bucket.units += units;
          bucket.revenue += calculateRevenue(price, units, product.sale_type);
        }
        perDay.set(dayKey, bucket);
      }

      return { perDay, salesCount };
    };

    const current = buildBucket(start, end);
    const previous = buildBucket(prevStart, prevEnd);

    const formatDayLabel = (isoDate: string): string =>
      new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' })
        .format(new Date(`${isoDate}T00:00:00`))
        .replace('.', '');

    const dailySales: DailySalePoint[] = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const isoDate = cursor.toISOString().slice(0, 10);
      const bucket = current.perDay.get(isoDate) ?? { units: 0, revenue: 0 };
      dailySales.push({ isoDate, date: formatDayLabel(isoDate), units: bucket.units, revenue: bucket.revenue });
    }

    const weeklyMap = new Map<string, { start: Date; end: Date; units: number; revenue: number }>();
    for (const point of dailySales) {
      const d = new Date(`${point.isoDate}T00:00:00`);
      const diffToMonday = (d.getDay() + 6) % 7;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - diffToMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const key = weekStart.toISOString().slice(0, 10);

      const entry = weeklyMap.get(key) ?? { start: weekStart, end: weekEnd, units: 0, revenue: 0 };
      entry.units += point.units;
      entry.revenue += point.revenue;
      weeklyMap.set(key, entry);
    }

    const weeklySales: WeeklySalePoint[] = Array.from(weeklyMap.values())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((w) => ({
        weekLabel: `${formatDayLabel(w.start.toISOString().slice(0, 10))} - ${formatDayLabel(w.end.toISOString().slice(0, 10))}`,
        units: w.units,
        revenue: w.revenue,
      }));

    const topSellingDays = [...dailySales]
      .filter((d) => d.units > 0)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const activeDays = dailySales.filter((d) => d.units > 0);
    const totalUnits = dailySales.reduce((acc, d) => acc + d.units, 0);
    const totalRevenue = dailySales.reduce((acc, d) => acc + d.revenue, 0);
    const avgTicket = current.salesCount > 0 ? totalRevenue / current.salesCount : 0;

    const prevUnits = Array.from(previous.perDay.values()).reduce((acc, b) => acc + b.units, 0);
    const prevRevenue = Array.from(previous.perDay.values()).reduce((acc, b) => acc + b.revenue, 0);
    const prevActiveDays = Array.from(previous.perDay.values()).filter((b) => b.units > 0).length;
    const prevAvgTicket = previous.salesCount > 0 ? prevRevenue / previous.salesCount : 0;

    const pctChange = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr === 0 ? 0 : null;
      return ((curr - prev) / prev) * 100;
    };

    const maxDaily = dailySales.reduce<DailySalePoint | null>(
      (max, d) => (!max || d.units > max.units ? d : max), null,
    );
    const minDaily = activeDays.reduce<DailySalePoint | null>(
      (min, d) => (!min || d.units < min.units ? d : min), null,
    );

    return {
      presentation_id,
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
      comparisonRange: { start: prevStart.toISOString().slice(0, 10), end: prevEnd.toISOString().slice(0, 10) },
      totals: { units: totalUnits, revenue: totalRevenue, activeDays: activeDays.length, avgTicket },
      previousTotals: { units: prevUnits, revenue: prevRevenue, activeDays: prevActiveDays, avgTicket: prevAvgTicket },
      deltas: {
        unitsPct: pctChange(totalUnits, prevUnits),
        revenuePct: pctChange(totalRevenue, prevRevenue),
        activeDaysPct: pctChange(activeDays.length, prevActiveDays),
        avgTicketPct: pctChange(avgTicket, prevAvgTicket),
      },
      dailySales,
      weeklySales,
      topSellingDays,
      periodSummary: {
        maxDaily,
        minDaily,
        avgDailyUnits: activeDays.length > 0 ? totalUnits / activeDays.length : 0,
        activeDaysCount: activeDays.length,
      },
    };
  }
}