import { ProviderSchema } from "../schemas/providerSchema";
import { CreateProviderPayload, DeleteProviderPayload, EditProviderPayload, Provider, ProviderModelType } from "../typings/provider/providerTypes";
import { Validation } from "./validation";


export class ProviderModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async getProviders(): Promise <Provider[]> {
        let count = 0;
        const results: Provider[] = [];
        
        ProviderSchema.find((item: Provider) => {
            if (count < 100) {
                results.push(item);
                count++;
                return true;
            }
        return false;
        });

        return results as Provider[];      
    }

    static async getProductByField<T extends keyof Provider>(
        field: T,
        value: Provider[T],
        type: 'string' | 'number',
    ): Promise<Provider[]> {

        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        
        if (type === 'string') Validation.stringValidation(value, field as string);
    
        if (type === 'number') Validation.number(value, field as string);
    

        const results: Provider[] = [];
        ProviderSchema.find((item: Provider) => {
            if (item?.[field] === value) {
                results.push(item);
                return true;
            }
            return false;
        });

        return results as Provider[];
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: CreateProviderPayload): Promise <string> {

        const {name, valoration, contact_phone, contact_auxiliar} = data;

        const nameResult: string = Validation.stringValidation(name, 'name');
        const valorationResult: number = Validation.number(valoration, 'valoration');
        const contactPhoneResult: string = Validation.stringValidation(contact_phone, 'contact phone');
        const contactAuxiliarResult: string = Validation.stringValidation(contact_auxiliar, 'contact auxiliar');

        const providerObject: Provider = ProviderSchema.findOne({ name : nameResult});

        if(providerObject) throw new Error('provider already exists');

        const _id: string = crypto.randomUUID();

        ProviderSchema.create({
            _id: _id,
            name: nameResult,
            valoration: valorationResult,
            contact_phone: contactPhoneResult,
            contact_auxiliar: contactAuxiliarResult,
        }).save();

        return _id as string;
    }


/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async delete ( data: DeleteProviderPayload ) : Promise<void> {

        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const ProviderObject: ProviderModelType = ProviderSchema.findOne({ _id: _idResult });

        if(!ProviderObject) throw new Error('There is not any provider with that id');

        ProviderObject.remove();
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async edit (data: EditProviderPayload): Promise <void> {

        const { _id, name, valoration, contact_phone, contact_auxiliar} = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const nameResult: string = Validation.stringValidation(name, 'name');
        const valorationResult: number = Validation.number(valoration, 'valoration');
        const contactPhoneResult: string = Validation.stringValidation(contact_phone, 'contact phone');
        const contactAuxiliarResult: string = Validation.stringValidation(contact_auxiliar, 'contact auxiliar');

        const providerObject: ProviderModelType = ProviderSchema.findOne({ _id : _idResult });

        if(!providerObject) throw new Error('Theres is not provider with that ID');

        providerObject.name = nameResult;
        providerObject.valoration = valorationResult;
        providerObject.contact_phone = contactPhoneResult;
        providerObject.contact_auxiliar = contactAuxiliarResult;
        providerObject.save();
    }

}