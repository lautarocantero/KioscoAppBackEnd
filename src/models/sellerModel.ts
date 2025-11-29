import { SellerSchema } from "../schemas/sellerSchema";
import { SellerRol, SellerStatus } from "../typings/seller/sellerEnums";
import { CreateSellerPayload, DeleteSellerPayload, EditSellerPayload, Seller, SellerModelType } from "../typings/seller/sellerTypes";
import { Validation } from "./validation";

export class SellerModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: CreateSellerPayload): Promise <string> {

        const {
          name, email, password, rol, created_at, user_status
        } = data;

        const nameResult: string = Validation.stringValidation(name, 'name');
        const emailResult: string = Validation.stringValidation(email, 'email');
        const passwordResult: string = Validation.stringValidation(password, 'password');
        const rolResult: string = Validation.stringValidation(rol, 'rol');
        const createdAtResult: string = Validation.date(created_at, 'created at');
        const userStatusResult: string = Validation.stringValidation(user_status, 'user Status');

        const sellerObject: Seller = SellerSchema.findOne({ name : nameResult});

        if(sellerObject) throw new Error('seller already exists');

        if (!Object.values(SellerRol).includes(rolResult as SellerRol)) {
          throw new Error(`Invalid rol: ${rolResult}`);
        }

        if (!Object.values(SellerStatus).includes(user_status as SellerStatus)) {
          throw new Error(`Invalid rol: ${user_status}`);
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

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async delete ( data: DeleteSellerPayload ) : Promise<void> {

        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const SellerObject: SellerModelType = SellerSchema.findOne({ _id: _idResult });

        if(!SellerObject) throw new Error('There is not any seller with that id');

        SellerObject.remove();
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

      static async edit ( data: EditSellerPayload ) : Promise<void> {
        const { 
          _id, name, email, password, rol, created_at, user_status
         } = data;

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
          throw new Error(`Invalid rol: ${user_status}`);
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
}
