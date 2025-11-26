import { Request, Response } from "express";
import { ProductVariantCreateRequest, ProductVariantEditRequest, ProductVariantGetByIdRequest, ProductVariantGetByProductIdRequest } from "../typings/product-variant/productVariantTypes";
import { ProductVariantModel } from "../models/productVariantModel";


/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response) {
    res.send(`
    Estas en productVariant<br>
    Endpoints =><br>
    ----Get: /get-product-variant-by-id<br>
    ----Get: /get-product-variant-by-product-id<br>
    ----Get: /get-product-variants<br>
    ----Post: /create-product-varaint<br>
    ----Delete: /delete-product-variant
    `);
}

export async function getAllProductVariants (_req: Request, res: Response ) {

    try{
        const productVariants = await ProductVariantModel.getAllProductVariants();
        res
            .status(200)
            .json(productVariants);
    } 
    catch(error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(400)
                .send('An unexpected error ocurred, try again');
            return;
        }
        res 
            .status(400)
            .send(error.message);
    }
}

export async function getProductVariantById (req: ProductVariantGetByIdRequest, res: Response) {
    const { _id } = req.body;
    try {
        const ProductVariant = await ProductVariantModel.getProductVariantById({_id});
        res
            .status(200)
            .send(ProductVariant);
    } catch (error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(400)
                .send('An unexpected error ocurred, try again');
            return;
        }
        res 
            .status(400)
            .send(error.message);
    }
}

export async function getProductVariantByProductId (req: ProductVariantGetByProductIdRequest, res: Response) {
    const { product_id } = req.body;
    try {
        const ProductVariant = await ProductVariantModel.getgetProductVariantByProductId({product_id});
        res
            .status(200)
            .send(ProductVariant);
    } catch (error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(400)
                .send('An unexpected error ocurred, try again');
            return;
        }
        res 
            .status(400)
            .send(error.message);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function createProductVariant(req: ProductVariantCreateRequest, res:Response) {
    const { 
        name,description,created_at,updated_at,image_url,
        gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,
        stock,price,expiration_date 
    } = req.body;

    try{
        const _id = await ProductVariantModel.createProductVariant({
            name,description,created_at,updated_at,image_url,
            gallery_urls,brand,product_id,sku,model_type,model_size,min_stock,
            stock,price,expiration_date
        });
        res
            .status(200)
            .send({_id});
    } catch (error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(400)
                .send('An unexpected error ocurred, try again');
            return;
        }
        res 
            .status(400)
            .send(error.message);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function deleteProductVariant(req: ProductVariantGetByIdRequest, res: Response) {
    const { _id } = req.body;

    try{
        await ProductVariantModel.deleteProductVariant({ _id });
        res
            .status(200)
            .send('Product variant Successfully deleted');
    } catch(error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(400)
                .send('An unexpected error ocurred, try again');
            return;
        }
        res 
            .status(400)
            .send(error.message);
    }

}


/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function editProductVariant(req: ProductVariantEditRequest, res: Response) {
    const { 
        _id ,name, description, created_at, updated_at, image_url,
        gallery_urls, brand, product_id, sku, model_type, model_size,
        min_stock, stock, price, expiration_date
     } = req.body;

    try{
        const response = await ProductVariantModel.editProductVariant({ 
            _id, name, description, created_at, updated_at, image_url,
            gallery_urls, brand, product_id, sku, model_type, model_size,
            min_stock, stock, price, expiration_date 
        });
        res
            .status(200)
            .send(response);
    } catch(error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(400)
                .send('An unexpected error ocurred, try again');
            return;
        }
        res 
            .status(400)
            .send(error.message);
    }
}