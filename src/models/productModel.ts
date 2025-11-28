import { ProductSchema } from "../schemas/productSchema";
import { ProductVariant } from "../typings/product-variant/productVariantTypes";
import { CreateProductPayload, DeleteProductPayload, EditProductPayload, Product, ProductModelType } from "../typings/product/productTypes";
import { Validation } from "./validation";

export class ProductModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async getProducts(): Promise<Product[]> {

      let count = 0;
      const results: Product[] = [];
      
      ProductSchema.find((item: Product) => {
        if (count < 100) {
          results.push(item);
          count++;
          return true;
        }
        return false;
      });

    return results as Product[];
  }

    static async getProductByField<T extends keyof Product>(
        field: T,
        value: Product[T],
        type: 'string' | 'number',
    ): Promise<Product[]> {

        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        
        if (type === 'string') Validation.stringValidation(value, field as string);
    
        if (type === 'number') Validation.number(value, field as string);
    

        const results: Product[] = [];
        ProductSchema.find((item: Product) => {
            if (item?.[field] === value) {
                results.push(item);
                return true;
            }
            return false;
        });

        return results;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: CreateProductPayload): Promise <string> {

        const {
          name, description, created_at, updated_at,
          image_url, gallery_urls, brand, variants
        } = data;

        const nameResult: string = Validation.stringValidation(name, 'name');
        const descriptionResult: string = Validation.stringValidation(description, 'description');
        const createdAtResult: string = Validation.date(created_at, 'created_at');
        const updatedAtResult: string = Validation.date(updated_at, 'updated_at');
        const imageUrlResult: string = Validation.image(image_url);
        const galleryUrlsResult: string[] = Validation.imageArray(gallery_urls);
        const brandResult: string = Validation.stringValidation(brand, 'brand');
        const variantsResult: ProductVariant[] = Validation.isVariantArray(variants);

        const product: Product = ProductSchema.findOne((prod: Product) => prod.name === nameResult);

        if(product) throw new Error('product already exists');

        const _id = crypto.randomUUID();

        ProductSchema.create({
            _id: _id,
            name: nameResult,
            description: descriptionResult,
            created_at: createdAtResult,
            updated_at: updatedAtResult,
            image_url: imageUrlResult,
            gallery_urls: galleryUrlsResult,
            brand: brandResult,
            variants: variantsResult,
        }).save();

        return _id as string;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

      static async delete ( data: DeleteProductPayload ) : Promise<void> {

        const { _id } = data;

        const _idResult = Validation.stringValidation(_id, '_id');

        const ProductObject: ProductModelType = ProductSchema.findOne({ _id: _idResult });

        if(!ProductObject) throw new Error('There is not any product with that id');

        ProductObject.remove();
      }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

      static async edit ( data: EditProductPayload ) : Promise<void> {
        const { 
          _id,name,description,created_at,
          updated_at,image_url,gallery_urls,
          brand,variants 
         } = data;

        const _idResult = Validation.stringValidation(_id,'_id');
        const nameResult = Validation.stringValidation(name,'name');
        const descriptionResult = Validation.stringValidation(description,'description');
        const createdAtResult = Validation.date(created_at,'createdAt');
        const updatedAtResult = Validation.date(updated_at,'updatedAt');
        const imageUrlResult = Validation.image(image_url);
        const galleryUrlsResult = Validation.imageArray(gallery_urls);
        const brandResult = Validation.stringValidation(brand,'brand');
        const variantsResult = Validation.isVariantArray(variants);

        const ProductObject: ProductModelType = ProductSchema.findOne({ _id: _idResult });

        if(!ProductObject) throw new Error('There is not any product with that id');

         ProductObject.name = nameResult;
         ProductObject.description = descriptionResult;
         ProductObject.created_at = createdAtResult;
         ProductObject.updated_at = updatedAtResult;
         ProductObject.image_url = imageUrlResult;
         ProductObject.gallery_urls = galleryUrlsResult;
         ProductObject.brand = brandResult;
         ProductObject.variants = variantsResult;

         ProductObject.save();
      }
}









