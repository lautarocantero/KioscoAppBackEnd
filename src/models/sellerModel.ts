import { SellerSchema } from "../schemas/sellerSchema";
import { SellerRol, SellerStatus } from "../typings/seller/sellerEnums";
import { 
    CreateSellerPayload, 
    DeleteSellerPayload, 
    EditSellerPayload, 
    Seller, 
    SellerModelType 
} from "@typings/seller";
import { Validation } from "./validation";

/*──────────────────────────────
🧑‍💼 SellerModel
──────────────────────────────
📜 Propósito: Gestión completa de vendedores (creación, consulta, edición, eliminación)
🧩 Dependencias: SellerSchema, Validation, sellerTypes, sellerEnums
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Validaciones estrictas en todos los campos
   - Control de duplicados (name único)
   - Validación de roles y estados permitidos
──────────────────────────────*/

/*──────────────────────────────
📚 Tipos usados en Seller
──────────────────────────────
- Seller: entidad principal de vendedor
- SellerModelType: instancia del modelo en BD
- CreateSellerPayload: payload para crear vendedor
- DeleteSellerPayload: payload para eliminar vendedor
- EditSellerPayload: payload para editar vendedor
- SellerRol: enumeración de roles válidos
- SellerStatus: enumeración de estados válidos
──────────────────────────────*/

/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Validar todos los campos antes de guardar
🗑️ Evitar duplicados (name único)
👔 Validar roles contra SellerRol
📊 Validar estados contra SellerStatus
──────────────────────────────*/

/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[getSellers] → devuelve hasta 100 vendedores
[getSellerByField] → busca vendedores por campo validado
[create] → valida campos, controla duplicados, guarda vendedor
[delete] → elimina vendedor por _id
[edit] → actualiza datos validados de vendedor
──────────────────────────────*/

export class SellerModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getSellers ══════════╗
    ║ 📥 Entrada: ninguna                  ║
    ║ ⚙️ Proceso: obtiene hasta 100 vendedores de SellerSchema ║
    ║ 📤 Salida: Seller[]                  ║
    ║ 🛠️ Errores: ninguno explícito        ║
    ╚═════════════════════════════════════╝*/
    static async getSellers(): Promise<Seller[]> {
        let count = 0;
        const results: Seller[] = [];
      
        SellerSchema.find((item: Seller) => {
            if (count < 100) {
                results.push(item);
                count++;
                return true;
            }
            return false;
        });

        return results as Seller[];
    }

    /*══════════ 🎮 getSellerByField ══════════╗
    ║ 📥 Entrada: field, value, type ('string'|'number') ║
    ║ ⚙️ Proceso: valida tipo y busca vendedores por campo ║
    ║ 📤 Salida: Seller[]                               ║
    ║ 🛠️ Errores: tipo no soportado, validaciones fallidas ║
    ╚════════════════════════════════════════════════════╝*/
    static async getSellerByField<T extends keyof Seller>(
        field: T,
        value: Seller[T],
        type: 'string' | 'number',
    ): Promise<Seller[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results: Seller[] = [];
        SellerSchema.find((item: Seller) => {
            if (item?.[field] === value) {
                results.push(item);
                return true;
            }
            return false;
        });

        return results as Seller[];
    }
    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: CreateSellerPayload {name,email,password,rol,created_at,user_status} ║
    ║ ⚙️ Proceso: valida campos, controla duplicados, valida rol y estado, genera _id y guarda vendedor ║
    ║ 📤 Salida: string _id generado                                                     ║
    ║ 🛠️ Errores: vendedor existente, rol/estado inválido, validaciones fallidas         ║
    ╚═══════════════════════════════════════════════════════════════════════════════════╝*/
    static async create (data: CreateSellerPayload): Promise <string> {
        const { name, email, password, rol, created_at, user_status } = data;

        const nameResult: string = Validation.stringValidation(name, 'name');
        const emailResult: string = Validation.stringValidation(email, 'email');
        const passwordResult: string = Validation.stringValidation(password, 'password');
        const rolResult: string = Validation.stringValidation(rol, 'rol');
        const createdAtResult: string = Validation.date(created_at, 'created at');
        const userStatusResult: string = Validation.stringValidation(user_status, 'user Status');

        const sellerObject: Seller = SellerSchema.findOne({ name : nameResult });
        if(sellerObject) throw new Error('seller already exists');

        if (!Object.values(SellerRol).includes(rolResult as SellerRol)) {
          throw new Error(`Invalid rol: ${rolResult}`);
        }

        if (!Object.values(SellerStatus).includes(user_status as SellerStatus)) {
          throw new Error(`Invalid status: ${user_status}`);
        }

        const _id: string = crypto.randomUUID();

        SellerSchema.create({
            _id: _id,
            name: nameResult,
            email: emailResult,
            password: passwordResult,
            rol: rolResult as SellerRol,
            created_at: createdAtResult,
            user_status: userStatusResult as SellerStatus,
        }).save();

        return _id as string;
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 delete ══════════╗
    ║ 📥 Entrada: DeleteSellerPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina vendedor ║
    ║ 📤 Salida: void                          ║
    ║ 🛠️ Errores: vendedor no encontrado       ║
    ╚═════════════════════════════════════════╝*/
    static async delete ( data: DeleteSellerPayload ) : Promise<void> {
        const { _id } = data;
        const _idResult: string = Validation.stringValidation(_id, '_id');
        const SellerObject: SellerModelType = SellerSchema.findOne({ _id: _idResult });

        if(!SellerObject) throw new Error('There is not any seller with that id');

        SellerObject.remove();
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    /*══════════ 🎮 edit ══════════╗
    ║ 📥 Entrada: EditSellerPayload {_id,name,email,password,rol,created_at,user_status} ║
    ║ ⚙️ Proceso: valida campos, valida rol y estado, actualiza vendedor                 ║
    ║ 📤 Salida: void                                                                    ║
    ║ 🛠️ Errores: vendedor no encontrado, rol/estado inválido, validaciones fallidas     ║
    ╚═══════════════════════════════════════════════════════════════════════════════════╝*/
    static async edit ( data: EditSellerPayload ) : Promise<void> {
        const { _id, name, email, password, rol, created_at, user_status } = data;

        const _idResult: string = Validation.stringValidation(_id,'_id');
        const nameResult: string  = Validation.stringValidation(name,'name');
        const emailResult: string  = Validation.stringValidation(email,'email');
        const passwordResult: string  = Validation.stringValidation(password,'password');
        const rolResult: string  = Validation.stringValidation(rol,'rol');
        const createdAtResult: string  = Validation.date(created_at,'createdAt');
        const userStatusResult: string  = Validation.stringValidation(user_status,'user Status');

        if (!Object.values(SellerRol).includes(rolResult as SellerRol)) {
          throw new Error(`Invalid rol: ${rolResult}`);
        }
        
        if (!Object.values(SellerStatus).includes(user_status as SellerStatus)) {
          throw new Error(`Invalid status: ${user_status}`);
        }

        const SellerObject: SellerModelType = SellerSchema.findOne({ _id: _idResult });
        if(!SellerObject) throw new Error('There is not any seller with that id');

        SellerObject.name = nameResult;
        SellerObject.email = emailResult;
        SellerObject.password = passwordResult;
        SellerObject.rol = rolResult as SellerRol;
        SellerObject.created_at = createdAtResult;
        SellerObject.user_status = userStatusResult as SellerStatus;
        SellerObject.save();
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
    
}
