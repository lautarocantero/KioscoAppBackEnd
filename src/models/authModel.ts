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

        Validation.stringValidation(_id, '_id');

        const { refreshToken } : AuthTokenPublic = AuthSchema.findOne({ _id: _id });

        if( !refreshToken) throw new Error("Missing refresh token in cookies");

        if (typeof refreshToken !== 'string') throw new Error("Refresh token is not a string");

        return { refreshToken } as  AuthTokenPublic;
    }

    static async checkAuth (data: AuthCheckAuthPayload): Promise<Auth> {
        const { _id } = data;

        Validation.stringValidation(_id, '_id');

        const user: Auth = AuthSchema.findOne({ _id: _id});

        if(!user) throw new Error('User not found');

        if(!user.refreshToken) throw new Error('Missing refresh token in cookies');

        return user as Auth;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: AuthRegisterPayload) : Promise<string> {
        const { username, email, password, repeatPassword} = data;

        Validation.stringValidation(username, 'username');
        Validation.email(email);
        Validation.password(password);
        Validation.password(repeatPassword);
        
        const auth: Auth = AuthSchema.findOne({ username });

        if(auth) throw new Error('username already exists');

        const _id = crypto.randomUUID();

        const hashedPassword = await bcrypt.hash(password as string, SALT_ROUNDS);

        AuthSchema.create({
            _id: _id as string,
            username: username as string,
            email: email as string,
            password: hashedPassword as string,
            refreshToken: '' as string,
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

    static async login (data: AuthLoginPayload) : Promise<AuthPublic> {
        const { email, password } = data;

        Validation.email(email);
        Validation.password(password);
        
        const user: Auth = AuthSchema.findOne({email});
        if(!user) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(password as string, user.password as string);
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

        Validation.stringValidation(_id, '_id');
        Validation.stringValidation(token, 'token');

        const user: AuthModelType = AuthSchema.findOne({_id: _id});
        if(!user) throw new Error('User not found');

        user.refreshToken = token as string;
        user.save();
    }
    

    /**
        Busca un usuario con un id dado e intenta borrar el refresh token.
        Devuelve undefined si no lo encuentra o si ya se borro, si lo encuentra borra el token
    */

    static async deleteRefreshToken (data : AuthRefreshTokenPayload) : Promise<void> {
        const { _id } = data;

        Validation.stringValidation(_id, '_id');

        const user: AuthModelType = AuthSchema.findOne({ _id: _id});

        if(!user) throw new Error('User not found');

        if(!user.refreshToken) throw new Error('Missing refresh token in cookies');

        user.save(
            { _id: user._id }, //buscar
            { refreshToken: undefined } //actualizar
        );
    }

}


