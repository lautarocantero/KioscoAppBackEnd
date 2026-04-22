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
    AuthRefreshTokenPayload,
    DeleteAuthPayload, 
    EditAuthPayload,
    AuthPublicSchema,
} from '@typings/auth';

/*──────────────────────────────
🔐 AuthModel — Mongoose
──────────────────────────────
📜 Propósito: Autenticación y gestión de usuarios contra MongoDB
🧩 Dependencias: bcrypt, SALT_ROUNDS, AuthSchema, Validation, authTypes
──────────────────────────────*/

export class AuthModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id} ║
    ║ ⚙️ Proceso: valida id y busca refreshToken ║
    ║ 📤 Salida: AuthTokenPublic {refreshToken}  ║
    ╚══════════════════════════════════════════╝*/

    static async getRefreshToken(data: AuthRefreshTokenPayload): Promise<AuthTokenPublic> {
        const { _id } = data;

        const idResult: string = Validation.stringValidation(_id, '_id');

        const user = await AuthSchema.findOne({ _id: idResult }).lean();

        if (!user) throw new Error('User not found');

        const { refreshToken } = user as AuthSchemaType;

        if (!refreshToken) throw new Error('Missing refresh token in cookies');

        if (typeof refreshToken !== 'string') throw new Error('Refresh token is not a string');

        return { refreshToken } as AuthTokenPublic;
    }

    /*══════════ 🎮 checkAuth ══════════╗
    ║ 📥 Entrada: AuthCheckAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id, busca usuario,   ║
    ║    elimina password y refreshToken      ║
    ║ 📤 Salida: AuthPublicSchema             ║
    ╚═════════════════════════════════════════╝*/

    static async checkAuth(data: AuthCheckAuthPayload): Promise<AuthPublicSchema> {
        const { _id } = data;

        const idResult: string = Validation.stringValidation(_id, '_id');

        const authObject = await AuthSchema.findOne({ _id: idResult }).lean();

        if (!authObject) throw new Error('User not found');

        if (!authObject.refreshToken) throw new Error('Missing refresh token in cookies');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, refreshToken: _refreshToken, ...publicAuth } = authObject as AuthSchemaType;

        return publicAuth as AuthPublicSchema;
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: AuthRegisterPayload ║
    ║ ⚙️ Proceso: valida, verifica duplicados, hashea password y guarda ║
    ║ 📤 Salida: string _id generado  ║
    ╚══════════════════════════════════╝*/

    static async create(data: AuthRegisterPayload): Promise<string> {
        const { username, email, password, repeatPassword, profilePhoto } = data;

        const usernameResult: string = Validation.stringValidation(username, 'username');
        const emailResult: string    = Validation.email(email);
        const passwordResult: string = Validation.password(password);
        Validation.password(repeatPassword);
        const profileResult: string  = profilePhoto ? Validation.image(profilePhoto) : '';

        const existing = await AuthSchema.findOne({ username: usernameResult }).lean();
        if (existing) throw new Error('username already exists');

        const _id: string = crypto.randomUUID();
        const hashedPassword: string = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        await AuthSchema.create({
            _id,
            username:     usernameResult,
            email:        emailResult,
            password:     hashedPassword,
            refreshToken: '',
            profilePhoto: profileResult,
        });

        return _id;
    }

    /*══════════ 🎮 login ══════════╗
    ║ 📥 Entrada: AuthLoginPayload {email,password} ║
    ║ ⚙️ Proceso: valida credenciales con bcrypt    ║
    ║ 📤 Salida: AuthPublic                         ║
    ╚═══════════════════════════════════════════════╝*/

    static async login(data: AuthLoginPayload): Promise<AuthPublic> {
        const { email, password } = data;

        const emailResult: string = Validation.email(email);

        const authObject = await AuthSchema.findOne({ email: emailResult }).lean();
        if (!authObject) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(password as string, authObject.password as string);
        if (!isValid) throw new Error('Password is incorrect. Make sure caps lock is off and try again.');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, refreshToken: _refreshToken, ...publicUser } = authObject as AuthSchemaType;
        return publicUser as AuthPublic;
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 deleteAuth ══════════╗
    ║ 📥 Entrada: DeleteAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina usuario ║
    ║ 📤 Salida: void                        ║
    ╚═══════════════════════════════════════╝*/

    static async deleteAuth(data: DeleteAuthPayload): Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const deleted = await AuthSchema.findOneAndDelete({ _id: _idResult });

        if (!deleted) throw new Error('User not found');
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    /*══════════ 🎮 saveRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id,token} ║
    ║ ⚙️ Proceso: valida id y token, guarda refreshToken ║
    ║ 📤 Salida: void                                ║
    ╚═══════════════════════════════════════════════╝*/

    static async saveRefreshToken(data: AuthRefreshTokenPayload): Promise<void> {
        const { _id, token } = data;

        const _idResult: string    = Validation.stringValidation(_id, '_id');
        const tokenResult: string  = Validation.stringValidation(token, 'token');

        const updated = await AuthSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: { refreshToken: tokenResult } },
        );

        if (!updated) throw new Error('User not found');
    }

    /*══════════ 🎮 deleteRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id}   ║
    ║ ⚙️ Proceso: valida id, borra refreshToken   ║
    ║ 📤 Salida: void                             ║
    ╚════════════════════════════════════════════╝*/

    static async deleteRefreshToken(data: AuthRefreshTokenPayload): Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const authObject = await AuthSchema.findOne({ _id: _idResult });
        if (!authObject) throw new Error('User not found');
        if (!authObject.refreshToken) throw new Error('Missing refresh token in cookies');

        await AuthSchema.findOneAndUpdate(
            { _id: _idResult },
            { $unset: { refreshToken: '' } },
        );
    }

    /*══════════ 🎮 editAuth ══════════╗
    ║ 📥 Entrada: EditAuthPayload      ║
    ║ ⚙️ Proceso: valida campos y actualiza usuario ║
    ║ 📤 Salida: void                  ║
    ╚══════════════════════════════════╝*/

    static async editAuth(data: EditAuthPayload): Promise<void> {
        const { _id, username, profilePhoto, email, password } = data;

        const _idResult: string      = Validation.stringValidation(_id, '_id');
        const userNameResult: string = Validation.stringValidation(username, 'username');
        const profileResult: string  = Validation.stringValidation(profilePhoto, 'profile photo');
        const emailResult: string    = Validation.email(email);
        const passwordResult: string = Validation.password(password);

        const updated = await AuthSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: {
                username:     userNameResult,
                email:        emailResult,
                profilePhoto: profileResult,
                password:     passwordResult,
            }},
        );

        if (!updated) throw new Error('User not found');
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
}