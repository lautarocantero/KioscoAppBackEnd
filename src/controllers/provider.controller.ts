import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import { ProviderModel } from "../models/providerModel";
import { CreateProviderRequest, DeleteProviderRequest, EditProviderRequest, GetProviderByIdRequest, Provider } from "../typings/provider/providerTypes";
      
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con proveedores 🕹️                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link                   | Función              | Descripción                     | Params             | Return        | Auth Req | Status       ║
║--------|------------------------|----------------------|---------------------------------|--------------------|---------------|----------|--------------║
║ GET    | /get-providers         | getProviders         | Obtener todos los proveedores   | -                  | JSON [Provider]| No      | 200,500      ║
║ GET    | /get-provider-by-id    | getProviderById      | Obtener proveedor por ID        | body: { _id }      | JSON [Provider][0] | No       | 200,404,500  ║
║ GET    | /get-provider-by-name  | getProvidersByName    | Obtener proveedor por nombre    | body: { name }     | JSON [Provider]| No      | 200,404,500  ║
║ GET    | /get-provider-by-rating| getProvidersByValoration  | Obtener proveedor por valoración| body: { rating }   | JSON [Provider]| No      | 200,404,500  ║
║ GET    | /get-provider-by-contact| getProvidersByContact| Obtener proveedor por contacto  | body: { contact }  | JSON Provider | No       | 200,404,500  ║
║ POST   | /create-provider       | createProvider       | Crear nuevo proveedor           | body: {...}        | JSON {id,msg} | Sí       | 201,400,500  ║
║ PUT    | /edit-provider         | editProvider         | Editar proveedor existente      | body: {id,fields}  | JSON {id,msg} | Sí       | 200,400,404,500 ║
║ DELETE | /delete-provider       | deleteProvider       | Eliminar proveedor              | body: { _id }      | JSON {id,msg} | Sí       | 200,404,500  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 home → Devuelve listado de endpoints disponibles                                                                       ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: HTML con endpoints                                                                                              ║
║ 🛠️ Errores: No aplica                                                                                                     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

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
            ----Post: /create-provider<br>
            ----Delete: /delete-provider<br>
            ----Put: /edit-provider<br>
        `);
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProviders → Obtiene todos los proveedores                                                                           ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: JSON [Provider]                                                                                                ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function getProviders(_req: Request, res: Response): Promise<void> {
    try{
        const providersResult: Provider[] = await ProviderModel.getProviders();
        res
            .status(200)
            .json(providersResult);
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProviderById → Busca proveedor por ID                                                                               ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON Provider                                                                                                  ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function getProviderById (req: GetProviderByIdRequest, res: Response) : Promise <void> {
    const { _id } = req.body;

    try{
        // pese a ser un array de Provider[], siempre devolvera uno solo.
        const providerResult: Provider[] = await ProviderModel.getProductByField('_id',_id,'string');
        res
            .status(200)
            .json(providerResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }

}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProviderByName → Busca proveedores por nombre                                                                       ║
║ 📥 Entrada: { name }                                                                                                      ║
║ 📤 Salida: JSON [Provider]                                                                                                ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function getProvidersByName (req: GetProviderByIdRequest, res: Response) : Promise <void> {
    const { name } = req.body;

    try{
        const providersResult: Provider[] = await ProviderModel.getProductByField('name',name,'string');
        res
            .status(200)
            .json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProviderByRating → Busca proveedores por valoración                                                                 ║
║ 📥 Entrada: { rating }                                                                                                    ║
║ 📤 Salida: JSON [Provider]                                                                                                ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function getProvidersByValoration (req: GetProviderByIdRequest, res: Response) : Promise <void> {
    const { valoration } = req.body;

    try{
        const providersResult: Provider[] = await ProviderModel.getProductByField('valoration',valoration,'number');
        res
            .status(200)
            .json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProviderByContact → Busca proveedor por contacto                                                                    ║
║ 📥 Entrada: { contact }                                                                                                   ║
║ 📤 Salida: JSON Provider                                                                                                  ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProvidersByContact (req: GetProviderByIdRequest, res: Response) : Promise <void> {
    const { contact_phone } = req.body;

    try{
        const providersResult: Provider[] = await ProviderModel.getProductByField('contact_phone',contact_phone,'string');
        res
            .status(200)
            .json(providersResult);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────/

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 createProvider → Crear nuevo proveedor                                                                                 ║
║ 📥 Entrada: { name, rating, contact_phone, contact_auxiliar }                                                             ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function createProvider(req: CreateProviderRequest, res: Response) : Promise <void> {
    const { name, valoration, contact_phone, contact_auxiliar } = req.body;

    try{
        const _id: string = await ProviderModel.create({name, valoration, contact_phone, contact_auxiliar});
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

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 deleteProvider → Eliminar proveedor                                                                                    ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function deleteProvider(req: DeleteProviderRequest, res: Response) : Promise<void> {
    const { _id } = req.body;

    try{
        await ProviderModel.delete({_id});
        res
            .status(200)
            .json({message: 'The provider has been removed correctly',});
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 editProvider → Editar proveedor existente                                                                              ║
║ 📥 Entrada: { _id, name, rating, contact_phone, contact_auxiliar }                                                        ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


export async function editProvider(req: EditProviderRequest, res: Response) : Promise <void> {
    const { _id, name, valoration, contact_phone, contact_auxiliar } = req.body;

    try{
        await ProviderModel.edit({_id, name, valoration, contact_phone, contact_auxiliar});
        res
            .status(200)
            .json({message: 'The provider has been edited successfully',});
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
