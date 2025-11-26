import DBLocal from "db-local";
import { ProductVariant, ProductVariantCreate, ProductVariantEdit, ProductVariantGetById, ProductVariantGetByProductId, ProductVariantSchemaType } from '../typings/product-variant/productVariantTypes';
import Validation from "./validation";

const { Schema } = new DBLocal({ path: './db'});

// TO DO seria buena idea mover esto a ../schema/ProductVariantObjectSchema

const ProductVariantObjectSchema = Schema <ProductVariantSchemaType> ('ProductVariant', {
    _id: {type: String, required: true},
    name: {type: String, required: true},
    description: {type: String, required: true},
    created_at: {type: String, required: true},
    updated_at: {type: String, required: true},
    image_url: {type: String, required: true},
    gallery_urls: {type: [String], required: true},
    brand: {type: String, required: true},
    product_id: {type: String, required: true},
    sku: {type: String, required: true},
    model_type: {type: String, required: true},
    model_size: {type: String, required: true},
    min_stock: {type: Number, required: true},
    stock: {type: Number, required: true},
    price: {type: Number, required: true},
    expiration_date: {type: String, required: true},
});

export class ProductVariantModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async getAllProductVariants() {
        let count = 0;
        const results: ProductVariant[] = [];

        ProductVariantObjectSchema.find((item: ProductVariant) => {
            if(count < 100) {
                results.push(item);
                count++;
                return true;
            }
            return false;
        });

        return results;
    }

    static async getProductVariantById (data: ProductVariantGetById) {
        const { _id } = data;

        Validation.stringValidation(_id, 'id');

        const ProductVariantObject = ProductVariantObjectSchema?.findOne((prodvar: ProductVariant) => prodvar?._id === _id );

        if(!ProductVariantObject) throw new Error('Does not exist a productVariant with this id');

        return ProductVariantObject;
    }

    static async getgetProductVariantByProductId (data: ProductVariantGetByProductId) {
        const { product_id } = data;

        Validation.stringValidation(product_id, 'product_id');

        const results: ProductVariant[] = [];

        ProductVariantObjectSchema.find((item: ProductVariant) => {
            if(item?.product_id === product_id ) {
                results?.push(item);
                return true;
            }
            return false;
        });

        return results;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async createProductVariant (data: ProductVariantCreate) {
        const {
            name,description,created_at,updated_at,image_url,
            gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,
            stock,price,expiration_date
        } = data;

        Validation.stringValidation(name,'name');
        Validation.stringValidation(description,'description');
        Validation.date(created_at,'created_at');
        Validation.date(updated_at,'updated_at');
        Validation.image(image_url);
        Validation.imageArray(gallery_urls);
        Validation.stringValidation(brand,'brand');
        Validation.stringValidation(product_id,'product_id');
        Validation.stringValidation(sku,'sku');
        Validation.stringValidation(model_type,'model_type');
        Validation.stringValidation(model_size,'model_size', 2);
        Validation.number(min_stock,'min_stock');
        Validation.number(stock,'stock');
        Validation.number(price,'price');
        Validation.date(expiration_date,'expiration_date');

        const productVariant = ProductVariantObjectSchema.findOne((prodvar: ProductVariant ) => prodvar.name === name);

        if (productVariant) throw new Error ('Product Variant already exists');

        const _id = crypto.randomUUID();

        ProductVariantObjectSchema.create({
            _id: _id as string,
            name: name as string,
            description: description as string,
            created_at: created_at as string,
            updated_at: new Date().toISOString() as string,
            image_url: image_url as string,
            gallery_urls: gallery_urls as string,
            brand: brand as string,
            product_id: product_id as string,
            sku: sku as string,
            model_type: model_type as string,
            model_size: model_size as string,
            min_stock: min_stock as number,
            stock: stock as number,
            price: price as number,
            expiration_date: expiration_date as string,
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async deleteProductVariant (data: ProductVariantGetById) {
        const { _id } = data;

        Validation.stringValidation(_id, 'id');

        const ProductVariantObject = ProductVariantObjectSchema.findOne(
        (prodvar: ProductVariant) => prodvar._id === _id
        );

        if (!ProductVariantObject) {
            throw new Error('Does not exist a productVariant with this id');
        }

        ProductVariantObject.remove();

    }


/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async editProductVariant (data: ProductVariantEdit) {
        const { 
            _id,
            name, description, created_at, updated_at, image_url,
            gallery_urls, brand, product_id, sku, model_type, model_size,
            min_stock, stock, price, expiration_date 
         } = data;

        Validation.stringValidation(_id, 'id');
        Validation.stringValidation(name,'name');
        Validation.stringValidation(description,'description');
        Validation.date(created_at,'created_at');
        Validation.date(updated_at,'updated_at');
        Validation.image(image_url);
        Validation.imageArray(gallery_urls);
        Validation.stringValidation(brand,'brand');
        Validation.stringValidation(product_id,'product_id');
        Validation.stringValidation(sku,'sku');
        Validation.stringValidation(model_type,'model_type');
        Validation.stringValidation(model_size,'model_size', 2);
        Validation.number(min_stock,'min_stock');
        Validation.number(stock,'stock');
        Validation.number(price,'price');
        Validation.date(expiration_date,'expiration_date');

        

        const ProductVariantObject = ProductVariantObjectSchema.findOne(
            (prodvar: ProductVariant) => prodvar._id === _id
        );

        if (!ProductVariantObject) {
            throw new Error('Does not exist a productVariant with this id');
        }

        ProductVariantObject.name = name;
        ProductVariantObject.description = description;
        ProductVariantObject.created_at = created_at;
        ProductVariantObject.updated_at = updated_at;
        ProductVariantObject.image_url = image_url;
        ProductVariantObject.gallery_urls = gallery_urls;
        ProductVariantObject.brand = brand;
        ProductVariantObject.product_id = product_id;
        ProductVariantObject.sku = sku;
        ProductVariantObject.model_type = model_type;
        ProductVariantObject.model_size = model_size;
        ProductVariantObject.min_stock = min_stock;
        ProductVariantObject.stock = stock;
        ProductVariantObject.price = price;
        ProductVariantObject.expiration_date = expiration_date;
        
        ProductVariantObject.save();
        return _id as string;
    }

}