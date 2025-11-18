import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";


// luego modificarlo para diferentes contextos
export async function getProducts( _req: Request,res: Response) {
  try {
    const products = await ProductModel.getProducts();
    res.status(200).json(products);
  } catch (err) {
        if (err instanceof Error) {
            res
                .status(400)
                .send(err.message);
            return;
        }
  }
}

export async function createProduct(req: Request, res: Response): Promise <void> {
    const {
        name, description, sku, price, category_id, product_status, created_at, update_at,
        stock, min_stock, image_url, gallery_urls, size, brand, barcode, expiration_date } = req.body;

    try{
        const _id = await ProductModel.create({
            name, description, sku, price, category_id, product_status, created_at, update_at,
            stock, min_stock, image_url, gallery_urls, size, brand, barcode, expiration_date  });
        res.send({_id});
    } catch(err) {
        if (err instanceof Error) {
            res
                .status(400)
                .send(err.message);
            return;
        }
    }
}

