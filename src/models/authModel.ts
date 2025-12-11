import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import { AuthSchema } from '../schemas/authSchema';
import { Validation } from './validation';
import { 
    AuthRegisterPayload,
    AuthLoginPayload, 
    AuthPublic, 
    AuthTokenPublic,
    AuthSchemaType,  
    AuthCheckAuthPayload, 
    AuthModelType, 
    AuthPublicSchema, 
    AuthRefreshTokenPayload,
    DeleteAuthPayload, 
    EditAuthPayload 
} from '../typings/auth/authTypes';

/*──────────────────────────────
🔐 AuthModel
──────────────────────────────
📜 Propósito: Autenticación y gestión de usuarios
🧩 Dependencias: bcrypt, SALT_ROUNDS, AuthSchema, Validation, authTypes
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Hash de contraseñas con bcrypt + SALT_ROUNDS
   - Nunca devolver password ni refreshToken
   - Validaciones estrictas en todos los campos
──────────────────────────────*/

/*──────────────────────────────
📚 Tipos usados en Auth
──────────────────────────────
- AuthRegisterPayload: datos para registro
- AuthLoginPayload: credenciales de login
- AuthPublic: usuario sin datos sensibles
- AuthPublicSchema: usuario público validado
- AuthTokenPublic: objeto con refreshToken
- AuthSchemaType: documento completo en BD
- AuthModelType: instancia del modelo en BD
- AuthCheckAuthPayload: payload para validar usuario
- AuthRefreshTokenPayload: payload para manejar refreshToken
- DeleteAuthPayload: payload para eliminar usuario
- EditAuthPayload: payload para editar usuario
──────────────────────────────*/

/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Contraseñas: siempre hash con bcrypt + SALT_ROUNDS
🗑️ Password y refreshToken nunca se devuelven en JSON
⚠️ Validaciones estrictas en todos los campos
──────────────────────────────*/

/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[Register] → crea usuario con hash → guarda en AuthSchema
[Login] → valida email + bcrypt.compare → devuelve AuthPublic
[GetRefreshToken] → busca token de refresco por _id
[CheckAuth] → valida usuario y devuelve datos públicos
[SaveRefreshToken] → guarda token de refresco en usuario
[DeleteRefreshToken] → borra token de refresco de usuario
[DeleteAuth] → elimina usuario
[EditAuth] → actualiza datos validados
──────────────────────────────*/

