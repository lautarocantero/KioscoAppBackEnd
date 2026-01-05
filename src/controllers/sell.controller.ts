import { Request, Response } from "express";
import { CreateSellRequest, DeleteSellRequest, EditSellRequest, GetSellByIdRequest, GetSellsByDateRequest, GetSellsByProductRequest, GetSellsBySellerRequest, Sell } from "@typings/sell";
import { SellModel } from "../models/sellModel";
import { handleControllerError } from "../utils/handleControllerError";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con ventas 🕹️                                                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link                | Función            | Descripción                  | Params             | Return        | Auth Req | Status       ║
║--------|---------------------|--------------------|------------------------------|--------------------|---------------|----------|--------------║
║ GET    | /get-sales          | getSells           | Obtener todas las ventas     | -                  | JSON [Sale]   | Sí       | 200,500      ║
║ GET    | /get-sale-by-id     | getSellById        | Obtener venta por ID         | body: { _id }      | JSON Sale     | Sí       | 200,404,500  ║
║ GET    | /get-sales-by-seller| getSellsBySeller   | Obtener ventas por vendedor  | body: { sellerId } | JSON [Sale]   | Sí       | 200,404,500  ║
║ GET    | /get-sales-by-date  | getSellsByDate     | Obtener ventas por fecha     | body: { date }     | JSON [Sale]   | Sí       | 200,404,500  ║
║ GET    | /get-sales-by-product| getSellsByProduct | Obtener ventas por producto  | body: { productId }| JSON [Sale]   | Sí       | 200,404,500  ║
║ POST   | /create-sale        | createSell         | Crear nueva venta            | body: {...}        | JSON {id,msg} | Sí       | 201,400,500  ║
║ PUT    | /edit-sale          | editSell           | Editar venta existente       | body: {id,fields}  | JSON {id,msg} | Sí       | 200,400,404,500 ║
║ DELETE | /delete-sale        | deleteSell         | Eliminar venta               | body: { _id }      | JSON {id,msg} | Sí       | 200,404,500  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*══════════ 🎮 home() ══════════╗
║ 📥 sin parámetros              ║
║ ⚙️ lista endpoints de sell     ║
║ 📤 salida: HTML                ║
║ 🛠️ errores: N/A                ║
╚════════════════════════════════╝*/

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

/*══════════ 🎮 getSells ══════════╗
║ 📥 Entrada: -                    ║
║ ⚙️ Proceso: obtiene ventas       ║
║ 📤 Salida: JSON [Sell[]]         ║
║ 🛠️ Errores: handleControllerError║
╚═════════════════════════════════╝*/

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

/*══════════ 🎮 getSellById ══════════╗
║ 📥 Entrada: req.body._id (string)   ║
║ ⚙️ Proceso: busca venta por _id     ║
║ 📤 Salida: JSON {Sell}              ║
║ 🛠️ Errores: handleControllerError   ║
╚════════════════════════════════════╝*/


export async function getSellById (req: GetSellByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        // pese a ser un array de sell[], siempre devolvera uno solo.
        const SellObject: Sell[] = await SellModel.getSellsByField('_id',_id,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellsBySeller ══════════╗
║ 📥 Entrada: req.body.seller_name (string)║
║ ⚙️ Proceso: filtra ventas por vendedor   ║
║ 📤 Salida: JSON [Sell[]]                 ║
║ 🛠️ Errores: handleControllerError        ║
╚═════════════════════════════════════════╝*/


export async function getSellsBySeller (req: GetSellsBySellerRequest, res: Response): Promise<void> {
    const { seller_name } = req.body;

    try {
        const SellObject: Sell[] = await SellModel.getSellsByField('seller_name',seller_name,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellsByDate ══════════╗
║ 📥 Entrada: req.body.purchase_date     ║
║ ⚙️ Proceso: filtra ventas por fecha    ║
║ 📤 Salida: JSON [Sell[]]               ║
║ 🛠️ Errores: handleControllerError      ║
╚═══════════════════════════════════════╝*/


export async function getSellsByDate (req: GetSellsByDateRequest, res: Response): Promise<void> {
    const { purchase_date } = req.body;

    try {
        const SellObject: Sell[] = await SellModel.getSellsByField('purchase_date',purchase_date,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellsByProduct ══════════╗
║ 📥 Entrada: req.body._id (string)         ║
║ ⚙️ Proceso: ventas por producto específico ║
║ 📤 Salida: JSON [Sell[]]                  ║
║ 🛠️ Errores: handleControllerError         ║
╚══════════════════════════════════════════╝*/

export async function getSellsByProduct (req: GetSellsByProductRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        const SellObject: Sell[] = await SellModel.getSellsByProduct({_id});
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── Modificado ✅ ───────────────────────────────────────────//
/*══════════ 🎮 createSell ══════════╗
║ 📥 Entrada: products, date, seller, total ║
║ ⚙️ Proceso: crea venta en BD              ║
║ 📤 Salida: JSON {_id, confirmación}       ║
║ 🛠️ Errores: handleControllerError         ║
╚══════════════════════════════════════════╝*/

export async function createSell (req: CreateSellRequest, res: Response): Promise<void> {
    const { products,purchase_date, seller_id, seller_name,total_amount, payment_method } = req.body;

    try{
        const _id: string = await SellModel.create({
            products,purchase_date,seller_id,seller_name,total_amount,payment_method
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

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*══════════ 🎮 deleteSell ══════════╗
║ 📥 Entrada: req.body._id (string)  ║
║ ⚙️ Proceso: elimina venta por _id  ║
║ 📤 Salida: JSON {confirmación}     ║
║ 🛠️ Errores: handleControllerError  ║
╚═══════════════════════════════════╝*/


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

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*══════════ 🎮 editSell ══════════╗
║ 📥 Entrada: _id, products, date, seller, total ║
║ ⚙️ Proceso: edita venta existente              ║
║ 📤 Salida: JSON {confirmación}                 ║
║ 🛠️ Errores: handleControllerError              ║
╚═══════════════════════════════════════════════╝*/


export async function editSell (req: EditSellRequest, res: Response) : Promise <void> {
    const { _id,products,purchase_date,modification_date,seller_id,seller_name,total_amount,payment_method} = req.body;

    try{
        await SellModel.edit({_id,products,purchase_date,modification_date,seller_id,seller_name,total_amount,payment_method});
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

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
