// controllers/productVariant.controller.ts

import { Request, Response } from 'express';
import { ProductVariantSchema } from '../models/productVariantModel';
import {
    CreateProductVariantRequest,
    DeleteProductVariantRequest,
    EditProductVariantRequest,
    GetProductVariantByIdRequest,
    GetProductVariantByNetContentRequest,
    GetProductVariantByPriceRequest,
    GetProductVariantByProductIdRequest,
    GetProductVariantByStatusRequest,
    GetProductVariantByStockRequest,
    ProductVariant,
} from '@typings/productVariant';
import { handleControllerError } from '../utils/handleControllerError';

//──────────────────────────────────────── GET ────────────────────────────────//

export async function home(_req: Request, res: Response): Promise<void> {
    res.status(200).send(`
        Estás en product-variant<br>
        Endpoints =><br>
        ---- GET    /get-product-variants<br>
        ---- GET    /get-product-variant-by-id/:product_variant_id<br>
        ---- GET    /get-product-variant-by-product-id/:product_id<br>
        ---- GET    /get-product-variant-by-stock<br>
        ---- GET    /get-product-variant-by-price<br>
        ---- GET    /get-product-variant-by-status<br>
        ---- GET    /get-product-variant-by-net-content<br>
        ---- POST   /create-product-variant<br>
        ---- PUT    /edit-product-variant/:variant_id<br>
        ---- DELETE /delete-product-variant<br>
    `);
}

export async function getProductVariants(_req: Request, res: Response): Promise<void> {
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find();
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProductVariantById(
    req: GetProductVariantByIdRequest,
    res: Response,
): Promise<void> {
    const { product_variant_id } = req.params;
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find({ _id: product_variant_id });
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProductVariantByProductId(
    req: GetProductVariantByProductIdRequest,
    res: Response,
): Promise<void> {
    const { product_id } = req.params;
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find({ product_id });
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProductVariantByStock(
    req: GetProductVariantByStockRequest,
    res: Response,
): Promise<void> {
    const { stock_current } = req.body;
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find({ stock_current });
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProductVariantByPrice(
    req: GetProductVariantByPriceRequest,
    res: Response,
): Promise<void> {
    const { price } = req.body;
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find({ price });
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProductVariantByStatus(
    req: GetProductVariantByStatusRequest,
    res: Response,
): Promise<void> {
    const { status } = req.body;
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find({ status });
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProductVariantByNetContent(
    req: GetProductVariantByNetContentRequest,
    res: Response,
): Promise<void> {
    const { net_content } = req.body;
    try {
        const variants: ProductVariant[] = await ProductVariantSchema.find({ net_content });
        res.status(200).json(variants);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── POST ───────────────────────────────//

export async function createProductVariant(
    req: CreateProductVariantRequest,
    res: Response,
): Promise<void> {
    const {
        product_id, sku, barcode,
        name, description, net_content,
        price, purchase_price,
        stock_current, stock_available, reorder_point,
        expiration_date,
        supplier_ids,
    } = req.body;

    const parsedPrice          = Number(price);
    const parsedPurchasePrice  = Number(purchase_price);
    const parsedStockCurrent   = Number(stock_current);
    const parsedStockAvailable = Number(stock_available);
    const parsedReorderPoint   = Number(reorder_point);

    const parsedSupplierIds: string[] =
        typeof supplier_ids === 'string'
            ? JSON.parse(supplier_ids)
            : (supplier_ids as string[]) ?? [];

    try {
        const _id = await ProductVariantSchema.create({
            product_id, sku, barcode,
            name, description, net_content,
            price:           parsedPrice,
            purchase_price:  parsedPurchasePrice,
            stock_current:   parsedStockCurrent,
            stock_available: parsedStockAvailable,
            reorder_point:   parsedReorderPoint,
            expiration_date: expiration_date as string ?? '',
            supplier_ids:    parsedSupplierIds,
        });

        res.status(200).json({ _id, message: 'Product variant created successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── PUT ────────────────────────────────//

export async function editProductVariant(
    req: EditProductVariantRequest,
    res: Response,
): Promise<void> {
    const { variant_id } = req.params;
    const {
        sku, price, expiration_date,
        stock, min_stock,
        model_type, model_size,
        image_url,
    } = req.body;

    console.log("🔧 editProductVariant — variant_id:", variant_id);
    console.log("🔧 body:", { sku, price, stock, min_stock, model_type, model_size });

    try {
        const result = await ProductVariantSchema.updateOne(
            { _id: variant_id },
            {
                $set: {
                    sku,
                    name:            `${model_type} ${model_size}`,
                    net_content:     model_size,
                    price:           Number(price),
                    stock_current:   Number(stock),
                    stock_available: Number(stock),
                    reorder_point:   Number(min_stock),
                    image_url:       image_url ?? "",
                    updated_at:      new Date().toISOString(),
                    expiration_date: expiration_date ?? '',
                },
            }
        );

        console.log("🔧 updateOne result:", result);

        if (result.matchedCount === 0) {
            res.status(404).json({ message: `Variante ${variant_id} no encontrada` });
            return;
        }

        res.status(200).json({ _id: variant_id, message: 'Product variant edited successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── DELETE ─────────────────────────────//

export async function deleteProductVariant(
    req: DeleteProductVariantRequest,
    res: Response,
): Promise<void> {
    const { _id } = req.body;
    try {
        await ProductVariantSchema.deleteOne({ _id });
        res.status(200).json({ message: 'Product variant deleted successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}