export class AuthModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    
    /*══════════ 🎮 getRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id} ║
    ║ ⚙️ Proceso: valida id y busca refreshToken ║
    ║ 📤 Salida: AuthTokenPublic {refreshToken}  ║
    ║ 🛠️ Errores: faltante o tipo inválido       ║
    ╚══════════════════════════════════════════╝*/

    static async getRefreshToken (data : AuthRefreshTokenPayload): Promise <AuthTokenPublic> {
        const { _id } = data;

        const idResult: string = Validation.stringValidation(_id, '_id');

        const { refreshToken } : AuthTokenPublic = AuthSchema.findOne({ _id: idResult });

        if( !refreshToken) throw new Error("Missing refresh token in cookies");

        if (typeof refreshToken !== 'string') throw new Error("Refresh token is not a string");

        return { refreshToken } as  AuthTokenPublic;
    }

    /*══════════ 🎮 checkAuth ══════════╗
    ║ 📥 Entrada: AuthCheckAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id, busca usuario,   ║
    ║    elimina password y refreshToken      ║
    ║ 📤 Salida: AuthPublicSchema             ║
    ║ 🛠️ Errores: usuario no encontrado,      ║
    ║    token faltante                       ║
    ╚═════════════════════════════════════════╝*/

    static async checkAuth (data: AuthCheckAuthPayload): Promise<AuthPublicSchema> {
        const { _id } = data;

        const idResult: string = Validation.stringValidation(_id, '_id');

        const authObject: AuthSchemaType = AuthSchema.findOne({ _id: idResult});

        if(!authObject) throw new Error('User not found');

        if(!authObject.refreshToken) throw new Error('Missing refresh token in cookies');

        // eliminacion de dato sensible password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password:_password , refreshToken: _refreshToken, ...publicAuth  } = authObject as AuthSchemaType;

        return publicAuth as AuthPublicSchema;
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    
    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: AuthRegisterPayload {username,email,password,repeatPassword,profilePhoto} ║
    ║ ⚙️ Proceso: valida campos, verifica duplicados, genera _id y hash de password         ║
    ║ 📤 Salida: string _id generado                                                        ║
    ║ 🛠️ Errores: username existente, validaciones fallidas                                ║
    ╚═════════════════════════════════════════════════════════════════════════════════════╝*/

    static async create (data: AuthRegisterPayload) : Promise<string> {
        const { username, email, password, repeatPassword, profilePhoto} = data;

        const usernameResult: string = Validation.stringValidation(username, 'username');
        const emailResult: string = Validation.email(email);
        const passwordResult: string = Validation.password(password);
        Validation.password(repeatPassword);
        const profileResult: string = profilePhoto ? Validation.image(profilePhoto) : '';
        
        const authObject: AuthSchemaType = AuthSchema.findOne({ username: usernameResult });

        if(authObject) throw new Error('username already exists');

        const _id: string = crypto.randomUUID();

        const hashedPassword: string = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        AuthSchema.create({
            _id,
            username: usernameResult,
            email: emailResult,
            password: hashedPassword as string,
            refreshToken: '' as string,
            profilePhoto: profileResult as string,
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

    /*══════════ 🎮 login ══════════╗
     📥 Entrada: AuthLoginPayload {email,password} ║
     ⚙️ Proceso: valida credenciales con bcrypt     ║
     📤 Salida: AuthPublic                          ║
     🛠️ Errores: email inexistente, password inválido ║
    ═══════════════════════════════════════════════╝*/

    static async login (data: AuthLoginPayload) : Promise<AuthPublic> {
        const { email, password } = data;

        const emailResult: string = Validation.email(email);
        const passwordResult: string = Validation.password(password);
        
        const authObject: AuthSchemaType = AuthSchema.findOne({email: emailResult});
        if(!authObject) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(passwordResult, authObject.password as string);
        if(!isValid) throw new Error('Password is incorrect. Make sure caps lock is off and try again.');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password:_password ,refreshToken:_refreshToken, ...publicUser  } = authObject as AuthSchemaType;

        return publicUser as AuthPublic;
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    
    /*══════════ 🎮 deleteAuth ══════════╗
    ║ 📥 Entrada: DeleteAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina usuario ║
    ║ 📤 Salida: void                        ║
    ║ 🛠️ Errores: usuario no encontrado      ║
    ╚═══════════════════════════════════════╝*/

    static async deleteAuth(data: DeleteAuthPayload): Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const authObject: AuthModelType = AuthSchema.findOne({_id: _idResult});

        if(!authObject) throw new Error('User not found');

        authObject.remove();
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    /*══════════ 🎮 saveRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id,token} ║
    ║ ⚙️ Proceso: valida id y token, guarda refreshToken ║
    ║ 📤 Salida: void                                ║
    ║ 🛠️ Errores: usuario no encontrado              ║
    ╚═══════════════════════════════════════════════╝*/

    static async saveRefreshToken(data : AuthRefreshTokenPayload): Promise<void> {
        const {_id, token} = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const tokenResult: string = Validation.stringValidation(token, 'token');

        const authObject: AuthModelType = AuthSchema.findOne({_id: _idResult});
        if(!authObject) throw new Error('User not found');

        authObject.refreshToken = tokenResult;
        authObject.save();
    }

    /*══════════ 🎮 deleteRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id}   ║
    ║ ⚙️ Proceso: valida id, borra refreshToken   ║
    ║ 📤 Salida: void                             ║
    ║ 🛠️ Errores: usuario no encontrado, token faltante ║
    ╚════════════════════════════════════════════╝*/

    static async deleteRefreshToken (data : AuthRefreshTokenPayload) : Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const authObject: AuthModelType = AuthSchema.findOne({ _id: _idResult });

        if(!authObject) throw new Error('User not found');

        if(!authObject.refreshToken) throw new Error('Missing refresh token in cookies');

        authObject.refreshToken = undefined;
        authObject.save();
    }

    /*══════════ 🎮 editAuth ══════════╗
    ║ 📥 Entrada: EditAuthPayload {_id,username,profilePhoto,email,password} ║
    ║ ⚙️ Proceso: valida campos y actualiza usuario                          ║
    ║ 📤 Salida: void                                                        ║
    ║ 🛠️ Errores: usuario no encontrado, validaciones fallidas               ║
    ╚═══════════════════════════════════════════════════════════════════════╝*/

    static async editAuth (data: EditAuthPayload) : Promise<void> {
        const { _id, username, profilePhoto, email, password } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const userNameResult: string = Validation.stringValidation(username, 'username');
        const profileResult: string = Validation.stringValidation(profilePhoto, 'profile photo');
        const emailResult: string = Validation.email(email);
        const passwordResult: string = Validation.password(password);

        const authObject: AuthModelType = AuthSchema.findOne({ _id: _idResult });

        if(!authObject) throw new Error('User not found');

        authObject.username = userNameResult;
        authObject.email = emailResult;
        authObject.profilePhoto = profileResult;
        authObject.password = passwordResult;

        authObject.save();

    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

}


