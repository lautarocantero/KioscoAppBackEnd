import DBLocal from "db-local";
import { DocumentProduct } from "../typings/product/productTypes";

const { Schema } = new DBLocal({ path: './db'});

export const Product = Schema <DocumentProduct> ('Product', {
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