import { ProductVariant } from '@typings/productVariant';
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
        const results = await SellSchema.find().skip(offset).limit(limit).lean();
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

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    static async create(data: CreateSellPayloadType): Promise<string> {
        const {
            currency, iva, payment_method, products,
            purchase_date, seller_id, seller_name,
            sub_total, total_amount,
        } = data;

        function parseDate(input: string): Date {
          const [day, month, year] = input.split("/").map(Number);
          return new Date(year, month - 1, day); // month es 0-indexado
        }

        const purchaseDateObj: Date = parseDate(purchase_date as string);

        const productsResult: ProductVariant[]  = Validation.isVariantArray(products);
        const purchaseDateResult: string        = Validation.date(purchaseDateObj, 'purchase date');
        const sellerIdResult: string            = Validation.stringValidation(seller_id, 'seller id');
        const sellerNameResult: string          = Validation.stringValidation(seller_name, 'seller name');
        const subTotalResult: number            = Validation.number(sub_total, 'sub total');
        const ivaResult: number                 = Validation.number(iva, 'iva', true);
        const totalAmountResult: number         = Validation.number(total_amount, 'total amount');
        const paymentMethodResult: string       = Validation.stringValidation(payment_method, 'payment method');
        const currencyResult: string            = Validation.stringValidation(currency, 'currency');

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
        const productsResult: ProductVariant[] = Validation.isVariantArray(products);
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