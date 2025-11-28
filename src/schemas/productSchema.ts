import DBLocal from "db-local";
import { ProductSchemaType } from "../typings/product/productTypes";

const { Schema } = new DBLocal({ path: './db'});

export const ProductSchema = Schema <ProductSchemaType> ('Product', {
    _id: { type: String, required: true},
    name: { type: String, required: true},
    description: { type: String, required: true}, 
    created_at: { type: String, required: true}, 
    updated_at: { type: String, required: true},
    image_url: { type: String, required: true}, 
    gallery_urls: { type: Array, required: true}, 
    brand: { type: String, required: true}, 
    variants: { type: Array, required: true}, 
});