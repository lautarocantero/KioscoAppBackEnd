import { Request, Response } from "express";
import { CreateSellRequest, DeleteSellRequest, EditSellRequest, GetSellByIdRequest, GetSellsByDateRequest, GetSellsByProductRequest, GetSellsBySellerRequest, Sell } from "../typings/sell/sellTypes";
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
          ----Get: /get-sells<br>
          ----Get: /get-sell-by-id<br>
          ----Get: /get-sells-by-seller<br>
          ----Get: /get-sells-by-date<br>
          ----Get: /get-sells-by-product<br>
          ----Post: /create-sell<br>
          ----Delete: /delete-sell<br>
          ----Put: /edit-sell<br>
        `);
}
// 🆗
export async function getSells(_req: Request, res: Response): Promise<void> {
    
    try{
        const sells: Sell[] = await SellModel.getSells();
        res
            .status(200)
            .json({sells});
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getSellById (req: GetSellByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        const SellObject = await SellModel.getSellsByField('_id',_id,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getSellsBySeller (req: GetSellsBySellerRequest, res: Response): Promise<void> {
    const { seller_name } = req.body;

    try {
        const SellObject = await SellModel.getSellsByField('seller_name',seller_name,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getSellsByDate (req: GetSellsByDateRequest, res: Response): Promise<void> {
    const { purchase_date } = req.body;

    try {
        const SellObject = await SellModel.getSellsByField('purchase_date',purchase_date,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getSellsByProduct (req: GetSellsByProductRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        const SellObject = await SellModel.getSellsByProduct({_id});
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
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

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function deleteSell (req: DeleteSellRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try{
        await SellModel.delete({ _id });
        res
            .status(200)
            .json({
                _id,
                message: 'Sell has been deleted successfully',
            });
    } catch(error: unknown){
       handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function editSell (req: EditSellRequest, res: Response) : Promise <void> {
    const { _id,products,purchase_date,seller_name,total_amount} = req.body;

    try{
        await SellModel.edit({_id,products,purchase_date,seller_name,total_amount});
        res
            .status(200)
            .json({
                _id,
                message: 'Sell has been edited successfully',
            });
    } catch (error: unknown ) {
        handleControllerError(res, error);
    }


}