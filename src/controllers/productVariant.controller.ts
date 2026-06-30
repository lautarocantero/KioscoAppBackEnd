// controllers/productVariant.controller.ts

import { Request, Response } from 'express';
import { ProductVariantSchema } from '../models/productVariantModel';
import {
    CreateProductVariantRequest,
    DeleteProductVariantRequest,
    EditProductVariantRequest,
    GetProductVariantByIdRequest,
    GetProductVariantByModelSizeRequest,
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

export async function getProductVariantByModelSize(
    req: GetProductVariantByModelSizeRequest,
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

import { randomUUID } from 'crypto';

export async function createProductVariant(
    req: CreateProductVariantRequest,
    res: Response,
): Promise<void> {
    const {
        product_id, sku,
        name, description, brand,
        image_url, gallery_urls,
        model_type, model_size,
        min_stock, stock,
        price, expiration_date,
    } = req.body;

    const parsedPrice      = Number(price);
    const parsedMinStock   = Number(min_stock);
    const parsedStock      = Number(stock);

    const parsedGalleryUrls: string[] =
        typeof gallery_urls === 'string'
            ? JSON.parse(gallery_urls)
            : (gallery_urls as string[]) ?? [];

    const imageUrl = req.file ? req.file.path : image_url;
    const now = new Date().toISOString();

    try {
        const _id = randomUUID();

        const variant = await ProductVariantSchema.create({
            _id,
            product_id, sku,
            name, description, brand,
            image_url: imageUrl,
            gallery_urls: parsedGalleryUrls,
            model_type, model_size,
            min_stock: parsedMinStock,
            stock: parsedStock,
            price: parsedPrice,
            status: parsedStock > 0 ? 'available' : 'out_of_stock',
            created_at: now,
            updated_at: now,
            expiration_date: expiration_date as string ?? '',
        });

        res.status(200).json({ _id: variant._id, message: 'Product variant created successfully' });
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