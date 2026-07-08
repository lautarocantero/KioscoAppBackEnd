// controllers/presentation.controller.ts

import { Request, Response } from 'express';
import { PresentationSchema } from '../models/presentationModel';
import {
    CreatePresentationRequest,
    DeletePresentationRequest,
    EditPresentationRequest,
    GetPresentationByIdRequest,
    GetPresentationByModelSizeRequest,
    GetPresentationByPriceRequest,
    GetPresentationByProductIdRequest,
    GetPresentationByStatusRequest,
    GetPresentationByStockRequest,
    presentation,
} from '@typings/presentation';
import { handleControllerError } from '../utils/handleControllerError';
import { randomUUID } from 'crypto';
import { DailySalePoint, GetPresentationAnalyticsRequest, PresentationAnalyticsRaw, WeeklySalePoint } from '@typings/sell';
import { SellSchema } from '../schemas/sellSchema';

//──────────────────────────────────────── GET ────────────────────────────────//

export async function home(_req: Request, res: Response): Promise<void> {
    res.status(200).send(`
        Estás en presentation<br>
        Endpoints =><br>
        ---- GET    /get-product-presentations<br>
        ---- GET    /get-presentation-by-id/:product_presentation_id<br>
        ---- GET    /get-presentation-by-product-id/:product_id<br>
        ---- GET    /get-presentation-by-stock<br>
        ---- GET    /get-presentation-by-price<br>
        ---- GET    /get-presentation-by-status<br>
        ---- GET    /get-presentation-by-net-content<br>
        ---- POST   /create-presentation<br>
        ---- PUT    /edit-presentation/:presentation_id<br>
        ---- DELETE /delete-presentation<br>
    `);
}

export async function getPresentations(_req: Request, res: Response): Promise<void> {
    try {
        const presentations: presentation[] = await PresentationSchema.find();
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationById(
    req: GetPresentationByIdRequest,
    res: Response,
): Promise<void> {
    const { product_presentation_id } = req.params;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ _id: product_presentation_id });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByProductId(
    req: GetPresentationByProductIdRequest,
    res: Response,
): Promise<void> {
    const { product_id } = req.params;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ product_id });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByStock(
    req: GetPresentationByStockRequest,
    res: Response,
): Promise<void> {
    const { stock } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ stock });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByPrice(
    req: GetPresentationByPriceRequest,
    res: Response,
): Promise<void> {
    const { price } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ price });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByStatus(
    req: GetPresentationByStatusRequest,
    res: Response,
): Promise<void> {
    const { status } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ status });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByModelSize(
    req: GetPresentationByModelSizeRequest,
    res: Response,
): Promise<void> {
    const { model_size } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ model_size });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 searchPresentationsByProductId → Busca presentaciones de un producto por término            ║
