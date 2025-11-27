import { Request } from 'express';

/*══════════════════════════════════════════════════════════════════════╗
║ 🧱 BASES 🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface ProductVariant {
    _id: string,
    name: string,
    description: string,
    created_at: string,
    updated_at: string,
    image_url: string,
    gallery_urls: string,
    brand: string,
    product_id: string,
    sku: string,
    model_type: string,
    model_size: string,
    min_stock: number,
    stock: number,
    price: number,
    expiration_date: string,
}

export type ProductVariantCreate = Omit<ProductVariant, '_id'>

export type ProductVariantGetById = Pick<ProductVariant, '_id'>

export type ProductVariantGetByProductId = Pick<ProductVariant, 'product_id'>

export type ProductVariantEdit = ProductVariant;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantCreateRequest = Request<ProductVariantParams, unknown, ProductVariantCreate>;

export type ProductVariantGetByIdRequest = Request<ProductVariantParams, unknown, ProductVariantGetById>;

export type ProductVariantGetByProductIdRequest = Request<ProductVariantParams, unknown, ProductVariantGetByProductId>; 

export type ProductVariantEditRequest = Request<ProductVariantParams, unknown, ProductVariantEdit>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantSchemaType = ProductVariant;





