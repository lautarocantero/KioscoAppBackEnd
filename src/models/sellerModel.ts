import { SellerSchema } from '../schemas/sellerSchema';
import { SellerStatus } from '../typings/seller/sellerEnums';
import { EditSellerPayload, Seller } from '@typings/seller';
import { Validation } from './validation';

/*──────────────────────────────
🧑‍💼 SellerModel — Mongoose
──────────────────────────────
📜 Propósito: Perfil global del vendedor (name/foto/estado online), 1:1 con Auth.
Listar "los vendedores de un kiosco" (con email + rol) ya no es responsabilidad
de este modelo — vive en KioscoModel.getSellersOfKiosco, que resuelve el join
contra KioscoMembership + Auth (el rol es por-kiosco, no un campo de Seller).
──────────────────────────────*/

export class SellerModel {

    static async edit(data: EditSellerPayload): Promise<void> {
        const { _id, name, profilePhoto, user_status } = data;
        const _idResult = Validation.stringValidation(_id, '_id');

        const setFields: Partial<Seller> = {};
        if (name !== undefined) setFields.name = Validation.stringValidation(name, 'name');
        if (profilePhoto !== undefined) setFields.profilePhoto = Validation.stringValidation(profilePhoto, 'profile photo');
        if (user_status !== undefined) {
            if (!Object.values(SellerStatus).includes(user_status as SellerStatus)) {
                throw new Error(`Invalid status: ${user_status}`);
            }
            setFields.user_status = user_status as SellerStatus;
        }

        const updated = await SellerSchema.findOneAndUpdate({ _id: _idResult }, { $set: setFields });
        if (!updated) throw new Error('There is not any seller with that id');
    }
}
