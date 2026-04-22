import { ProviderSchema } from '../schemas/providerSchema';
import { 
    CreateProviderPayload, 
    DeleteProviderPayload, 
    EditProviderPayload, 
    Provider, 
} from '@typings/provider';
import { Validation } from './validation';

/*──────────────────────────────
🏢 ProviderModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de proveedores contra MongoDB
🧩 Dependencias: ProviderSchema, Validation, providerTypes
──────────────────────────────*/

export class ProviderModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getProviders(): Promise<Provider[]> {
        const results = await ProviderSchema.find().limit(100).lean();
        return results as unknown as Provider[];
    }

    static async getProductByField<T extends keyof Provider>(
        field: T,
        value: Provider[T],
        type: 'string' | 'number',
    ): Promise<Provider[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results = await ProviderSchema.find({ [field]: value }).lean();
        return results as unknown as Provider[];
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    static async create(data: CreateProviderPayload): Promise<string> {
        const { name, valoration, contact_phone, contact_auxiliar } = data;

        const nameResult: string             = Validation.stringValidation(name, 'name');
        const valorationResult: number       = Validation.number(valoration, 'valoration');
        const contactPhoneResult: string     = Validation.stringValidation(contact_phone, 'contact phone');
        const contactAuxiliarResult: string  = Validation.stringValidation(contact_auxiliar, 'contact auxiliar');

        const existing = await ProviderSchema.findOne({ name: nameResult }).lean();
        if (existing) throw new Error('provider already exists');

        const _id: string = crypto.randomUUID();

        await ProviderSchema.create({
            _id,
            name:             nameResult,
            valoration:       valorationResult,
            contact_phone:    contactPhoneResult,
            contact_auxiliar: contactAuxiliarResult,
        });

        return _id;
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    static async delete(data: DeleteProviderPayload): Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const deleted = await ProviderSchema.findOneAndDelete({ _id: _idResult });
        if (!deleted) throw new Error('There is not any provider with that id');
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    static async edit(data: EditProviderPayload): Promise<void> {
        const { _id, name, valoration, contact_phone, contact_auxiliar } = data;

        const _idResult: string            = Validation.stringValidation(_id, '_id');
        const nameResult: string           = Validation.stringValidation(name, 'name');
        const valorationResult: number     = Validation.number(valoration, 'valoration');
        const contactPhoneResult: string   = Validation.stringValidation(contact_phone, 'contact phone');
        const contactAuxiliarResult: string = Validation.stringValidation(contact_auxiliar, 'contact auxiliar');

        const updated = await ProviderSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: {
                name:             nameResult,
                valoration:       valorationResult,
                contact_phone:    contactPhoneResult,
                contact_auxiliar: contactAuxiliarResult,
            }},
        );

        if (!updated) throw new Error('There is not any provider with that id');
    }
}