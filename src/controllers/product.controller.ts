import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";
import { CreateProductRequest } from "../typings/product/productTypes";

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
      ----Post: /create-product<br>
  `);
}

export async function getProducts( _req: Request,res: Response): Promise <void> {

  try {
    const products = await ProductModel.getProducts();
    res
        .status(200)
        .json(products);
  } catch (error: unknown) {
        if (!(error instanceof Error)) {
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
        if (!(error instanceof Error)) {
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

