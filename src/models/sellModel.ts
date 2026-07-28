import { presentation } from '@typings/presentation';
import {
    CreateSellPayloadType,
    DeleteSellPayloadType,
    EditSellPayloadType,
    GetSellsByProductPayloadType,
    SellRawPayloadType,
    SellType,
} from '@typings/sell';
import { SellSchema } from '../schemas/sellSchema';
import { Validation } from './validation';

/*──────────────────────────────
💰 SellModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de ventas contra MongoDB
🧩 Dependencias: SellSchema, Validation, sellTypes
──────────────────────────────*/

export class SellModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getSells(limit = 100, offset = 0): Promise<SellType[]> {
        const results = await SellSchema.find()
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();
        return results as unknown as SellType[];
    }

    static async getSellsByField<T extends keyof SellRawPayloadType>(
        field: T,
        value: SellRawPayloadType[T],
        type: 'string' | 'number',
    ): Promise<SellType[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results = await SellSchema.find({ [field]: value }).lean();
        return results as unknown as SellType[];
    }

    static async getSellsByProduct(data: GetSellsByProductPayloadType): Promise<SellType[]> {
        const { _id }: { _id: unknown } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        // Busca ventas donde algún producto dentro del array tenga ese product_id
        const results = await SellSchema.find({
            'products.product_id': _idResult,
        }).limit(100).lean();

        return results as unknown as SellType[];
    }

    /*══════════ 📊 getTodaySellsCount ══════════╗
    ║ 📥 Entrada: -                               ║
    ║ ⚙️ Proceso: cuenta ventas cuya purchase_date ║
    ║    (guardada como Date.toString()) coincide  ║
    ║    con el día de hoy, y calcula la fecha de  ║
    ║    la venta más reciente del día (lastSaleAt)║
    ║    Filtrado en memoria porque purchase_date  ║
    ║    no es un Date nativo.                     ║
    ║ 📤 Salida: { count, lastSaleAt }             ║
    ╚═══════════════════════════════════════════╝*/

    static async getTodaySellsCount(): Promise<{ count: number; lastSaleAt: string | null }> {
        // Traemos purchase_date y createdAt; nada más, para no cargar documentos completos.
        const results = await SellSchema.find({}, { purchase_date: 1, createdAt: 1 }).lean();

        const todayStr: string = new Date().toDateString();

        const todaySells = (results as unknown as { purchase_date: string; createdAt?: Date }[]).filter((sell) => {
            const parsedDate = new Date(sell.purchase_date);
            if (Number.isNaN(parsedDate.getTime())) return false;
            return parsedDate.toDateString() === todayStr;
        });

        if (todaySells.length === 0) {
            return { count: 0, lastSaleAt: null };
        }

        const lastSaleAt = todaySells.reduce<Date | null>((latest, sell) => {
            if (!sell.createdAt) return latest;
            const createdAtDate = new Date(sell.createdAt);
            if (!latest || createdAtDate > latest) return createdAtDate;
            return latest;
        }, null);

        return {
            count: todaySells.length,
            lastSaleAt: lastSaleAt ? lastSaleAt.toISOString() : null,
        };
    }

    //──────────────────────────────────────────── 🔎 SEARCH 🔎 ───────────────────────────────────────────//

    /*══════════ 🔎 searchSells ══════════╗
    ║ 📥 Entrada: term (string libre)      ║
    ║ ⚙️ Proceso: matchea contra _id y      ║
    ║    seller_name por regex; si el term  ║
    ║    es numérico, matchea total_amount  ║
    ║    exacto; si tiene forma dd/mm/yyyy, ║
    ║    matchea purchase_date (guardado    ║
    ║    como Date.toString())              ║
    ║ 📤 Salida: SellType[]                 ║
    ╚═══════════════════════════════════════╝*/

    static async searchSells(term: unknown): Promise<SellType[]> {
        const termResult: string = Validation.stringValidation(term, 'term');
        const regex = { $regex: termResult, $options: 'i' };

        const orConditions: Record<string, unknown>[] = [
            { _id: regex },
            { seller_name: regex },
        ];

        const numericTerm = Number(termResult);
        if (termResult.trim() !== '' && !Number.isNaN(numericTerm)) {
            orConditions.push({ total_amount: numericTerm });
        }

        const dateMatch = termResult.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
            const dateStr = parsedDate.toDateString(); // ej: "Wed Jul 01 2026"
            orConditions.push({ purchase_date: { $regex: dateStr, $options: 'i' } });
        }

        const results = await SellSchema.find({ $or: orConditions }).limit(100).lean();
        return results as unknown as SellType[];
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    static async create(data: CreateSellPayloadType): Promise<string> {
        const {
            currency, iva, payment_method, products,
            purchase_date, seller_id, seller_name,
            sub_total, total_amount,
            status, amount_paid, debtor_name,
        } = data;

        function parseDate(input: string): Date {
            const [day, month, year] = input.split("/").map(Number);
            const now = new Date();
            return new Date(
                year,
                month - 1,
                day,
                now.getHours(),
                now.getMinutes(),
                now.getSeconds(),
            );
        }

        const purchaseDateObj: Date = parseDate(purchase_date as string);

        const productsResult: presentation[]  = Validation.isVariantArray(products);
        const purchaseDateResult: string        = Validation.date(purchaseDateObj, 'purchase date');
        const sellerIdResult: string            = Validation.stringValidation(seller_id, 'seller id');
        const sellerNameResult: string          = Validation.stringValidation(seller_name, 'seller name');
        const subTotalResult: number            = Validation.number(sub_total, 'sub total');
        const ivaResult: number                 = Validation.number(iva, 'iva', true);
        const totalAmountResult: number         = Validation.number(total_amount, 'total amount');
        const paymentMethodResult: string       = Validation.stringValidation(payment_method, 'payment method');
        const currencyResult: string            = Validation.stringValidation(currency, 'currency');
        const statusResult: string              = Validation.stringValidation(status, 'status');

        const isPartial: boolean = statusResult === 'parcial';

        const amountPaidResult: number | null = isPartial
            ? Validation.number(amount_paid, 'amount paid')
            : null;

        const debtorNameResult: string | null = isPartial
            ? Validation.stringValidation(debtor_name, 'debtor name')
            : null;

        const _id: string = crypto.randomUUID();

        await SellSchema.create({
            _id,
            purchase_date:     purchaseDateResult,
            modification_date: '',
            seller_id:         sellerIdResult,
            seller_name:       sellerNameResult,
            payment_method:    paymentMethodResult,
            products:          productsResult,
            sub_total:         subTotalResult,
            iva:               ivaResult,
            total_amount:      totalAmountResult,
            currency:          currencyResult,
            status:            statusResult,
            amount_paid:       amountPaidResult,
            debtor_name:       debtorNameResult,
        });

        return _id;
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    static async delete(data: DeleteSellPayloadType): Promise<void> {
        const { _id }: { _id: unknown } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const deleted = await SellSchema.findOneAndDelete({ _id: _idResult });
        if (!deleted) throw new Error(`There is not any sell with that id ${_id}`);
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    static async edit(data: EditSellPayloadType): Promise<void> {
        const { _id, products, purchase_date, seller_name, total_amount } = data;

        const _idResult: string                = Validation.stringValidation(_id, '_id');
        const productsResult: presentation[] = Validation.isVariantArray(products);
        const purchaseDateResult: string       = Validation.date(purchase_date, 'purchase_date');
        const sellerNameResult: string         = Validation.stringValidation(seller_name, 'seller_name');
        const totalAmountResult: number        = Validation.number(total_amount, 'total_amount');

        const updated = await SellSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: {
                products:          productsResult,
                purchase_date:     purchaseDateResult,
                modification_date: new Date().toISOString(),
                seller_name:       sellerNameResult,
                total_amount:      totalAmountResult,
            }},
        );

        if (!updated) throw new Error(`There is not any sell with that id ${_id}`);
    }
}