import { Request, Response } from "express";
import { SellModel } from "../models/sellModel";
import { handleControllerError } from "../utils/handleControllerError";
import { CreateSellRequestType, DeleteSellRequestType, EditSellRequestType, GetSellByIdRequestType, GetSellsByDateRequestType, GetSellsByProductRequestType, GetSellsBySellerRequestType, SellType } from "@typings/sell";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con ventas 🕹️                                                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados (nombres verificados)                                                                               ║
║                                                                                                                           ║
║ Tipo   | Link                   | Función            | Descripción                    | Params                         | Return         | Auth Req | Status       ║
║--------|------------------------|--------------------|--------------------------------|--------------------------------|----------------|----------|--------------║
║ GET    | /get-sells             | getSells           | Obtener todas las ventas       | -                              | JSON [Sell]    | Sí       | 200,500      ║
║ GET    | /get-sell-by-id        | getSellById        | Obtener venta por ID           | body: { ticket_id: string }    | JSON [Sell]    | Sí       | 200,404,500  ║
║ GET    | /get-sells-by-seller   | getSellsBySeller   | Ventas por vendedor            | body: { seller_name: string }  | JSON [Sell]    | Sí       | 200,404,500  ║
║ GET    | /get-sells-by-date     | getSellsByDate     | Ventas por fecha               | body: { purchase_date: string }| JSON [Sell]    | Sí       | 200,404,500  ║
║ GET    | /get-sells-by-product  | getSellsByProduct  | Ventas por producto            | body: { ticket_id: string }    | JSON [Sell]    | Sí       | 200,404,500  ║
║ POST   | /create-sell           | createSell         | Crear nueva venta              | body: {...venta}               | JSON {id,msg}  | Sí       | 200,400,500  ║
║ PUT    | /edit-sell             | editSell           | Editar venta existente         | body: {id, campos}             | JSON {id,msg}  | Sí       | 200,400,404,500 ║
║ DELETE | /delete-sell           | deleteSell         | Eliminar venta                 | body: { ticket_id: string }    | JSON {id,msg}  | Sí       | 200,404,500  ║
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
        const sells: SellType[] = await SellModel.getSells();
        res
            .status(200)
            .json(sells);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellById ══════════╗
║ 📥 Entrada: req.body.ticket_id (string)   ║
║ ⚙️ Proceso: busca venta por ticket_id     ║
║ 📤 Salida: JSON {Sell}              ║
║ 🛠️ Errores: handleControllerError   ║
╚════════════════════════════════════╝*/


export async function getSellById (req: GetSellByIdRequestType, res: Response): Promise<void> {
    const { ticket_id } = req.params;

    try {
        // pese a ser un array de sell[], siempre devolvera uno solo.
        const SellObject: SellType[] = await SellModel.getSellsByField('ticket_id',ticket_id,'string');
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


export async function getSellsBySeller (req: GetSellsBySellerRequestType, res: Response): Promise<void> {
    const { seller_name } = req.body;

    try {
        const SellObject: SellType[] = await SellModel.getSellsByField('seller_name',seller_name,'string');
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


export async function getSellsByDate (req: GetSellsByDateRequestType, res: Response): Promise<void> {
    const { purchase_date } = req.body;

    try {
        const SellObject: SellType[] = await SellModel.getSellsByField('purchase_date',purchase_date,'string');
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellsByProduct ══════════╗
║ 📥 Entrada: req.body.ticket_id (string)         ║
║ ⚙️ Proceso: ventas por producto específico ║
║ 📤 Salida: JSON [Sell[]]                  ║
║ 🛠️ Errores: handleControllerError         ║
╚══════════════════════════════════════════╝*/

export async function getSellsByProduct (req: GetSellsByProductRequestType, res: Response): Promise<void> {
    const { ticket_id } = req.body;

    try {
        const SellObject: SellType[] = await SellModel.getSellsByProduct({ticket_id});
        res
            .status(200)
            .json(SellObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
/*══════════ 🎮 createSell ══════════╗
║ 📥 Entrada: products, date, seller, total ║
║ ⚙️ Proceso: crea venta en BD              ║
║ 📤 Salida: JSON {ticket_id, confirmación}       ║
║ 🛠️ Errores: handleControllerError         ║
╚══════════════════════════════════════════╝*/

export async function createSell (req: CreateSellRequestType, res: Response): Promise<void> {
    const { 
        currency,
        iva,
        payment_method,
        products,
        purchase_date, 
        seller_id, 
        seller_name,
        sub_total,
        total_amount, 
    } = req.body;

    try{
        const ticket_id: string = await SellModel.create({purchase_date,seller_id,seller_name,payment_method,products,sub_total,iva,total_amount,currency});
        res
            .status(200)
            .json({
                ticket_id,
                message: 'Sell saved successfully',
            });
    } catch(error: unknown){
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*══════════ 🎮 deleteSell ══════════╗
║ 📥 Entrada: req.body.ticket_id (string)  ║
║ ⚙️ Proceso: elimina venta por ticket_id  ║
║ 📤 Salida: JSON {confirmación}     ║
║ 🛠️ Errores: handleControllerError  ║
╚═══════════════════════════════════╝*/


export async function deleteSell (req: DeleteSellRequestType, res: Response): Promise<void> {
    const { ticket_id } = req.params;

    try{
        await SellModel.delete({ ticket_id });
        res
            .status(200)
            .json({
                ticket_id,
                message: 'Sell has been deleted successfully',
            });
    } catch(error: unknown){
       handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*══════════ 🎮 editSell ══════════╗
║ 📥 Entrada: ticket_id, products, date, seller, total ║
║ ⚙️ Proceso: edita venta existente              ║
║ 📤 Salida: JSON {confirmación}                 ║
║ 🛠️ Errores: handleControllerError              ║
╚═══════════════════════════════════════════════╝*/


export async function editSell (req: EditSellRequestType, res: Response) : Promise <void> {
    const { ticket_id,purchase_date,modification_date,seller_id,seller_name,payment_method, products,sub_total, iva, total_amount, currency } = req.body;

    try{
        await SellModel.edit({ticket_id,purchase_date,modification_date,seller_id,seller_name,payment_method, products,sub_total, iva, total_amount, currency});
        res
            .status(200)
            .json({
                ticket_id,
                message: 'Sell has been edited successfully',
            });
    } catch (error: unknown ) {
        handleControllerError(res, error);
    }
}