import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";
import { CreateProductRequest, DeleteProductRequest, EditProductRequest, GetProductByBrandRequest, GetProductByIdRequest, GetProductByNameRequest } from "../typings/product/productTypes";
import { handleControllerError } from "../utils/handleControllerError";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// TO DO se cambio el product, modificar los endpoints y controllers
export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .send(`
      Estas en product<br>
      Endpoints =><br>
      ----Get:  /get-products<br>
      ----Get:  /get-product-by-id<br>
      ----Get:  /get-product-by-name<br>
      ----Get:  /get-product-by-brand<br>
      ----Post: /create-product<br>
      ----Delete: /delete-product<br>
      ----Put: /edit-product<br>
  `);
}
// 🆗
export async function getProducts( _req: Request,res: Response): Promise <void> {

  try {
    const products = await ProductModel.getProducts();
    res
        .status(200)
        .json(products);
  } catch (error: unknown) {
        handleControllerError(res, error);
  }
}
// 🆗
export async function getProductById (req: GetProductByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        const ProductVariantObject = await ProductModel.getProductByField('_id',_id,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getProductByName (req: GetProductByNameRequest, res: Response): Promise<void> {
    const { name } = req.body;

    try {
        const ProductVariantObject = await ProductModel.getProductByField('name',name,'string');
        res
            .status(200)
            .json(ProductVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getProductByBrand (req: GetProductByBrandRequest, res: Response): Promise<void> {
    const { brand } = req.body;

    try {
        const ProductVariantObject = await ProductModel.getProductByField('brand',brand,'string');
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
export async function createProduct(req: CreateProductRequest, res: Response): Promise <void> {
    const {
        name, description, created_at, updated_at,
        image_url, gallery_urls, brand, variants,
    } = req.body;

    try{
        const _id = await ProductModel.create({
            name, description, created_at, updated_at, image_url, gallery_urls, 
            brand, variants
        });
        res
            .status(200)
            .json({
                _id,
                message: 'Product created successfully',
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function deleteProduct (req: DeleteProductRequest, res: Response): Promise <void> {
    const { _id } = req.body;

    try{
        await ProductModel.delete({ _id });
        res
            .status(200)
            .json({
                _id,
                message: 'Product has been deleted successfully',
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function editProduct (req: EditProductRequest, res: Response) : Promise<void> {
    const { 
        _id,name,description,created_at,
        updated_at,image_url,gallery_urls,
        brand,variants 
    } = req.body;
                        
    try {
        await ProductModel.edit({_id,name,description,created_at,
            updated_at,image_url,gallery_urls, brand,variants});
        res
            .status(200)
            .json({
                _id,
                message: 'Product has been edited successfully',
            });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
