import { Request, Response } from 'express';
import { PresentationModel } from '../models/presentationModel';
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
} from '@typings/presentation';
import { handleControllerError } from '../utils/handleControllerError';
import { GetPresentationAnalyticsRequest } from '@typings/sell';
import { PresentationAnalyticsService } from '../services/presentationAnalysticsService';

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
        const presentations = await PresentationModel.getPresentations();
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationById(req: GetPresentationByIdRequest, res: Response): Promise<void> {
    const { product_presentation_id } = req.params;
    try {
        const presentations = await PresentationModel.getPresentationByField('_id', product_presentation_id, 'string');
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByProductId(req: GetPresentationByProductIdRequest, res: Response): Promise<void> {
    const { product_id } = req.params;
    try {
        const presentations = await PresentationModel.getPresentationByField('product_id', product_id, 'string');
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByStock(req: GetPresentationByStockRequest, res: Response): Promise<void> {
    const { stock } = req.body;
    try {
        const presentations = await PresentationModel.getPresentationByField('stock', stock, 'number');
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByPrice(req: GetPresentationByPriceRequest, res: Response): Promise<void> {
    const { price } = req.body;
    try {
        const presentations = await PresentationModel.getPresentationByField('price', price, 'number');
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByStatus(req: GetPresentationByStatusRequest, res: Response): Promise<void> {
    const { status } = req.body;
    try {
        const presentations = await PresentationModel.getPresentationByField('status', status, 'string');
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getPresentationByModelSize(req: GetPresentationByModelSizeRequest, res: Response): Promise<void> {
    const { model_size } = req.body;
    try {
        const presentations = await PresentationModel.getPresentationByField('model_size', model_size, 'string');
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function searchPresentationsByProductId(
    req: GetPresentationByProductIdRequest,
    res: Response,
): Promise<void> {
    const { product_id } = req.params;
    const term = (req.query.term as string) ?? '';
    try {
        const presentations = await PresentationModel.searchByProductIdAndTerm(product_id, term);
        res.status(200).json(presentations);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── ANALYTICS ──────────────────────────//

export async function getPresentationAnalytics(
    req: GetPresentationAnalyticsRequest,
    res: Response,
): Promise<void> {
    const { presentation_id } = req.params;
    const { start_date, end_date, seller_id } = req.query;

    try {
        const analytics = await PresentationAnalyticsService.getAnalytics(presentation_id, start_date, end_date, seller_id);
        res.status(200).json(analytics);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── POST ───────────────────────────────//

export async function createPresentation(req: CreatePresentationRequest, res: Response): Promise<void> {
    const {
        product_id, sku, name, description, brand, image_url,
        model_type, model_size, min_stock, stock, price, expiration_date,
    } = req.body;

    const imageUrl = req.file ? req.file.path : image_url;

    try {
        const _id = await PresentationModel.create({
            product_id, sku, name, description, brand,
            image_url: imageUrl, model_type, model_size,
            min_stock: Number(min_stock), stock: Number(stock),
            price: Number(price), expiration_date,
        });
        res.status(200).json({ _id, message: 'Product presentation created successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── PUT ────────────────────────────────//

export async function editPresentation(req: EditPresentationRequest, res: Response): Promise<void> {
    const { presentation_id } = req.params;
    const {
        sku, price, expiration_date, stock, min_stock,
        model_type, model_size, image_url, brand, description,
        name,
    } = req.body;

    try {
        await PresentationModel.edit({
            _id: presentation_id, sku, price: Number(price), stock: Number(stock),
            min_stock: Number(min_stock), model_type, model_size,
            image_url, brand, description, expiration_date, name,
        });
        res.status(200).json({ _id: presentation_id, message: 'Product presentation edited successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────── DELETE ─────────────────────────────//

export async function deletePresentation(req: DeletePresentationRequest, res: Response): Promise<void> {
    const { _id } = req.body;
    try {
        await PresentationModel.delete({ _id });
        res.status(200).json({ _id, message: 'Product presentation deleted successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}