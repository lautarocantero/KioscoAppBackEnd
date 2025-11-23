import { Request, Response } from "express";
import { ProductVariantCreateRequest, ProductVariantGetRequest } from "../typings/product-variant/productVariantTypes";
import { ProductVariantModel } from "../models/productVariantModel";

export async function home(_req: Request, res: Response) {
    res.send(`
        Estas en productVariant
        Endpoints => 
            Post: /create-product-varaint
        `);
}

export async function createProductVariant(req: ProductVariantCreateRequest, res:Response) {
    const { 
        name,description,created_at,updated_at,image_url,
        gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,
        stock,price,expiration_date } = req.body;
    try{
        const _id = await ProductVariantModel.create({
            name,description,created_at,updated_at,image_url,
            gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,
            stock,price,expiration_date
        });
        res
            .status(200)
            .send({_id});
    } catch (error: unknown) {
        if(error instanceof Error) {
            res
                .status(400)
                .send(error.message);
            return;
        }
    }
}

export async function getProductVariant (req: ProductVariantGetRequest, res: Response) {
    const { _id } = req.body;
    try {
        const ProductVariant = await ProductVariantModel.getById({_id});
        res
            .send(200)
            .send(ProductVariant);
    } catch (error: unknown) {
        if(error instanceof Error)
            res
                .status(400)
                .send(error.message);
            return;
    }
}