import { Request } from 'express';

//   ____                      
//  |  _ \                     
//  | |_) | __ _ ___  ___  ___ 
//  |  _ < / _` / __|/ _ \/ __|
//  | |_) | (_| \__ \  __/\__ \
//  |____/ \__,_|___/\___||___/

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

export type ProductVariantGet = Pick<ProductVariant, '_id'>

export type ProductVariantCreate = Omit<ProductVariant, '_id'>


/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantCreateRequest = Request<ProductVariantParams, unknown, ProductVariantCreate>;

export type ProductVariantGetRequest = Request<ProductVariantParams, unknown, ProductVariantGet>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantSchema = ProductVariant;





