import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import { AuthBaseType, AuthLogin, AuthPublic, AuthRefreshTokenType, AuthRegister, AuthTokenInterface, AuthTokenPublic, ChechAuthType, DocumentAuth } from '../typings/auth/authTypes';
import { AuthSchema } from '../schemas/authSchema';
import { Validation } from './validation';

export class AuthModel {

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
/**
Busca el token público de refresco para un usuario dado.
Devuelve undefined si el usuario no existe o no tiene token.
*/
    static async getRefreshToken (data : AuthRefreshTokenType): Promise <AuthTokenPublic> {
        const { userId } = data;

        Validation.stringValidation(userId, 'userId');

        const { refreshToken } : { refreshToken: string} = AuthSchema.findOne({ _id: userId }) as AuthBaseType;

        if( !refreshToken) throw new Error("Missing refresh token in cookies");

        if (typeof refreshToken !== 'string') throw new Error("Refresh token is not a string");

        return { refreshToken } as  AuthTokenPublic;
    }

    static async chechAuth (data: ChechAuthType): Promise<AuthBaseType> {
        const { _id } = data;

        Validation.stringValidation(_id, '_id');

        const user: AuthBaseType = AuthSchema.findOne({ _id: _id});

        if(!user) throw new Error('User not found');

        if(!user.refreshToken) throw new Error('Missing refresh token in cookies');

        return user as AuthBaseType;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async create (data: AuthRegister) : Promise<string> {
        const { username, email, password, repeatPassword} = data;

        Validation.stringValidation(username, 'username');
        Validation.email(email);
        Validation.password(password);
        Validation.password(repeatPassword);
        
        const auth: DocumentAuth = AuthSchema.findOne({ username });

        if(auth) throw new Error('username already exists');

        const _id = crypto.randomUUID();

        const hashedPassword = await bcrypt.hash(password as string, SALT_ROUNDS);

        AuthSchema.create({
            _id: _id as string,
            username: username as string,
            email: email as string,
            password: hashedPassword as string,
            authToken: '' as string,
            repeatPassword: '' as string,
            refreshToken: '' as string,
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

    static async login (data: AuthLogin) : Promise<AuthPublic> {
        const { email, password } = data;

        Validation.email(email);
        Validation.password(password);
        
        const user: DocumentAuth = AuthSchema.findOne({email});
        if(!user) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(password as string, user.password as string);
        if(!isValid) throw new Error('password is invalid');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password:_password,  save:_save , ...publicUser  } = user as AuthBaseType;

        return publicUser as AuthPublic;
    }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async saveRefreshToken(data : AuthTokenInterface): Promise<void> {
        const {userId, token} = data;

        Validation.stringValidation(userId, 'userId');
        Validation.stringValidation(token, 'token');

        const user = AuthSchema.findOne({_id: userId});
        if(!user) throw new Error('User not found');

        user.refreshToken = token;
        user.save();
    }
    

    /**
        Busca un usuario con un id dado e intenta borrar el refresh token.
        Devuelve undefined si no lo encuentra o si ya se borro, si lo encuentra borra el token
    */

    static async deleteRefreshToken (data : AuthRefreshTokenType) : Promise<void> {
        const { userId } = data;

        Validation.stringValidation(userId, 'userId');

        const user: AuthBaseType = AuthSchema.findOne({ _id: userId});

        if(!user) throw new Error('User not found');

        if(!user.refreshToken) throw new Error('Missing refresh token in cookies');

        user.update(
            { id: user.id }, //buscar
            { refreshToken: null } //actualizar
        );
    }

}


