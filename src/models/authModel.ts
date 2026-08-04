import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import { AuthSchema } from '../schemas/authSchema';
import { Validation } from './validation';
import crypto from 'crypto';
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
    AuthGoogleLoginPayload,
    RequestPasswordResetPayload,
    ResetPasswordPayload,
    VerifyEmailPayload,
} from '../typings/auth';
import { AuthRoleEnum } from '../typings/auth/enums';

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
    ║ ⚙️ Proceso: valida, verifica duplicados, hashea password,  ║
    ║    genera token de verificación, asigna role por default    ║
    ║    (Usuario) y guarda                                        ║
    ║ 📤 Salida: { _id, verificationToken }                        ║
    ╚══════════════════════════════════╝*/

    static async create(data: AuthRegisterPayload): Promise<{ _id: string; verificationToken: string }> {
        const { username, email, password, repeatPassword, profilePhoto } = data;

        const usernameResult: string = Validation.stringValidation(username, 'username');
        const emailResult: string    = Validation.email(email);
        const passwordResult: string = Validation.password(password);
        Validation.password(repeatPassword);
        const profileResult: string  = profilePhoto ? Validation.image(profilePhoto) : '';

        const existing = await AuthSchema.findOne({
            $or: [{ username: usernameResult }, { email: emailResult }],
        }).lean();

        if (existing) {
            if (existing.username === usernameResult) throw new Error('username already exists');
            if (existing.email === emailResult) throw new Error('email already exists');
        }

        const _id: string = crypto.randomUUID();
        const hashedPassword: string = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        // TODO(email-verification): reactivar generación de verificationToken
        // cuando se pague Resend. Mientras tanto no hay forma de verificar el
        // mail, así que el usuario se crea ya verificado.
        // const verificationToken: string = crypto.randomBytes(32).toString('hex');
        // const verificationTokenExpires: Date = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await AuthSchema.create({
            _id,
            username:     usernameResult,
            email:        emailResult,
            password:     hashedPassword,
            refreshToken: '',
            profilePhoto: profileResult,
            role:         AuthRoleEnum.Usuario,
            isVerified:   true, // TODO(email-verification): volver a `false` cuando se reactive el flujo
            // verificationToken,
            // verificationTokenExpires,
        });

        return { _id, verificationToken: '' };
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

        // TODO(email-verification): reactivar cuando se pague Resend.
        // if (!authObject.isVerified) throw new Error('Please verify your email before logging in');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, refreshToken: _refreshToken, ...publicUser } = authObject as AuthSchemaType;
        return publicUser as AuthPublic;
    }


    /*══════════ 🎮 loginOrCreateWithGoogle ══════════╗
    ║ 📥 Entrada: AuthGoogleLoginPayload {email, username, profilePhoto} ║
    ║ ⚙️ Proceso: busca por email; si no existe, crea usuario nuevo      ║
    ║    con password random hasheada (nunca se usa para login manual)   ║
    ║ 📤 Salida: AuthPublic                                               ║
    ╚══════════════════════════════════════════════════════════════════╝*/

    static async loginOrCreateWithGoogle(data: AuthGoogleLoginPayload): Promise<AuthPublic> {
        const { email, username, profilePhoto } = data;

        const emailResult: string = Validation.email(email);

        const existing = await AuthSchema.findOne({ email: emailResult }).lean();

        if (existing) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _password, refreshToken: _refreshToken, ...publicUser } = existing as AuthSchemaType;
            return publicUser as AuthPublic;
        }

        const _id: string = crypto.randomUUID();
        const randomPassword: string = crypto.randomUUID();
        const hashedPassword: string = await bcrypt.hash(randomPassword, SALT_ROUNDS);

        await AuthSchema.create({
            _id,
            username:     username,
            email:        emailResult,
            password:     hashedPassword,
            refreshToken: '',
            profilePhoto: profilePhoto ?? '',
            role:         AuthRoleEnum.Usuario,
        });

        const created = await AuthSchema.findOne({ _id }).lean();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, refreshToken: _refreshToken, ...publicUser } = created as AuthSchemaType;
        return publicUser as AuthPublic;
    }

    /*══════════ 🎮 requestPasswordReset ══════════╗
    ║ 📥 Entrada: RequestPasswordResetPayload {email} ║
    ║ ⚙️ Proceso: busca user por email, genera token, ║
    ║    guarda con expiración de 1hs                  ║
    ║ 📤 Salida: {username, resetToken} | null          ║
    ╚═══════════════════════════════════════════════╝*/

    static async requestPasswordReset(data: RequestPasswordResetPayload): Promise<{ username: string; resetToken: string } | null> {
        const { email } = data;

        const emailResult: string = Validation.email(email);

        const user = await AuthSchema.findOne({ email: emailResult }).lean();

        // No revelamos si el email existe o no: devolvemos null silenciosamente
        // y el controller responde siempre el mismo mensaje genérico.
        if (!user) return null;

        const resetToken: string = crypto.randomBytes(32).toString('hex');
        const resetPasswordTokenExpires: Date = new Date(Date.now() + 60 * 60 * 1000); // 1hs

        await AuthSchema.findOneAndUpdate(
            { _id: user._id },
            { $set: { resetPasswordToken: resetToken, resetPasswordTokenExpires } },
        );

        return { username: user.username as string, resetToken };
    }

    /*══════════ 🎮 resetPassword ══════════╗
    ║ 📥 Entrada: ResetPasswordPayload {token,newPassword,repeatNewPassword} ║
    ║ ⚙️ Proceso: valida token+expiración, valida password, ║
    ║    hashea y guarda, limpia token e invalida sesión     ║
    ║ 📤 Salida: void                                        ║
    ╚══════════════════════════════════════════════════════╝*/

    static async resetPassword(data: ResetPasswordPayload): Promise<void> {
        const { token, newPassword, repeatNewPassword } = data;

        const tokenResult: string = Validation.stringValidation(token, 'token');
        const passwordResult: string = Validation.password(newPassword);
        Validation.password(repeatNewPassword);

        if (newPassword !== repeatNewPassword) throw new Error('Passwords do not match');

        const user = await AuthSchema.findOne({ resetPasswordToken: tokenResult }).lean();
        if (!user) throw new Error('Invalid reset token');

        if (!user.resetPasswordTokenExpires || user.resetPasswordTokenExpires < new Date()) {
            throw new Error('Reset token has expired');
        }

        const hashedPassword: string = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        await AuthSchema.findOneAndUpdate(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                // Invalidamos el refreshToken existente: si alguien más tenía sesión abierta,
                // se cierra al cambiar la password. Buena práctica de seguridad.
                $unset: { resetPasswordToken: '', resetPasswordTokenExpires: '', refreshToken: '' },
            },
        );
    }

    /*══════════ 🎮 verifyEmail ══════════╗
    ║ 📥 Entrada: VerifyEmailPayload {token}         ║
    ║ ⚙️ Proceso: busca por token, valida expiración, ║
    ║    marca isVerified y limpia el token           ║
    ║ 📤 Salida: void                                 ║
    ╚═════════════════════════════════════════════════╝*/

    static async verifyEmail(data: VerifyEmailPayload): Promise<void> {
        const { token } = data;

        const tokenResult: string = Validation.stringValidation(token, 'token');

        const user = await AuthSchema.findOne({ verificationToken: tokenResult }).lean();
        if (!user) throw new Error('Invalid verification token');

        if (user.isVerified) throw new Error('Email is already verified');

        if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
            throw new Error('Verification token has expired');
        }

        await AuthSchema.findOneAndUpdate(
            { _id: user._id },
            {
                $set: { isVerified: true },
                $unset: { verificationToken: '', verificationTokenExpires: '' },
            },
        );
    }

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