import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import { CreateSellerRequest, DeleteSellerRequest, EditSellerRequest, GetSellerByEmailRequest, GetSellerByIdRequest, GetSellerByNameRequest, GetSellerByRolRequest, Seller } from "../typings/seller/sellerTypes";
import { SellerModel } from "../models/sellerModel";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
        .status(200)
        .send(`
          Estas en seller<br>
          Endpoints =><br>
          ----Get:  /get-sellers<br>
          ----Get:  /get-seller-by-id<br>
          ----Get:  /get-seller-by-name<br>
          ----Get:  /get-seller-by-email<br>
          ----Get:  /get-seller-by-rol<br>
          ----Post: /create-seller<br>
          ----Delete: /delete-seller<br>
          ----Put: /edit-seller<br>
        `);
}
// 🆗
export async function getSellers( _req: Request,res: Response): Promise <void> {

  try {
    const sellerObject: Seller[] = await SellerModel.getSellers();
    res
        .status(200)
        .json(sellerObject);
  } catch (error: unknown) {
        handleControllerError(res, error);
  }
}
// 🆗
export async function getSellerById (req: GetSellerByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        // pese a ser un array de seller[], siempre devolvera uno solo.
        const sellerObject: Seller[] = await SellerModel.getSellerByField('_id',_id,'string');
        res
            .status(200)
            .json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getSellerByName (req: GetSellerByNameRequest, res: Response): Promise<void> {
    const { name } = req.body;

    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('name',name,'string');
        res
            .status(200)
            .json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
// 🆗
export async function getSellerByEmail (req: GetSellerByEmailRequest, res: Response): Promise<void> {
    const { email } = req.body;

    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('email',email,'string');
        res
            .status(200)
            .json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

// 🆗
export async function getSellerByRol (req: GetSellerByRolRequest, res: Response): Promise<void> {
    const { rol } = req.body;

    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('rol',rol,'string');
        res
            .status(200)
            .json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function createSeller(req: CreateSellerRequest, res: Response): Promise <void> {
    const { name, email, password, rol, created_at, user_status } = req.body;

    try{
        const _id: string = await SellerModel.create({
            name, email, password, rol, created_at, user_status
        });
        res
            .status(200)
            .json({
                _id,
                message: 'Seller created successfully',
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function deleteSeller (req: DeleteSellerRequest, res: Response): Promise <void> {
    const { _id } = req.body;

    try{
        await SellerModel.delete({ _id });
        res
            .status(200)
            .json({
                _id,
                message: 'Seller has been deleted successfully',
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function editSeller (req: EditSellerRequest, res: Response) : Promise<void> {
    const { 
        _id, name, email, password, rol, created_at, user_status
    } = req.body;
                        
    try {
        await SellerModel.edit({ _id, name, email, password, rol, created_at, user_status});
        res
            .status(200)
            .json({
                _id,
                message: 'Seller has been edited successfully',
            });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
