import { ProductVariantSchema } from '../schemas/productVariantSchema';
import { 
    CreateProductVariantPayload, 
    EditProductVariantPayload, 
    GetProductVariantByIdPayload, 
    ProductVariant, 
    ProductVariantModelType 
} from '@typings/productVariant';
import { Validation } from './validation';

/*──────────────────────────────
🎨 ProductVariantModel
──────────────────────────────
📜 Propósito: Gestión completa de variantes de producto (creación, consulta, edición, eliminación)
🧩 Dependencias: ProductVariantSchema, Validation, productVariantTypes
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Validaciones estrictas en todos los campos
   - Control de duplicados (name único)
   - Manejo seguro de imágenes, stock y precios
──────────────────────────────*/

/*──────────────────────────────
📚 Tipos usados en ProductVariant
──────────────────────────────
- ProductVariant: entidad principal de variante
- ProductVariantModelType: instancia del modelo en BD
- CreateProductVariantPayload: payload para crear variante
- EditProductVariantPayload: payload para editar variante
- GetProductVariantByIdPayload: payload para obtener/eliminar variante por id
──────────────────────────────*/

/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Validar todos los campos antes de guardar
🗑️ Evitar duplicados (name único)
🖼️ Validar URLs de imágenes y galerías
📦 Controlar stock y min_stock
💲 Validar precios y fechas de expiración
──────────────────────────────*/

/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[getAllProductVariants] → devuelve hasta 100 variantes
[getProductVariantByField] → busca variantes por campo validado
[createProductVariant] → valida campos, controla duplicados, guarda variante
[deleteProductVariant] → elimina variante por _id
[editProductVariant] → actualiza datos validados de variante
──────────────────────────────*/

