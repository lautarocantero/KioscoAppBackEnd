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
──────────────────────────────*/

export class ProviderModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getProviders(): Promise<Provider[]> {
        const results = await ProviderSchema.find().limit(100).lean();
        return results as unknown as Provider[];
    }

    static async getProviderByField<T extends keyof Provider>(
        field: T,
        value: unknown,
        type: 'string' | 'number',
    ): Promise<Provider[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results = await ProviderSchema.find({ [field]: value }).lean();
        return results as unknown as Provider[];
    }

    // Busca por teléfono O email de contacto (un solo término de búsqueda).
    static async getProvidersByContact(contact: unknown): Promise<Provider[]> {
        const contactResult = Validation.stringValidation(contact, 'contact');

        const results = await ProviderSchema.find({
            $or: [{ contact_phone: contactResult }, { contact_email: contactResult }],
        }).lean();

        return results as unknown as Provider[];
    }

    //──────────────────────────────────────────── 📊 STATS 📊 ───────────────────────────────────────────//

    static async getProvidersCount(): Promise<number> {
        return await ProviderSchema.countDocuments();
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    static async create(data: CreateProviderPayload): Promise<string> {
        const { name, valoration, contact_phone, contact_email } = data;

        const nameResult         = Validation.stringValidation(name, 'name');
        const valorationResult   = Validation.range(valoration, 'valoration', 1, 5);
        const contactPhoneResult = Validation.stringValidation(contact_phone, 'contact phone');
        const contactEmailResult = Validation.email(contact_email);

        const existing = await ProviderSchema.findOne({ name: nameResult }).lean();
        if (existing) throw new Error('provider already exists');

        const _id: string = crypto.randomUUID();

        await ProviderSchema.create({
            _id,
            name:            nameResult,
            valoration:      valorationResult,
            contact_phone:   contactPhoneResult,
            contact_email:   contactEmailResult,
        });

        return _id;
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    static async delete(data: DeleteProviderPayload): Promise<void> {
        const { _id } = data;

        const _idResult = Validation.stringValidation(_id, '_id');

        const deleted = await ProviderSchema.findOneAndDelete({ _id: _idResult });
        if (!deleted) throw new Error('There is not any provider with that id');
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    // Solo pisa los campos que vengan definidos (igual que SellerModel.edit).
    static async edit(data: EditProviderPayload): Promise<void> {
        const { _id, name, valoration, contact_phone, contact_email } = data;

        const _idResult = Validation.stringValidation(_id, '_id');

        const setFields: Partial<Provider> = {};
        if (name !== undefined) setFields.name = Validation.stringValidation(name, 'name');
        if (valoration !== undefined) setFields.valoration = Validation.range(valoration, 'valoration', 1, 5);
        if (contact_phone !== undefined) setFields.contact_phone = Validation.stringValidation(contact_phone, 'contact phone');
        if (contact_email !== undefined) setFields.contact_email = Validation.email(contact_email);

        const updated = await ProviderSchema.findOneAndUpdate({ _id: _idResult }, { $set: setFields });
        if (!updated) throw new Error('There is not any provider with that id');
    }
}
