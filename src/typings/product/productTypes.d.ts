//   ____                      
//  |  _ \                     
//  | |_) | __ _ ___  ___  ___ 
//  |  _ < / _` / __|/ _ \/ __|
//  | |_) | (_| \__ \  __/\__ \
//  |____/ \__,_|___/\___||___/


export interface ProductInput {
    name: unknown;
    description: unknown;
    sku: unknown;
    price: unknown;
    category_id: unknown;
    product_status: unknown;
    created_at: unknown;
    update_at: unknown;
    stock: unknown;
    min_stock: unknown;
    image_url: unknown;
    gallery_urls: unknown;
    size: unknown;
    brand: unknown;
    barcode: unknown;
    expiration_date: unknown;
}

export interface DocumentProduct {
    _id: string,
    name: string;
    description: string;
    sku: string;
    price: number;
    category_id: string;
    product_status: string;
    created_at: string;
    update_at: string;
    stock: number;
    min_stock: number;
    image_url: string;
    gallery_urls: string;
    size: string;
    brand: string;
    barcode: string;
    expiration_date: string;
}