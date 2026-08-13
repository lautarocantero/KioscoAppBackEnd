import { SellerSchema } from '../schemas/sellerSchema';
import { AuthSchema } from '../schemas/authSchema';
import { SellerStatus } from '../typings/seller/sellerEnums';
import { EditSellerPayload, Seller, SellerWithEmail } from '@typings/seller';
import { Validation } from './validation';

export class SellerModel {

    static async getSellers(): Promise<Seller[]> {
        const results = await SellerSchema.find().limit(100).lean();
        return results as unknown as Seller[];
    }

    static async getSellerByField<T extends keyof Seller>(
        field: T, value: Seller[T], type: 'string' | 'number',
    ): Promise<Seller[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results = await SellerSchema.find({ [field]: value }).lean();
        return results as unknown as Seller[];
    }

    // email ya no vive en Seller: se resuelve primero contra Auth
    static async getSellerByEmail(email: unknown): Promise<SellerWithEmail> {
        const emailResult = Validation.email(email);
        const authObject = await AuthSchema.findOne({ email: emailResult }).lean();
        if (!authObject) throw new Error('There is not any seller with that email');

        const sellerObject = await SellerSchema.findOne({ _id: authObject._id }).lean();
        if (!sellerObject) throw new Error('Seller profile not found');

        return { ...sellerObject, email: authObject.email } as SellerWithEmail;
    }

    // create/delete ya no existen acá: los maneja AuthModel.create / AuthModel.deleteAuth
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