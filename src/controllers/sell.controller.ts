import { Request, Response } from "express";
import { SellModel } from "../models/sellModel";
import { handleControllerError } from "../utils/handleControllerError";
import { CreateSellRequestType, DeleteSellRequestType, EditSellRequestType, GetSellByIdRequestType, GetSellsByDateRequestType, GetSellsByProductRequestType, GetSellsBySellerRequestType, SellType } from "@typings/sell";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con ventas 🕹️                                                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados (nombres verificados)                                                                               ║
║                                                                                                                           ║
║ Tipo   | Link                   | Función            | Descripción                    | Params                         | Return           | Auth Req | Status            ║
║--------|------------------------|--------------------|--------------------------------|--------------------------------|------------------|----------|-------------------║
║ GET    | /get-sells             | getSells           | Obtener todas las ventas       | -                              | {Sell[]}         | Sí       | 200,500         ║
║ GET    | /get-sell-by-id        | getSellById        | Obtener venta por ID           | params: { _id: string }  | {Sell}           | Sí       | 200,404,500     ║
║ GET    | /get-sells-by-seller   | getSellsBySeller   | Ventas por vendedor            | body: { seller_name: string }  | {Sell[]}         | Sí       | 200,404,500     ║
║ GET    | /get-sells-by-date     | getSellsByDate     | Ventas por fecha               | body: { purchase_date: string }| {Sell[]}         | Sí       | 200,404,500     ║
║ GET    | /get-sells-by-product  | getSellsByProduct  | Ventas por producto            | body: { _id: string }    | {Sell[]}         | Sí       | 200,404,500     ║
║ POST   | /create-sell           | createSell         | Crear nueva venta              | body: {...venta}               | {_id,msg}  | Sí       | 200,400,500     ║
║ PUT    | /edit-sell             | editSell           | Editar venta existente         | body: {id, campos}             | {_id,msg}  | Sí       | 200,400,404,500 ║
║ DELETE | /delete-sell           | deleteSell         | Eliminar venta                 | body: { _id: string }    | {_id,msg}  | Sí       | 200,404,500     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*══════════ 🎮 home() ══════════╗
║ 📥 sin parámetros              ║
║ ⚙️ lista endpoints de sell     ║
║ 📤 salida: HTML                ║
║ 🛠️ errores: N/A                ║
╚════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res.status(200).send(` 
        <h2>📊 API de Ventas de Kiosco</h2> 
        <p>Este endpoint principal describe los recursos disponibles para gestionar las ventas.</p> 
        <h3>Endpoints disponibles:</h3> 
        <ul> 
            <li><strong>GET</strong> – Obtener todas las ventas → <code>/sell/get-sells</code></li> 
            <li><strong>GET</strong> – Obtener venta por ID → <code>/sell/get-sell-by-id</code></li> 
            <li><strong>GET</strong> – Ventas por vendedor → <code>/sell/get-sells-by-seller</code></li> 
            <li><strong>GET</strong> – Ventas por fecha → <code>/sell/get-sells-by-date</code></li> 
            <li><strong>GET</strong> – Ventas por producto → <code>/sell/get-sells-by-product</code>
            </li> <li><strong>POST</strong> – Crear nueva venta → <code>/sell/create-sell</code></li> 
            <li><strong>DELETE</strong> – Eliminar venta → <code>/sell/delete-sell</code></li> 
            <li><strong>PUT</strong> – Editar venta → <code>/sell/edit-sell</code></li> 
        </ul> 
    `);
}

/*══════════ 🎮 getSells ══════════╗
║ 📥 Entrada: -                    ║
║ ⚙️ Proceso: obtiene ventas       ║
║ 📤 Salida: {Sell[]}               ║
║ 🛠️ Errores: handleControllerError║
╚═════════════════════════════════╝*/

export async function getSells(_req: Request, res: Response): Promise<void> {
    const limit = Number(_req.query.limit) || 100; 
    const offset = Number(_req.query.offset) || 0;

    try{
        const sells: SellType[] = await SellModel.getSells(limit, offset);
        res
            .status(200)
            .json({
                data: sells,
                pagination: {
                    limit, 
                    offset,
                    count: sells.length,
                }
            });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellById ══════════╗
║ 📥 Entrada: req.body._id (string)   ║
║ ⚙️ Proceso: busca venta por _id     ║
║ 📤 Salida: {Sell}                     ║
║ 🛠️ Errores: handleControllerError   ║
╚════════════════════════════════════╝*/


export async function getSellById (req: GetSellByIdRequestType, res: Response): Promise<void> {
    const { _id } : { _id : unknown } = req.params;

    try {
        // pese a ser un array de sell[], siempre devolvera uno solo.
        const SellObject: SellType[] = await SellModel.getSellsByField('_id',_id,'string');
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
║ 📤 Salida: {Sell[]}                        ║
║ 🛠️ Errores: handleControllerError        ║
╚═════════════════════════════════════════╝*/


export async function getSellsBySeller (req: GetSellsBySellerRequestType, res: Response): Promise<void> {
    const { seller_name } : { seller_name : unknown } = req.body;

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
║ 📤 Salida: {Sell[]}                   ║
║ 🛠️ Errores: handleControllerError      ║
╚═══════════════════════════════════════╝*/


export async function getSellsByDate (req: GetSellsByDateRequestType, res: Response): Promise<void> {
    const { purchase_date } : { purchase_date : unknown } = req.body;

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
║ 📥 Entrada: req.body._id (string)         ║
║ ⚙️ Proceso: ventas por producto específico ║
║ 📤 Salida: {Sell[]}                       ║
║ 🛠️ Errores: handleControllerError         ║
╚══════════════════════════════════════════╝*/

export async function getSellsByProduct (req: GetSellsByProductRequestType, res: Response): Promise<void> {
    const { _id } : { _id : unknown } = req.body;

    try {
        const SellObject: SellType[] = await SellModel.getSellsByProduct({_id});
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
║ 📤 Salida: {_id, message}            ║
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
        const _id: string = await SellModel.create({purchase_date,seller_id,seller_name,payment_method,products,sub_total,iva,total_amount,currency});
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

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*══════════ 🎮 deleteSell ══════════╗
║ 📥 Entrada: req.body._id (string)  ║
║ ⚙️ Proceso: elimina venta por _id  ║
║ 📤 Salida: {_id, message}     ║
║ 🛠️ Errores: handleControllerError  ║
╚═══════════════════════════════════╝*/


export async function deleteSell (req: DeleteSellRequestType, res: Response): Promise<void> {
    const { _id } : { _id : unknown } = req.params;

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

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*══════════ 🎮 editSell ══════════╗
║ 📥 Entrada: _id, products, date, seller, total ║
║ ⚙️ Proceso: edita venta existente              ║
║ 📤 Salida: {_id, message}                 ║
║ 🛠️ Errores: handleControllerError              ║
╚═══════════════════════════════════════════════╝*/


export async function editSell (req: EditSellRequestType, res: Response) : Promise <void> {
    const { 
        _id,purchase_date,modification_date,
        seller_id,seller_name,payment_method, 
        products,sub_total, iva, total_amount, 
        currency } = req.body;

    try{
        await SellModel.edit({_id,purchase_date,modification_date,seller_id,seller_name,payment_method, products,sub_total, iva, total_amount, currency});
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