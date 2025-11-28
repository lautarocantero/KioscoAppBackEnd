
import { ProductVariantSchema } from '../schemas/productVariantSchema';
import { CreateProductVariantPayload, EditProductVariantPayload, GetProductVariantByIdPayload, ProductVariant, ProductVariantModelType } from '../typings/product-variant/productVariantTypes';
import { Validation } from './validation';

export class ProductVariantModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async deleteProductVariant (data: GetProductVariantByIdPayload) : Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, 'id');

        const ProductVariantObject: ProductVariantModelType = ProductVariantSchema.findOne({ _id: _idResult });

        if (!ProductVariantObject) throw new Error('Does not exist a productVariant with this id');

        ProductVariantObject.remove();
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

}