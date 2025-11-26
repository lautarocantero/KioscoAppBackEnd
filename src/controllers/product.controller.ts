import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";
import { createProductRequest } from "../typings/product/productTypes";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .json({message:`
      Estas en product<br>
      Endpoints =><br>
      ----Get:  /get-products<br>
      ----Post: /create-product<br>
  `});
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

export async function createProduct(req: createProductRequest, res: Response): Promise <void> {
    const {
        name, description, sku, price, category_id, 
        product_status, created_at, update_at,
        stock, min_stock, image_url, gallery_urls, 
        size, brand, barcode, expiration_date 
    } = req.body;

    try{
        const _id = await ProductModel.create({
            name, description, sku, price, category_id, product_status, created_at, update_at,
            stock, min_stock, image_url, gallery_urls, size, brand, barcode, expiration_date
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

