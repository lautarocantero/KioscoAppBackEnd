import DBLocal from "db-local";
import Validation from "./validation";
import { DocumentProduct, ProductInput } from "../typings/product/productTypes";

const { Schema } = new DBLocal({ path: './db'});

const Product = Schema <DocumentProduct> ('Product', {
    _id: { type: String, required: true},
    name: { type: String, required: true},
    description: { type: String, required: true}, 
    sku: { type: String, required: true}, 
    price: { type: Number, required: true}, 
    category_id: { type: String, required: true}, 
    product_status: { type: String, required: true}, 
    created_at: { type: String, required: true}, 
    update_at: { type: String, required: true},
    stock: { type: Number, required: true}, 
    min_stock: { type: Number, required: true}, 
    image_url: { type: String, required: true}, 
    gallery_urls: { type: String, required: true}, 
    size: { type: String, required: true}, 
    brand: { type: String, required: true}, 
    barcode: { type: String, required: true}, 
    expiration_date: { type: String, required: true}
});

export class ProductModel {

    static async create (data: ProductInput) {

        const {
            name, description, sku, price, category_id, 
            product_status, created_at, update_at,stock, 
            min_stock, image_url, gallery_urls, size, brand, 
            barcode, expiration_date
        } = data;

        Validation.stringValidation(name, 'name');
        Validation.stringValidation(description, 'description');
        Validation.sku(sku);
        Validation.number(price, 'price');
        Validation.stringValidation(category_id, 'category_id');
        Validation.stringValidation(product_status, 'product_status');
        Validation.date(created_at, 'created_at');
        Validation.date(update_at, 'update_at');
        Validation.number(stock, 'stock');
        Validation.number(min_stock, 'min_stock');
        Validation.image(image_url);
        Validation.image(gallery_urls);
        Validation.stringValidation(size, 'size', 2);
        Validation.stringValidation(brand, 'brand');
        Validation.barcode(barcode);
        Validation.date(expiration_date, 'expiration_date');

        const product = Product.findOne((prod) => prod.name === name);
        if(product) throw new Error('product already exists');

        const _id = crypto.randomUUID();

        Product.create({
            _id: _id as string,
            name: name as string,
            description: description as string,
            sku: sku as string,
            price: price as number,
            category_id: category_id as string,
            product_status: product_status as string,
            created_at: created_at as string,
            update_at: update_at as string,
            stock: stock as number,
            min_stock: min_stock as number,
            image_url: image_url as string,
            gallery_urls: gallery_urls as string,
            size: size as string,
            brand: brand as string,
            barcode: barcode as string,
            expiration_date: expiration_date as string,
        });

        return _id as string;

    }

    static async getProducts() {
      // Implementación interna de limitación
      let count = 0;
      const results: DocumentProduct[] = [];
      
      // find acepta un predicado, lo uso para cortar en 100
      Product.find((item: DocumentProduct) => {
        if (count < 100) {
          results.push(item);
          count++;
          return true;
        }
        return false; // después de 100 ya no agrega más
      });

    return results;
  }

}