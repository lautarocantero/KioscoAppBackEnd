import { Request, Response } from "express";
import { CreateSellRequest } from "../typings/sell/sellTypes";
import { SellModel } from "../models/sellModel";
import { handleControllerError } from "../utils/handleControllerError";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
        .status(200)
        .send(`
          Estas en sell<br>
          Endpoints =><br>
          ----Post: /create-sell<br>
        `);
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function createSell (req: CreateSellRequest, res: Response): Promise<void> {
    const { products,purchase_date,seller_name,total_amount } = req.body;

    try{
        const _id = SellModel.create({
            products,purchase_date,seller_name,total_amount
        });
        res
            .status(200)
            .json({
                _id,
                message: 'Sell saved successfully',
            });
    } catch(error: unknown){
        handleControllerError(res, error);
    }
}