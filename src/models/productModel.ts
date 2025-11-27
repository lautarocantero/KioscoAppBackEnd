import { ProductSchema } from "../schemas/productSchema";
import { ProductVariant } from "../typings/product-variant/productVariantTypes";
import { Product, ProductUnknown } from "../typings/product/productTypes";
import { Validation } from "./validation";

export class ProductModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async getProducts(): Promise<Product[]> {
      // Implementación interna de limitación
      let count = 0;
      const results: Product[] = [];
      
      // find acepta un predicado, lo uso para cortar en 100
      ProductSchema.find((item: Product) => {
        if (count < 100) {
          results.push(item);
          count++;
          return true;
        }
        return false; // después de 100 ya no agrega más
      });

    return results as Product[];
  }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: ProductUnknown): Promise <string> {

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
        });

        return _id as string;
    }
}