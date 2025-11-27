import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import { AuthSchema } from '../schemas/authSchema';
import { Validation } from './validation';
import { Auth, AuthCheckAuthPayload, AuthLoginPayload, AuthModelType, AuthPublic, AuthRefreshTokenPayload, AuthRegisterPayload, AuthTokenPublic } from '../typings/auth/authTypes';

export class AuthModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
/**
Busca el token público de refresco para un usuario dado.
Devuelve undefined si el usuario no existe o no tiene token.
*/
    static async getRefreshToken (data : AuthRefreshTokenPayload): Promise <AuthTokenPublic> {
        const { _id } = data;

        const idResult: string = Validation.stringValidation(_id, '_id');

        const { refreshToken } : AuthTokenPublic = AuthSchema.findOne({ _id: idResult });

        if( !refreshToken) throw new Error("Missing refresh token in cookies");

        if (typeof refreshToken !== 'string') throw new Error("Refresh token is not a string");

        return { refreshToken } as  AuthTokenPublic;
    }

    static async checkAuth (data: AuthCheckAuthPayload): Promise<Auth> {
        const { _id } = data;

        const idResult: string = Validation.stringValidation(_id, '_id');

        const user: Auth = AuthSchema.findOne({ _id: idResult});

        if(!user) throw new Error('User not found');

        if(!user.refreshToken) throw new Error('Missing refresh token in cookies');

        return user as Auth;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: AuthRegisterPayload) : Promise<string> {
        const { username, email, password, repeatPassword} = data;

        const usernameResult: string = Validation.stringValidation(username, 'username');
        const emailResult: string = Validation.email(email);
        const passwordResult: string = Validation.password(password);
        Validation.password(repeatPassword);
        
        const auth: Auth = AuthSchema.findOne({ username: usernameResult });

        if(auth) throw new Error('username already exists');

        const _id: string = crypto.randomUUID();

        const hashedPassword: string = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        AuthSchema.create({
            _id,
            username: usernameResult,
            email: emailResult,
            password: hashedPassword as string,
            refreshToken: '' as string,
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

    static async login (data: AuthLoginPayload) : Promise<AuthPublic> {
        const { email, password } = data;

        const emailResult: string = Validation.email(email);
        const passwordResult: string = Validation.password(password);
        
        const user: Auth = AuthSchema.findOne({email: emailResult});
        if(!user) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(passwordResult, user.password as string);
        if(!isValid) throw new Error('password is invalid');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password:_password , refreshToken:_refreshToken, ...publicUser  } = user as Auth;

        return publicUser as AuthPublic;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async saveRefreshToken(data : AuthRefreshTokenPayload): Promise<void> {
        const {_id, token} = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const tokenResult: string = Validation.stringValidation(token, 'token');

        const user: AuthModelType = AuthSchema.findOne({_id: _idResult});
        if(!user) throw new Error('User not found');

        user.refreshToken = tokenResult;
        user.save();
    }

    /**
        Busca un usuario con un id dado e intenta borrar el refresh token.
        Devuelve undefined si no lo encuentra o si ya se borro, si lo encuentra borra el token
    */

    static async deleteRefreshToken (data : AuthRefreshTokenPayload) : Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const user: AuthModelType = AuthSchema.findOne({ _id: _idResult });

        if(!user) throw new Error('User not found');

        if(!user.refreshToken) throw new Error('Missing refresh token in cookies');

        user.save(
            { _id: user._id }, //buscar
            { refreshToken: undefined } //actualizar
        );
    }

}


