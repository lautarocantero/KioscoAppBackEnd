import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import { CreateSellerRequest, DeleteSellerRequest, EditSellerRequest, GetSellerByEmailRequest, GetSellerByIdRequest, GetSellerByNameRequest, GetSellerByRolRequest, Seller } from "../typings/seller/sellerTypes";
import { SellerModel } from "../models/sellerModel";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con vendedores (seller) 🕹️                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link                  | Función            | Descripción                  | Params             | Return        | Auth Req | Status       ║
║--------|-----------------------|--------------------|------------------------------|--------------------|---------------|----------|--------------║
║ GET    | /get-sellers          | getSellers         | Obtener todos los vendedores | -                  | JSON [Seller] | Sí       | 200,500      ║
║ GET    | /get-seller-by-id     | getSellerById      | Obtener vendedor por ID      | body: { _id }      | JSON Seller   | Sí       | 200,404,500  ║
║ GET    | /get-seller-by-name   | getSellerByName    | Obtener vendedor por nombre  | body: { name }     | JSON [Seller] | Sí       | 200,404,500  ║
║ GET    | /get-seller-by-email  | getSellerByEmail   | Obtener vendedor por email   | body: { email }    | JSON Seller   | Sí       | 200,404,500  ║
║ GET    | /get-seller-by-rol    | getSellerByRol     | Obtener vendedor por rol     | body: { rol }      | JSON [Seller] | Sí       | 200,404,500  ║
║ POST   | /create-seller        | createSeller       | Crear nuevo vendedor         | body: {...}        | JSON {id,msg} | Sí       | 201,400,500  ║
║ PUT    | /edit-seller          | editSeller         | Editar vendedor existente    | body: {id,fields}  | JSON {id,msg} | Sí       | 200,400,404,500 ║
║ DELETE | /delete-seller        | deleteSeller       | Eliminar vendedor            | body: { _id }      | JSON {id,msg} | Sí       | 200,404,500  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*══════════ 🎮 home ══════════╗
║ 📥 Entrada: -                ║
║ ⚙️ Proceso: lista endpoints  ║
║ 📤 Salida: HTML              ║
║ 🛠️ Errores: N/A              ║
╚═════════════════════════════╝*/

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

/*══════════ 🎮 getSellers ══════════╗
║ 📥 Entrada: -                      ║
║ ⚙️ Proceso: obtiene vendedores     ║
║ 📤 Salida: JSON [Seller[]]         ║
║ 🛠️ Errores: handleControllerError  ║
╚═══════════════════════════════════╝*/


export async function getSellers(_req: Request, res: Response): Promise<void> {
  try {
    const sellerObject: Seller[] = await SellerModel.getSellers();
    res.status(200).json(sellerObject);
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}

/*══════════ 🎮 getSellerById ══════════╗
║ 📥 Entrada: req.body._id (string)     ║
║ ⚙️ Proceso: busca vendedor por _id    ║
║ 📤 Salida: JSON {Seller}              ║
║ 🛠️ Errores: handleControllerError     ║
╚══════════════════════════════════════╝*/


export async function getSellerById(req: GetSellerByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;
    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('_id',_id,'string');
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellerByName ══════════╗
║ 📥 Entrada: req.body.name (string)      ║
║ ⚙️ Proceso: filtra vendedores por nombre║
║ 📤 Salida: JSON [Seller[]]              ║
║ 🛠️ Errores: handleControllerError       ║
╚════════════════════════════════════════╝*/


export async function getSellerByName(req: GetSellerByNameRequest, res: Response): Promise<void> {
    const { name } = req.body;
    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('name',name,'string');
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellerByEmail ══════════╗
║ 📥 Entrada: req.body.email (string)      ║
║ ⚙️ Proceso: filtra vendedores por email  ║
║ 📤 Salida: JSON [Seller[]]               ║
║ 🛠️ Errores: handleControllerError        ║
╚═════════════════════════════════════════╝*/


export async function getSellerByEmail(req: GetSellerByEmailRequest, res: Response): Promise<void> {
    const { email } = req.body;
    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('email',email,'string');
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellerByRol ══════════╗
║ 📥 Entrada: req.body.rol (string)      ║
║ ⚙️ Proceso: filtra vendedores por rol  ║
║ 📤 Salida: JSON [Seller[]]             ║
║ 🛠️ Errores: handleControllerError      ║
╚═══════════════════════════════════════╝*/


export async function getSellerByRol(req: GetSellerByRolRequest, res: Response): Promise<void> {
    const { rol } = req.body;
    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('rol',rol,'string');
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

/*══════════ 🎮 createSeller ══════════╗
║ 📥 Entrada: name, email, pass, rol, date, status ║
║ ⚙️ Proceso: crea vendedor en BD                  ║
║ 📤 Salida: JSON {_id, confirmación}              ║
║ 🛠️ Errores: handleControllerError                ║
╚═════════════════════════════════════════════════╝*/


export async function createSeller(req: CreateSellerRequest, res: Response): Promise<void> {
    const { name, email, password, rol, created_at, user_status } = req.body;
    try{
        const _id: string = await SellerModel.create({ name, email, password, rol, created_at, user_status });
        res.status(200).json({ _id, message: 'Seller created successfully' });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*══════════ 🎮 deleteSeller ══════════╗
║ 📥 Entrada: req.body._id (string)    ║
║ ⚙️ Proceso: elimina vendedor por _id ║
║ 📤 Salida: JSON {confirmación}       ║
║ 🛠️ Errores: handleControllerError    ║
╚═════════════════════════════════════╝*/


export async function deleteSeller(req: DeleteSellerRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
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

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*══════════ 🎮 editSeller ══════════╗
║ 📥 Entrada: _id, name, email, pass, rol, date, status ║
║ ⚙️ Proceso: edita vendedor existente                  ║
║ 📤 Salida: JSON {confirmación}                        ║
║ 🛠️ Errores: handleControllerError                     ║
╚══════════════════════════════════════════════════════╝*/

export async function editSeller(req: EditSellerRequest, res: Response): Promise<void> {
    const { _id, name, email, password, rol, created_at, user_status } = req.body;

    try {
        await SellerModel.edit({ _id, name, email, password, rol, created_at, user_status });
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

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
