import { ProviderSchema } from "../schemas/providerSchema";
import { 
    CreateProviderPayload, 
    DeleteProviderPayload, 
    EditProviderPayload, 
    Provider, 
    ProviderModelType 
} from "../typings/provider/providerTypes";
import { Validation } from "./validation";

/*──────────────────────────────
🏢 ProviderModel
──────────────────────────────
📜 Propósito: Gestión completa de proveedores (creación, consulta, edición, eliminación)
🧩 Dependencias: ProviderSchema, Validation, providerTypes
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Validaciones estrictas en todos los campos
   - Control de duplicados (name único)
   - Manejo seguro de contactos y valoraciones
──────────────────────────────*/

/*──────────────────────────────
📚 Tipos usados en Provider
──────────────────────────────
- Provider: entidad principal de proveedor
- ProviderModelType: instancia del modelo en BD
- CreateProviderPayload: payload para crear proveedor
- DeleteProviderPayload: payload para eliminar proveedor
- EditProviderPayload: payload para editar proveedor
──────────────────────────────*/

/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Validar todos los campos antes de guardar
🗑️ Evitar duplicados (name único)
📞 Validar teléfonos de contacto
⭐ Validar valoraciones numéricas
──────────────────────────────*/

/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[GetProviders] → devuelve hasta 100 proveedores
[GetProductByField] → busca proveedores por campo validado
[Create] → valida campos, controla duplicados, guarda proveedor
[Delete] → elimina proveedor por _id
[Edit] → actualiza datos validados de proveedor
──────────────────────────────*/

export class ProviderModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getProviders ══════════╗
    ║ 📥 Entrada: ninguna                  ║
    ║ ⚙️ Proceso: obtiene hasta 100 proveedores de ProviderSchema ║
    ║ 📤 Salida: Provider[]                ║
    ║ 🛠️ Errores: ninguno explícito        ║
    ╚═════════════════════════════════════╝*/
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

    /*══════════ 🎮 getProductByField ══════════╗
    ║ 📥 Entrada: field, value, type ('string'|'number') ║
    ║ ⚙️ Proceso: valida tipo y busca proveedores por campo ║
    ║ 📤 Salida: Provider[]                             ║
    ║ 🛠️ Errores: tipo no soportado, validaciones fallidas ║
    ╚════════════════════════════════════════════════════╝*/
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

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: CreateProviderPayload {name,valoration,contact_phone,contact_auxiliar} ║
    ║ ⚙️ Proceso: valida campos, controla duplicados, genera _id y guarda proveedor      ║
    ║ 📤 Salida: string _id generado                                                     ║
    ║ 🛠️ Errores: proveedor existente, validaciones fallidas                             ║
    ╚═══════════════════════════════════════════════════════════════════════════════════╝*/
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

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 delete ══════════╗
    ║ 📥 Entrada: DeleteProviderPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina proveedor ║
    ║ 📤 Salida: void                           ║
    ║ 🛠️ Errores: proveedor no encontrado       ║
    ╚═════════════════════════════════════════╝*/
    static async delete ( data: DeleteProviderPayload ) : Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const ProviderObject: ProviderModelType = ProviderSchema.findOne({ _id: _idResult });

        if(!ProviderObject) throw new Error('There is not any provider with that id');

        ProviderObject.remove();
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

      /*══════════ 🎮 edit ══════════╗
    ║ 📥 Entrada: EditProviderPayload {_id,name,valoration,contact_phone,contact_auxiliar} ║
    ║ ⚙️ Proceso: valida campos y actualiza proveedor                                      ║
    ║ 📤 Salida: void                                                                      ║
    ║ 🛠️ Errores: proveedor no encontrado, validaciones fallidas                           ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝*/
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

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
    
}