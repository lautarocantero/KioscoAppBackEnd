import { Request, Response } from "express";
import { handleControllerError } from "../utils/handleControllerError";
import { ProviderModel } from "../models/providerModel";
import { CreateProviderRequest, DeleteProviderRequest, EditProviderRequest, GetProviderByIdRequest, Provider } from "../typings/provider/providerTypes";
/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

// 🆗
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

// 🆗
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

// 🆗
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

// 🆗
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

// 🆗
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

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

// 🆗
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


/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

// 🆗
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

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

// 🆗
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