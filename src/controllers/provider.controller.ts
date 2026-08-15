import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import { ProviderModel } from "../models/providerModel";
import {
  CreateProviderRequest,
  DeleteProviderRequest,
  EditProviderRequest,
  GetProviderByIdRequest,
  GetProviderByNameRequest,
  GetProviderByValorationRequest,
  GetProviderByContactRequest,
  Provider,
} from "@typings/provider";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con proveedores 🕹️                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Tipo   | Link                       | Función                | Descripción                        | Return          | Status       ║
║--------|----------------------------|-------------------------|-------------------------------------|-----------------|--------------║
║ GET    | /get-providers             | getProviders            | Obtener todos los proveedores       | JSON [Provider] | 200,500      ║
║ GET    | /get-provider-by-id        | getProviderById         | Obtener proveedor por ID            | JSON [Provider] | 200,404,500  ║
║ GET    | /get-provider-by-name      | getProvidersByName      | Obtener proveedores por nombre      | JSON [Provider] | 200,404,500  ║
║ GET    | /get-provider-by-valoration| getProvidersByValoration| Obtener proveedores por valoración  | JSON [Provider] | 200,404,500  ║
║ GET    | /get-providers-by-contact  | getProvidersByContact   | Buscar por teléfono o email         | JSON [Provider] | 200,404,500  ║
║ GET    | /get-providers-stats       | getProvidersStats       | Total de proveedores registrados    | JSON {total}    | 200,500      ║
║ POST   | /create-provider           | createProvider          | Crear nuevo proveedor               | JSON {id,msg}   | 200,400,500  ║
║ PUT    | /edit-provider             | editProvider            | Editar proveedor existente          | JSON {id,msg}   | 200,400,404,500 ║
║ DELETE | /delete-provider           | deleteProvider          | Eliminar proveedor                  | JSON {msg}      | 200,404,500  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

export async function home(_req: Request, res: Response): Promise<void> {
    res
        .status(200)
        .send(`
            Estas en provider<br>
            Endpoints =><br>
            ----Get:  /get-providers<br>
            ----Get:  /get-provider-by-id<br>
            ----Get:  /get-provider-by-name<br>
            ----Get:  /get-provider-by-valoration<br>
            ----Get:  /get-providers-by-contact<br>
            ----Get:  /get-providers-stats<br>
            ----Post: /create-provider<br>
            ----Delete: /delete-provider<br>
            ----Put: /edit-provider<br>
        `);
}

export async function getProviders(_req: Request, res: Response): Promise<void> {
    try {
        const providersResult: Provider[] = await ProviderModel.getProviders();
        res.status(200).json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

// Filtros por query string (no body: los navegadores no mandan body en GET).
export async function getProviderById(req: GetProviderByIdRequest, res: Response): Promise<void> {
    const { _id } = req.query;

    try {
        // pese a ser un array de Provider[], siempre devolverá uno solo.
        const providerResult: Provider[] = await ProviderModel.getProviderByField('_id', _id, 'string');
        res.status(200).json(providerResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProvidersByName(req: GetProviderByNameRequest, res: Response): Promise<void> {
    const { name } = req.query;

    try {
        const providersResult: Provider[] = await ProviderModel.getProviderByField('name', name, 'string');
        res.status(200).json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProvidersByValoration(req: GetProviderByValorationRequest, res: Response): Promise<void> {
    const { valoration } = req.query;

    try {
        const valorationResult = valoration === undefined ? undefined : Number(valoration);
        const providersResult: Provider[] = await ProviderModel.getProviderByField('valoration', valorationResult, 'number');
        res.status(200).json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProvidersByContact(req: GetProviderByContactRequest, res: Response): Promise<void> {
    const { contact } = req.query;

    try {
        const providersResult: Provider[] = await ProviderModel.getProvidersByContact(contact);
        res.status(200).json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getProvidersStats(_req: Request, res: Response): Promise<void> {
    try {
        const totalProviders: number = await ProviderModel.getProvidersCount();
        res.status(200).json({ totalProviders });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

export async function createProvider(req: CreateProviderRequest, res: Response): Promise<void> {
    const { name, valoration, contact_phone, contact_email } = req.body;

    try {
        const _id: string = await ProviderModel.create({ name, valoration, contact_phone, contact_email });
        res
            .status(200)
            .json({
                _id,
                message: 'The provider has been registered correctly',
            });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

export async function deleteProvider(req: DeleteProviderRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        await ProviderModel.delete({ _id });
        res.status(200).json({ message: 'The provider has been removed correctly' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

export async function editProvider(req: EditProviderRequest, res: Response): Promise<void> {
    const { _id, name, valoration, contact_phone, contact_email } = req.body;

    try {
        await ProviderModel.edit({ _id, name, valoration, contact_phone, contact_email });
        res.status(200).json({ message: 'The provider has been edited successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
