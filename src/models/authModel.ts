import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import { AuthSchema } from '../schemas/authSchema';
import { Validation } from './validation';
import { AuthCheckAuthPayload, AuthLoginPayload, AuthModelType, AuthPublic, AuthPublicSchema, AuthRefreshTokenPayload, AuthRegisterPayload, AuthSchemaType, AuthTokenPublic, DeleteAuthPayload, EditAuthPayload } from '../typings/auth/authTypes';

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

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async deleteAuth(data: DeleteAuthPayload): Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const authObject: AuthModelType = AuthSchema.findOne({_id: _idResult});

        if(!authObject) throw new Error('User not found');

        authObject.remove();
    }
/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

    static async saveRefreshToken(data : AuthRefreshTokenPayload): Promise<void> {
        const {_id, token} = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const tokenResult: string = Validation.stringValidation(token, 'token');

        const authObject: AuthModelType = AuthSchema.findOne({_id: _idResult});
        if(!authObject) throw new Error('User not found');

        authObject.refreshToken = tokenResult;
        authObject.save();
    }

    /**
        Busca un usuario con un id dado e intenta borrar el refresh token.
        Devuelve undefined si no lo encuentra o si ya se borro, si lo encuentra borra el token
    */

    static async deleteRefreshToken (data : AuthRefreshTokenPayload) : Promise<void> {
        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const authObject: AuthModelType = AuthSchema.findOne({ _id: _idResult });

        if(!authObject) throw new Error('User not found');

        if(!authObject.refreshToken) throw new Error('Missing refresh token in cookies');

        authObject.refreshToken = undefined;
        authObject.save();
    }

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

}


