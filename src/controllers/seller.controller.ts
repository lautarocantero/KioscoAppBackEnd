import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import {
  EditSellerRequest,
  GetSellerByEmailRequest,
  GetSellerByIdRequest,
  GetSellerByNameRequest,
} from "@typings/seller";
import { SellerModel } from "../models/sellerModel";
import { KioscoModel } from "../models/kioscoModel";
import { KioscoSellerMember } from "@typings/kioscoMembership";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con vendedores (seller) 🕹️                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo | Link                 | Función          | Descripción                    | Params           | Return        | Auth Req | Status      ║
║------|----------------------|------------------|--------------------------------|------------------|---------------|----------|-------------║
║ GET  | /get-sellers         | getSellers       | Vendedores del kiosco activo   | -                | JSON [Seller] | Sí       | 200,500     ║
║ GET  | /get-seller-by-id    | getSellerById    | Obtener vendedor por ID        | query: { _id }   | JSON [Seller] | Sí       | 200,404,500 ║
║ GET  | /get-seller-by-name  | getSellerByName  | Obtener vendedor por nombre    | query: { name }  | JSON [Seller] | Sí       | 200,404,500 ║
║ GET  | /get-seller-by-email | getSellerByEmail | Obtener vendedor por email     | query: { email } | JSON Seller   | Sí       | 200,404,500 ║
║ PUT  | /edit-seller         | editSeller       | Editar perfil (name/foto/status)| body: {id,...}  | JSON {id,msg} | Sí       | 200,400,404,500 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
Nota: "los vendedores del kiosco" (email + rol incluidos) se resuelven vía
KioscoModel.getSellersOfKiosco — el rol vive en KioscoMembership, no en Seller/Auth.
Nota: crear/eliminar vendedores del kiosco va por /kiosco/join y
DELETE /kiosco/:kiosco_id/member/:user_id — ya no por acá.
*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

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
          Agregar/quitar vendedores del kiosco: ver /kiosco/join y /kiosco/:kiosco_id/member/:user_id<br>
        `);
}

export async function getSellers(req: Request, res: Response): Promise<void> {
  try {
    const sellers: KioscoSellerMember[] = await KioscoModel.getSellersOfKiosco(req.kioscoId!);
    res.status(200).json(sellers);
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}

export async function getSellerById(req: GetSellerByIdRequest, res: Response): Promise<void> {
    const { _id } = req.query as { _id: string };
    try {
        const sellers = await KioscoModel.getSellersOfKiosco(req.kioscoId!);
        const seller = sellers.filter((s) => s._id === _id);
        res.status(200).json(seller);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getSellerByName(req: GetSellerByNameRequest, res: Response): Promise<void> {
    const { name } = req.body;
    try {
        const sellers = await KioscoModel.getSellersOfKiosco(req.kioscoId!);
        const nameTerm = String(name ?? '').toLowerCase();
        const matches = sellers.filter((s) => s.name.toLowerCase().includes(nameTerm));
        res.status(200).json(matches);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getSellerByEmail(req: GetSellerByEmailRequest, res: Response): Promise<void> {
    const { email } = req.body;
    try {
        const sellers = await KioscoModel.getSellersOfKiosco(req.kioscoId!);
        const seller = sellers.find((s) => s.email === email);
        if (!seller) throw new Error('There is not any seller with that email');
        res.status(200).json(seller);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

export async function editSeller(req: EditSellerRequest, res: Response): Promise<void> {
    const { _id, name, profilePhoto, user_status } = req.body;

    try {
        // Solo se puede editar el perfil de un vendedor que pertenece al kiosco activo.
        const membership = await KioscoModel.getMembership(req.kioscoId!, String(_id));
        if (!membership) throw new Error('This user is not a member of the kiosco');

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