export class ProductVariantModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getAllProductVariants ══════════╗
    ║ 📥 Entrada: ninguna                           ║
    ║ ⚙️ Proceso: obtiene hasta 100 variantes       ║
    ║ 📤 Salida: ProductVariant[]                   ║
    ║ 🛠️ Errores: ninguno explícito                 ║
    ╚═════════════════════════════════════════════╝*/
    static async getAllProductVariants(): Promise<ProductVariant[]> {
        let count = 0;
        const results: ProductVariant[] = [];

        ProductVariantSchema.find((item: ProductVariant) => {
            if(count < 100) {
                results.push(item);
                count++;
                return true;
            }
            return false;
        });

        return results as ProductVariant[];
    }

    /*══════════ 🎮 getProductVariantByField ══════════╗
    ║ 📥 Entrada: field, value, type ('string'|'number') ║
    ║ ⚙️ Proceso: valida tipo y busca variantes por campo ║
    ║ 📤 Salida: ProductVariant[]                         ║
    ║ 🛠️ Errores: tipo no soportado, validaciones fallidas ║
    ╚════════════════════════════════════════════════════╝*/
    static async getProductVariantByField<T extends keyof ProductVariant>(
        field: T,
        value: ProductVariant[T],
        type: 'string' | 'number',
    ): Promise<ProductVariant[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results: ProductVariant[] = [];
        ProductVariantSchema.find((item: ProductVariant) => {
            if (item?.[field] === value) {
                results.push(item);
                return true;
            }
            return false;
        });

        return results as ProductVariant[];
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 createProductVariant ══════════╗
    ║ 📥 Entrada: CreateProductVariantPayload {name,description,image_url,gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,stock,price,expiration_date} ║
    ║ ⚙️ Proceso: valida campos, controla duplicados, genera _id y guarda variante                                                   ║
    ║ 📤 Salida: string _id generado                                                                                                 ║
    ║ 🛠️ Errores: variante existente, validaciones fallidas                                                                         ║
    ╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
    static async createProductVariant (data: CreateProductVariantPayload) : Promise<string> {
        const {
            name,description,image_url,
            gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,
            stock,price,expiration_date
        } = data;

        const nameResult: string = Validation.stringValidation(name,'name');
        const descriptionResult: string = Validation.stringValidation(description,'description');
        const imageUrlResult: string = Validation.image(image_url);
        const galleryUrlsResult: string[] = Validation.imageArray(gallery_urls);
        const brandResult: string = Validation.stringValidation(brand,'brand');
        const productIdResult: string = Validation.stringValidation(product_id,'product_id');
        const skuResult: string = Validation.stringValidation(sku,'sku');
        const modelTypeResult: string = Validation.stringValidation(model_type,'model_type');
        const modelSizeResult: string = Validation.stringValidation(model_size,'model_size', 2);
        const minStockResult: number = Validation.number(min_stock,'min_stock');
        const stockResult: number = Validation.number(stock,'stock');
        const priceResult: number = Validation.number(price,'price');
        const expirationDateResult: string = Validation.date(expiration_date,'expiration_date');

        const productVariantObject: ProductVariant = ProductVariantSchema.findOne({name: nameResult });
        if (productVariantObject) throw new Error ('Product Variant already exists');

        const _id : string = crypto.randomUUID();

        ProductVariantSchema.create({
            _id: _id,
            name: nameResult,
            description: descriptionResult,
            created_at: new Date().toISOString() as string,
            updated_at: new Date().toISOString() as string,
            image_url: imageUrlResult,
            gallery_urls: galleryUrlsResult,
            brand: brandResult,
            product_id: productIdResult,
            sku: skuResult,
            model_type: modelTypeResult,
            model_size: modelSizeResult,
            min_stock: minStockResult,
            stock: stockResult,
            price: priceResult,
            expiration_date: expirationDateResult,
        }).save();

        return _id as string;
    }

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 deleteProductVariant ══════════╗
    ║ 📥 Entrada: GetProductVariantByIdPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina variante        ║
    ║ 📤 Salida: void                                 ║
    ║ 🛠️ Errores: variante no encontrada              ║
    ╚═══════════════════════════════════════════════╝*/
    static async deleteProductVariant (data: GetProductVariantByIdPayload) : Promise<void> {
        const { _id } = data;
        const _idResult: string = Validation.stringValidation(_id, 'id');
        const ProductVariantObject: ProductVariantModelType = ProductVariantSchema.findOne({ _id: _idResult });
        if (!ProductVariantObject) throw new Error('Does not exist a productVariant with this id');
        ProductVariantObject.remove();
    }

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*══════════ 🎮 editProductVariant ══════════╗
║ 📥 Entrada: EditProductVariantPayload {_id,name,description,created_at,updated_at,image_url,gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,stock,price,expiration_date} ║
║ ⚙️ Proceso: valida campos y actualiza variante                                                                                                   ║
║ 📤 Salida: void                                                                                                                                   ║
║ 🛠️ Errores: variante no encontrada, validaciones fallidas                                                                                        ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

static async editProductVariant (data: EditProductVariantPayload): Promise <void> {
    const { 
        _id,
        name, description, created_at, updated_at, image_url,
        gallery_urls, brand, product_id, sku, model_type, model_size,
        min_stock, stock, price, expiration_date 
     } = data;

        const _idResult : string = Validation.stringValidation(_id, 'id');
        const nameResult : string = Validation.stringValidation(name,'name');
        const descriptionResult : string = Validation.stringValidation(description,'description');
        const createdAtResult : string = Validation.date(created_at,'created_at');
        const updatedAtResult : string = Validation.date(updated_at,'updated_at');
        const imageUrlResult : string = Validation.image(image_url);
        const galleryUrlsResult : string[] = Validation.imageArray(gallery_urls);
        const brandResult : string = Validation.stringValidation(brand,'brand');
        const productIdResult : string = Validation.stringValidation(product_id,'product_id');
        const skuResult : string = Validation.stringValidation(sku,'sku');
        const modelTypeResult : string = Validation.stringValidation(model_type,'model_type');
        const modelSizeResult : string = Validation.stringValidation(model_size,'model_size', 2);
        const minStockResult : number = Validation.number(min_stock,'min_stock');
        const stockResult : number = Validation.number(stock,'stock');
        const priceResult : number = Validation.number(price,'price');
        const expirationDateResult : string = Validation.date(expiration_date,'expiration_date');

        const productVariantObject: ProductVariantModelType = ProductVariantSchema.findOne({ _id: _idResult});

        if (!productVariantObject) throw new Error('Does not exist a productVariant with this id');
     
        productVariantObject.name = nameResult;
        productVariantObject.description = descriptionResult;
        productVariantObject.created_at = createdAtResult;
        productVariantObject.updated_at = updatedAtResult;
        productVariantObject.image_url = imageUrlResult;
        productVariantObject.gallery_urls = galleryUrlsResult;
        productVariantObject.brand = brandResult;
        productVariantObject.product_id = productIdResult;
        productVariantObject.sku = skuResult;
        productVariantObject.model_type = modelTypeResult;
        productVariantObject.model_size = modelSizeResult;
        productVariantObject.min_stock = minStockResult;
        productVariantObject.stock = stockResult;
        productVariantObject.price = priceResult;
        productVariantObject.expiration_date = expirationDateResult;
     
        productVariantObject.save();
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

}