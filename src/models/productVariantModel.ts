import { ProductVariantSchema } from '../schemas/productVariantSchema';
import { 
    CreateProductVariantPayload, 
    EditProductVariantPayload, 
    GetProductVariantByIdPayload, 
    ProductVariant, 
} from '@typings/productVariant';
import { Validation } from './validation';

/*──────────────────────────────
🎨 ProductVariantModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de variantes de producto contra MongoDB
🧩 Dependencias: ProductVariantSchema, Validation, productVariantTypes
──────────────────────────────*/

export class ProductVariantModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getAllProductVariants ══════════╗
    ║ 📥 Entrada: ninguna                           ║
    ║ ⚙️ Proceso: obtiene hasta 100 variantes       ║
    ║ 📤 Salida: ProductVariant[]                   ║
    ╚═════════════════════════════════════════════╝*/
    static async getAllProductVariants(): Promise<ProductVariant[]> {
        const results = await ProductVariantSchema.find().limit(100).lean();
        return results as unknown as ProductVariant[];
    }

    /*══════════ 🎮 getProductVariantByField ══════════╗
    ║ 📥 Entrada: field, value, type ('string'|'number') ║
    ║ ⚙️ Proceso: valida tipo y busca variantes por campo ║
    ║ 📤 Salida: ProductVariant[]                         ║
    ╚════════════════════════════════════════════════════╝*/
    static async getProductVariantByField<T extends keyof ProductVariant>(
        field: T,
        value: ProductVariant[T],
        type: 'string' | 'number',
    ): Promise<ProductVariant[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results = await ProductVariantSchema.find({ [field]: value }).lean();
        return results as unknown as ProductVariant[];
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 createProductVariant ══════════╗
    ║ 📥 Entrada: CreateProductVariantPayload      ║
    ║ ⚙️ Proceso: valida, controla duplicados y guarda ║
    ║ 📤 Salida: string _id generado               ║
    ╚═════════════════════════════════════════════╝*/
    static async createProductVariant(data: CreateProductVariantPayload): Promise<string> {
        const {
            name, description, image_url, gallery_urls, brand,
            product_id, sku, model_type, model_size,
            min_stock, stock, price, expiration_date
        } = data;

        const nameResult: string          = Validation.stringValidation(name, 'name');
        const descriptionResult: string   = Validation.stringValidation(description, 'description');
        const imageUrlResult: string      = Validation.image(image_url);
        const galleryUrlsResult: string[] = Validation.imageArray(gallery_urls);
        const brandResult: string         = Validation.stringValidation(brand, 'brand');
        const productIdResult: string     = Validation.stringValidation(product_id, 'product_id');
        const skuResult: string           = Validation.stringValidation(sku, 'sku');
        const modelTypeResult: string     = Validation.stringValidation(model_type, 'model_type');
        const modelSizeResult: string     = Validation.stringValidation(model_size, 'model_size', 2);
        const minStockResult: number      = Validation.number(min_stock, 'min_stock');
        const stockResult: number         = Validation.number(stock, 'stock');
        const priceResult: number         = Validation.number(price, 'price');
        const expirationDateResult: string = Validation.date(expiration_date, 'expiration_date');

        const existing = await ProductVariantSchema.findOne({ name: nameResult }).lean();
        if (existing) throw new Error('Product Variant already exists');

        const _id: string = crypto.randomUUID();

        await ProductVariantSchema.create({
            _id,
            name:            nameResult,
            description:     descriptionResult,
            created_at:      new Date().toISOString(),
            updated_at:      new Date().toISOString(),
            image_url:       imageUrlResult,
            gallery_urls:    galleryUrlsResult,
            brand:           brandResult,
            product_id:      productIdResult,
            sku:             skuResult,
            model_type:      modelTypeResult,
            model_size:      modelSizeResult,
            min_stock:       minStockResult,
            stock:           stockResult,
            price:           priceResult,
            expiration_date: expirationDateResult,
        });

        return _id;
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 deleteProductVariant ══════════╗
    ║ 📥 Entrada: GetProductVariantByIdPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina variante        ║
    ║ 📤 Salida: void                                 ║
    ╚═══════════════════════════════════════════════╝*/
    static async deleteProductVariant(data: GetProductVariantByIdPayload): Promise<void> {
        const { _id } = data;
        const _idResult: string = Validation.stringValidation(_id, 'id');

        const deleted = await ProductVariantSchema.findOneAndDelete({ _id: _idResult });
        if (!deleted) throw new Error('Does not exist a productVariant with this id');
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    /*══════════ 🎮 editProductVariant ══════════╗
    ║ 📥 Entrada: EditProductVariantPayload      ║
    ║ ⚙️ Proceso: valida campos y actualiza      ║
    ║ 📤 Salida: void                            ║
    ╚════════════════════════════════════════════╝*/
    static async editProductVariant(data: EditProductVariantPayload): Promise<void> {
        const {
            _id, name, description, created_at, updated_at, image_url,
            gallery_urls, brand, product_id, sku, model_type, model_size,
            min_stock, stock, price, expiration_date
        } = data;

        const _idResult: string            = Validation.stringValidation(_id, 'id');
        const nameResult: string           = Validation.stringValidation(name, 'name');
        const descriptionResult: string    = Validation.stringValidation(description, 'description');
        const createdAtResult: string      = Validation.date(created_at, 'created_at');
        const updatedAtResult: string      = Validation.date(updated_at, 'updated_at');
        const imageUrlResult: string       = Validation.image(image_url);
        const galleryUrlsResult: string[]  = Validation.imageArray(gallery_urls);
        const brandResult: string          = Validation.stringValidation(brand, 'brand');
        const productIdResult: string      = Validation.stringValidation(product_id, 'product_id');
        const skuResult: string            = Validation.stringValidation(sku, 'sku');
        const modelTypeResult: string      = Validation.stringValidation(model_type, 'model_type');
        const modelSizeResult: string      = Validation.stringValidation(model_size, 'model_size', 2);
        const minStockResult: number       = Validation.number(min_stock, 'min_stock');
        const stockResult: number          = Validation.number(stock, 'stock');
        const priceResult: number          = Validation.number(price, 'price');
        const expirationDateResult: string = Validation.date(expiration_date, 'expiration_date');

        const updated = await ProductVariantSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: {
                name:            nameResult,
                description:     descriptionResult,
                created_at:      createdAtResult,
                updated_at:      updatedAtResult,
                image_url:       imageUrlResult,
                gallery_urls:    galleryUrlsResult,
                brand:           brandResult,
                product_id:      productIdResult,
                sku:             skuResult,
                model_type:      modelTypeResult,
                model_size:      modelSizeResult,
                min_stock:       minStockResult,
                stock:           stockResult,
                price:           priceResult,
                expiration_date: expirationDateResult,
            }},
        );

        if (!updated) throw new Error('Does not exist a productVariant with this id');
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
}