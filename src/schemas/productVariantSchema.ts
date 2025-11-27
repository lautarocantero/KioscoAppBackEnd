import DBLocal from "db-local";
import { ProductVariantSchemaType } from "../typings/product-variant/productVariantTypes";

const { Schema } = new DBLocal({ path: './db'});

export const ProductVariantObjectSchema = Schema <ProductVariantSchemaType> ('ProductVariant', {
    _id: {type: String, required: true},
    name: {type: String, required: true},
    description: {type: String, required: true},
    created_at: {type: String, required: true},
    updated_at: {type: String, required: true},
    image_url: {type: String, required: true},
    gallery_urls: {type: Array, required: true},
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