║ 📥 Entrada: product_id (params), term (query)                                                  ║
║ ⚙️ Proceso: filtra por product_id + coincidencia parcial case-insensitive en name/sku/model_type/model_size ║
║ 📤 Salida: JSON [presentation]                                                                 ║
║ 🛠️ Errores: handleControllerError                                                               ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function searchPresentationsByProductId(
    req: GetPresentationByProductIdRequest, // reusa el mismo tipo, ya trae params.product_id
    res: Response,
): Promise<void> {
    const { product_id } = req.params;
    const term = (req.query.term as string) ?? '';

    try {
        const regex = { $regex: term, $options: 'i' };

        const presentations: presentation[] = await PresentationSchema.find({
            product_id,
            $or: [
                { name: regex },
                { sku: regex },
                { model_type: regex },
                { model_size: regex },
            ],
        });

        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── ANALYTICS ──────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getPresentationAnalytics → Analíticas de ventas de una presentación puntual             ║
║ 📥 Entrada: params.presentation_id, query: start_date?, end_date?                          ║
║ ⚙️ Proceso: filtra ventas donde products._id === presentation_id, agrega por día/semana    ║
║ 📤 Salida: PresentationAnalyticsRaw                                                        ║
║ 🛠️ Errores: handleControllerError                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getPresentationAnalytics(
    req: GetPresentationAnalyticsRequest,
    res: Response,
): Promise<void> {
    const { presentation_id } = req.params;
    const { start_date, end_date } = req.query;

    try {
        const analytics = await buildPresentationAnalytics(presentation_id, start_date, end_date);
        res.status(200).json(analytics);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── helper interno ─────────────────────//
// No exportado: la agregación vive acá porque conceptualmente pertenece a
// "presentation" (analítica DE una presentación), aunque la fuente de datos
// cruda sea la colección de sells.

async function buildPresentationAnalytics(
    presentation_id: string,
    start_date?: string,
    end_date?: string,
): Promise<PresentationAnalyticsRaw> {

    // ── Rango solicitado (default: últimos 30 días incluyendo hoy) ──
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

    // Sólo filtramos en Mongo por presencia de la presentación en el array.
    // El resto (fechas, montos) se calcula en JS por el formato no-ISO de purchase_date.
    const sells = await SellSchema.find({ 'products._id': presentation_id }).lean();

    type RawSell = {
        purchase_date: string;
        products: { _id: string; price: number; stock_required: number }[];
    };

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
                bucket.units += units;
                bucket.revenue += units * Number(product.price ?? 0);
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

    // ── dailySales: incluye TODOS los días del rango, incluso sin ventas ──
    const dailySales: DailySalePoint[] = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const isoDate = cursor.toISOString().slice(0, 10);
        const bucket = current.perDay.get(isoDate) ?? { units: 0, revenue: 0 };
        dailySales.push({ isoDate, date: formatDayLabel(isoDate), units: bucket.units, revenue: bucket.revenue });
    }

    // ── weeklySales: agrupado lunes a domingo ──
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
//──────────────────────────────────────── POST ───────────────────────────────//

export async function createPresentation(
    req: CreatePresentationRequest,
    res: Response,
): Promise<void> {
    const {
        product_id, sku,
        name, description, brand,
        image_url, gallery_urls,
        model_type, model_size,
        min_stock, stock,
        price, expiration_date,
    } = req.body;

    const parsedPrice      = Number(price);
    const parsedMinStock   = Number(min_stock);
    const parsedStock      = Number(stock);

    const parsedGalleryUrls: string[] =
        typeof gallery_urls === 'string'
            ? JSON.parse(gallery_urls)
            : (gallery_urls as string[]) ?? [];

    const imageUrl = req.file ? req.file.path : image_url;
    const now = new Date().toISOString();

    try {
        const _id = randomUUID();

        const presentation = await PresentationSchema.create({
            _id,
            product_id, sku,
            name, description, brand,
            image_url: imageUrl,
            gallery_urls: parsedGalleryUrls,
            model_type, model_size,
            min_stock: parsedMinStock,
            stock: parsedStock,
            price: parsedPrice,
            status: parsedStock > 0 ? 'available' : 'out_of_stock',
            created_at: now,
            updated_at: now,
            expiration_date: expiration_date as string ?? '',
        });

        res.status(200).json({ _id: presentation._id, message: 'Product presentation created successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── PUT ────────────────────────────────//

export async function editPresentation(
    req: EditPresentationRequest,
    res: Response,
): Promise<void> {
    const { presentation_id } = req.params;
    const {
        sku, price, expiration_date,
        stock, min_stock,
        model_type, model_size,
        image_url, gallery_urls,
        brand, description,
    } = req.body;

    try {
        const result = await PresentationSchema.updateOne(
            { _id: presentation_id },
            {
                $set: {
                    sku,
                    name:            `${model_type} ${model_size}`,
                    model_type,
                    model_size,
                    brand:           brand ?? '',
                    description:     description ?? '',
                    price:           Number(price),
                    stock:           Number(stock),
                    min_stock:       Number(min_stock),
                    status:          Number(stock) > 0 ? 'available' : 'out_of_stock',
                    image_url:       image_url ?? '',
                    gallery_urls:    gallery_urls ?? [],
                    updated_at:      new Date().toISOString(),
                    expiration_date: expiration_date ?? '',
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({ message: `Variante ${presentation_id} no encontrada` });
            return;
        }

        res.status(200).json({ _id: presentation_id, message: 'Product presentation edited successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── DELETE ─────────────────────────────//

export async function deletePresentation(
    req: DeletePresentationRequest,
    res: Response,
): Promise<void> {
    const { _id } = req.body;
    try {
        await PresentationSchema.deleteOne({ _id });
        res.status(200).json({ message: 'Product presentation deleted successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}