// controllers/presentation.controller.ts

import { Request, Response } from 'express';
import { PresentationSchema } from '../models/presentationModel';
import {
    CreatePresentationRequest,
    DeletePresentationRequest,
    EditPresentationRequest,
    GetPresentationByIdRequest,
    GetPresentationByModelSizeRequest,
    GetPresentationByPriceRequest,
    GetPresentationByProductIdRequest,
    GetPresentationByStatusRequest,
    GetPresentationByStockRequest,
    presentation,
} from '@typings/presentation';
import { handleControllerError } from '../utils/handleControllerError';

//──────────────────────────────────────── GET ────────────────────────────────//

export async function home(_req: Request, res: Response): Promise<void> {
    res.status(200).send(`
        Estás en presentation<br>
        Endpoints =><br>
        ---- GET    /get-product-presentations<br>
        ---- GET    /get-presentation-by-id/:product_presentation_id<br>
        ---- GET    /get-presentation-by-product-id/:product_id<br>
        ---- GET    /get-presentation-by-stock<br>
        ---- GET    /get-presentation-by-price<br>
        ---- GET    /get-presentation-by-status<br>
        ---- GET    /get-presentation-by-net-content<br>
        ---- POST   /create-presentation<br>
        ---- PUT    /edit-presentation/:presentation_id<br>
        ---- DELETE /delete-presentation<br>
    `);
}

export async function getPresentations(_req: Request, res: Response): Promise<void> {
    try {
        const presentations: presentation[] = await PresentationSchema.find();
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationById(
    req: GetPresentationByIdRequest,
    res: Response,
): Promise<void> {
    const { product_presentation_id } = req.params;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ _id: product_presentation_id });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByProductId(
    req: GetPresentationByProductIdRequest,
    res: Response,
): Promise<void> {
    const { product_id } = req.params;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ product_id });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByStock(
    req: GetPresentationByStockRequest,
    res: Response,
): Promise<void> {
    const { stock } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ stock });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByPrice(
    req: GetPresentationByPriceRequest,
    res: Response,
): Promise<void> {
    const { price } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ price });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByStatus(
    req: GetPresentationByStatusRequest,
    res: Response,
): Promise<void> {
    const { status } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ status });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByModelSize(
    req: GetPresentationByModelSizeRequest,
    res: Response,
): Promise<void> {
    const { model_size } = req.body;
    try {
        const presentations: presentation[] = await PresentationSchema.find({ model_size });
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── POST ───────────────────────────────//

import { randomUUID } from 'crypto';

export async function createPresentation(
    req: CreatePresentationRequest,
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

        const presentation = await PresentationSchema.create({
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

        res.status(200).json({ _id: presentation._id, message: 'Product presentation created successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── PUT ────────────────────────────────//

export async function editPresentation(
    req: EditPresentationRequest,
    res: Response,
): Promise<void> {
    const { presentation_id } = req.params;
    const {
        sku, price, expiration_date,
        stock, min_stock,
        model_type, model_size,
        image_url, gallery_urls,
        brand, description,
    } = req.body;

    try {
        const result = await PresentationSchema.updateOne(
            { _id: presentation_id },
            {
                $set: {
                    sku,
                    name:            `${model_type} ${model_size}`,
                    model_type,
                    model_size,
                    brand:           brand ?? '',
                    description:     description ?? '',
                    price:           Number(price),
                    stock:           Number(stock),
                    min_stock:       Number(min_stock),
                    status:          Number(stock) > 0 ? 'available' : 'out_of_stock',
                    image_url:       image_url ?? '',
                    gallery_urls:    gallery_urls ?? [],
                    updated_at:      new Date().toISOString(),
                    expiration_date: expiration_date ?? '',
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({ message: `Variante ${presentation_id} no encontrada` });
            return;
        }

        res.status(200).json({ _id: presentation_id, message: 'Product presentation edited successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── DELETE ─────────────────────────────//

export async function deletePresentation(
    req: DeletePresentationRequest,
    res: Response,
): Promise<void> {
    const { _id } = req.body;
    try {
        await PresentationSchema.deleteOne({ _id });
        res.status(200).json({ message: 'Product presentation deleted successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}