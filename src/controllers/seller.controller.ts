import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import {
  EditSellerRequest,
  GetSellerByEmailRequest,
  GetSellerByIdRequest,
  GetSellerByNameRequest,
  Seller,
  SellerWithEmail,
} from "@typings/seller";
import { SellerModel } from "../models/sellerModel";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con vendedores (seller) 🕹️                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo | Link                 | Función          | Descripción                    | Params           | Return        | Auth Req | Status      ║
║------|----------------------|------------------|--------------------------------|------------------|---------------|----------|-------------║
║ GET  | /get-sellers         | getSellers       | Obtener todos los vendedores   | -                | JSON [Seller] | Sí       | 200,500     ║
║ GET  | /get-seller-by-id    | getSellerById    | Obtener vendedor por ID        | body: { _id }    | JSON [Seller] | Sí       | 200,404,500 ║
║ GET  | /get-seller-by-name  | getSellerByName  | Obtener vendedor por nombre    | body: { name }   | JSON [Seller] | Sí       | 200,404,500 ║
║ GET  | /get-seller-by-email | getSellerByEmail | Obtener vendedor por email     | body: { email }  | JSON Seller   | Sí       | 200,404,500 ║
║ PUT  | /edit-seller         | editSeller       | Editar perfil (name/foto/status)| body: {id,...}  | JSON {id,msg} | Sí       | 200,400,404,500 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
Nota: crear/eliminar vendedores ya no vive acá — ver /register y /delete-auth en auth.controller.
Nota: getSellerByRol se eliminó — 'rol' ya no es un campo de Seller, vive como Auth.role.
*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*══════════ 🎮 home ══════════╗
║ 📥 Entrada: -                ║
║ ⚙️ Proceso: lista endpoints  ║
║ 📤 Salida: HTML              ║
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
          ----Put:  /edit-seller<br>
          <br>
          Crear/eliminar vendedores: ver /register y /delete-auth en Auth<br>
        `);
}

/*══════════ 🎮 getSellers ══════════╗
║ 📥 Entrada: -                      ║
║ ⚙️ Proceso: obtiene vendedores     ║
║ 📤 Salida: JSON [Seller[]]         ║
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
║ 📤 Salida: JSON [Seller[]]            ║
╚══════════════════════════════════════╝*/

export async function getSellerById(req: GetSellerByIdRequest, res: Response): Promise<void> {
    const { _id } = req.body;
    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('_id', _id, 'string');
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellerByName ══════════╗
║ 📥 Entrada: req.body.name (string)      ║
║ ⚙️ Proceso: filtra vendedores por nombre║
║ 📤 Salida: JSON [Seller[]]              ║
╚════════════════════════════════════════╝*/

export async function getSellerByName(req: GetSellerByNameRequest, res: Response): Promise<void> {
    const { name } = req.body;
    try {
        const sellerObject: Seller[] = await SellerModel.getSellerByField('name', name, 'string');
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════ 🎮 getSellerByEmail ══════════╗
║ 📥 Entrada: req.body.email (string)      ║
║ ⚙️ Proceso: resuelve el email contra Auth║
║    y trae el Seller asociado por _id     ║
║ 📤 Salida: JSON SellerWithEmail          ║
╚═════════════════════════════════════════╝*/

export async function getSellerByEmail(req: GetSellerByEmailRequest, res: Response): Promise<void> {
    const { email } = req.body;
    try {
        const sellerObject: SellerWithEmail = await SellerModel.getSellerByEmail(email);
        res.status(200).json(sellerObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*══════════ 🎮 editSeller ══════════╗
║ 📥 Entrada: _id, name, profilePhoto, user_status ║
║ ⚙️ Proceso: edita perfil existente                ║
║ 📤 Salida: JSON {confirmación}                    ║
╚══════════════════════════════════════════════════╝*/

export async function editSeller(req: EditSellerRequest, res: Response): Promise<void> {
    const { _id, name, profilePhoto, user_status } = req.body;

    try {
        await SellerModel.edit({ _id, name, profilePhoto, user_status });
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