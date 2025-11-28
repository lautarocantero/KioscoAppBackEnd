import { Request, Response } from "express";
import { ProductVariantModel } from "../models/productVariantModel";
import { CreateProductVariantRequest, DeleteProductVariantRequest, EditProductVariantRequest, GetProductVariantByBrandRequest, GetProductVariantByIdRequest, GetProductVariantByPresentationRequest, GetProductVariantByPriceRequest, GetProductVariantByProductIdRequest, GetProductVariantBySizeRequest, GetProductVariantByStockRequest } from "../typings/product-variant/productVariantTypes";
import { handleControllerError } from "../utils/handleControllerError";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .send(`
      Estas en product variant<br>
      Endpoints =><br>
      ----Get:      /get-product-variants<br>
      ----Get:      /get-product-variant-by-id<br>
      ----Get:      /get-product-variant-by-product-id<br>
      ----Get:      /get-product-variant-by-brand<br>
      ----Get:      /get-product-variant-by-stock<br>
      ----Get:      /get-product-variant-by-price<br>
      ----Get:      /get-product-variant-by-size<br>
      ----Get:      /get-product-variant-by-presentation<br>
      ----Post:     /create-product-variant<br>
      ----Delete:   /delete-product-variant<br>
      ----Put:      /edit-product-variant<br>
  `);
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
        handleControllerError(res, error);
    }
}

// 🆗
export async function getProductVariantById (req: GetProductVariantByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('_id',_id,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

// 🆗
export async function getProductVariantByProductId (req: GetProductVariantByProductIdRequest, res: Response): Promise<void>  {
    const { product_id } = req.body;

    try {
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('product_id',product_id,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

// 🆗
export async function getProductVariantByBrand(req: GetProductVariantByBrandRequest, res: Response): Promise <void> {
    const { brand } = req.body;

    try{
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('brand',brand,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getProductVariantByStock(req: GetProductVariantByStockRequest, res: Response): Promise <void> {
    const { stock } = req.body;

    try{
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('stock',stock,'number');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getProductVariantByPrice(req: GetProductVariantByPriceRequest, res: Response): Promise <void> {
    const { price } = req.body;

    try{
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('price',price,'number');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getProductVariantBySize(req: GetProductVariantBySizeRequest, res: Response): Promise <void> {
    const { model_size } = req.body;

    try{
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('model_size',model_size,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getProductVariantByPresentation(req: GetProductVariantByPresentationRequest, res: Response): Promise <void> {
    const { model_type } = req.body;

    try{
        const ProductVariantObject = await ProductVariantModel.getProductVariantByField('model_type',model_type,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function createProductVariant(req: CreateProductVariantRequest, res:Response): Promise<void>  {
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
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function deleteProductVariant(req: DeleteProductVariantRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try{
        await ProductVariantModel.deleteProductVariant({ _id });
        res
            .status(200)
            .json({ message: 'Product variant Successfully deleted'});
    } catch(error: unknown) {
        handleControllerError(res, error);
    }

}


/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function editProductVariant(req: EditProductVariantRequest, res: Response): Promise<void>  {
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
        handleControllerError(res, error);
    }
}