import { SellerSchema } from '../schemas/sellerSchema';
import { SellerRol, SellerStatus } from '../typings/seller/sellerEnums';
import {
    CreateSellerPayload,
    DeleteSellerPayload,
    EditSellerPayload,
    Seller,
} from '@typings/seller';
import { Validation } from './validation';

/*──────────────────────────────
🧑‍💼 SellerModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de vendedores contra MongoDB
🧩 Dependencias: SellerSchema, Validation, sellerTypes, sellerEnums
──────────────────────────────*/

export class SellerModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getSellers(): Promise<Seller[]> {
        const results = await SellerSchema.find().limit(100).lean();
        return results as unknown as Seller[];
    }

    static async getSellerByField<T extends keyof Seller>(
        field: T,
        value: Seller[T],
        type: 'string' | 'number',
    ): Promise<Seller[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results = await SellerSchema.find({ [field]: value }).lean();
        return results as unknown as Seller[];
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    static async create(data: CreateSellerPayload): Promise<string> {
        const { name, email, password, rol, created_at, user_status } = data;

        const nameResult: string        = Validation.stringValidation(name, 'name');
        const emailResult: string       = Validation.stringValidation(email, 'email');
        const passwordResult: string    = Validation.stringValidation(password, 'password');
        const rolResult: string         = Validation.stringValidation(rol, 'rol');
        const createdAtResult: string   = Validation.date(created_at, 'created at');
        const userStatusResult: string  = Validation.stringValidation(user_status, 'user Status');

        if (!Object.values(SellerRol).includes(rolResult as SellerRol)) {
            throw new Error(`Invalid rol: ${rolResult}`);
        }
        if (!Object.values(SellerStatus).includes(userStatusResult as SellerStatus)) {
            throw new Error(`Invalid status: ${userStatusResult}`);
        }

        const existing = await SellerSchema.findOne({ name: nameResult }).lean();
        if (existing) throw new Error('seller already exists');

        const _id: string = crypto.randomUUID();

        await SellerSchema.create({
            _id,
            name:        nameResult,
            email:       emailResult,
            password:    passwordResult,
            rol:         rolResult as SellerRol,
            created_at:  createdAtResult,
            user_status: userStatusResult as SellerStatus,
        });

        return _id;
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    static async delete(data: DeleteSellerPayload): Promise<void> {
        const { _id } = data;
        const _idResult: string = Validation.stringValidation(_id, '_id');

        const deleted = await SellerSchema.findOneAndDelete({ _id: _idResult });
        if (!deleted) throw new Error('There is not any seller with that id');
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    static async edit(data: EditSellerPayload): Promise<void> {
        const { _id, name, email, password, rol, created_at, user_status } = data;

        const _idResult: string       = Validation.stringValidation(_id, '_id');
        const nameResult: string      = Validation.stringValidation(name, 'name');
        const emailResult: string     = Validation.stringValidation(email, 'email');
        const passwordResult: string  = Validation.stringValidation(password, 'password');
        const rolResult: string       = Validation.stringValidation(rol, 'rol');
        const createdAtResult: string = Validation.date(created_at, 'createdAt');
        const userStatusResult: string = Validation.stringValidation(user_status, 'user Status');

        if (!Object.values(SellerRol).includes(rolResult as SellerRol)) {
            throw new Error(`Invalid rol: ${rolResult}`);
        }
        if (!Object.values(SellerStatus).includes(userStatusResult as SellerStatus)) {
            throw new Error(`Invalid status: ${userStatusResult}`);
        }

        const updated = await SellerSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: {
                name:        nameResult,
                email:       emailResult,
                password:    passwordResult,
                rol:         rolResult as SellerRol,
                created_at:  createdAtResult,
                user_status: userStatusResult as SellerStatus,
            }},
        );

        if (!updated) throw new Error('There is not any seller with that id');
    }
}