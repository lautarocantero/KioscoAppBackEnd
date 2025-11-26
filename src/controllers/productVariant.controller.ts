import { Request, Response } from "express";
import { ProductVariantCreateRequest, ProductVariantEditRequest, ProductVariantGetByIdRequest, ProductVariantGetByProductIdRequest } from "../typings/product-variant/productVariantTypes";
import { ProductVariantModel } from "../models/productVariantModel";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .json({message:`
      Estas en product variant<br>
      Endpoints =><br>
      ----Get:      /get-product-variants<br>
      ----Get:      /get-product-variant-by-id<br>
      ----Get:      /get-product-variant-by-product-id<br>
      ----Post:     /create-product-variant<br>
      ----Delete:   /delete-product-variant<br>
      ----Put:      /edit-product-variant<br>
  `});
}

// 🆗
export async function getProductVariants (_req: Request, res: Response ): Promise<void>  {

    try{
        const productVariantsObject = await ProductVariantModel.getAllProductVariants();
        res
            .status(200)
            .json(productVariantsObject);
    } 
    catch(error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }
}

// 🆗
export async function getProductVariantById (req: ProductVariantGetByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        const ProductVariantObject = await ProductVariantModel.getProductVariantById({_id});
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }
}

// 🆗
export async function getProductVariantByProductId (req: ProductVariantGetByProductIdRequest, res: Response): Promise<void>  {
    const { product_id } = req.body;

    try {
        const ProductVariantObject = await ProductVariantModel.getgetProductVariantByProductId({product_id});
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function createProductVariant(req: ProductVariantCreateRequest, res:Response): Promise<void>  {
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
            .json({
                _id,
                message: "Product variant created successfully",
            });
    } catch (error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function deleteProductVariant(req: ProductVariantGetByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try{
        await ProductVariantModel.deleteProductVariant({ _id });
        res
            .status(200)
            .json({ message: 'Product variant Successfully deleted'});
    } catch(error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }

}


/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function editProductVariant(req: ProductVariantEditRequest, res: Response): Promise<void>  {
    const { 
        _id ,name, description, created_at, updated_at, image_url,
        gallery_urls, brand, product_id, sku, model_type, model_size,
        min_stock, stock, price, expiration_date
     } = req.body;

    try{
        await ProductVariantModel.editProductVariant({ 
            _id, name, description, created_at, updated_at, image_url,
            gallery_urls, brand, product_id, sku, model_type, model_size,
            min_stock, stock, price, expiration_date 
        });
        res
            .status(200)
            .json({
                _id,
                message: "Product variant edited successfully",
            });
    } catch(error: unknown) {
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }
}