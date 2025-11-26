import Validation from './validation';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import { AuthBaseType, AuthPublic, AuthTokenInterface, AuthTokenPublic } from '../typings/auth/authTypes';
import { Auth } from '../schemas/authSchema';

export class AuthModel {

    static async create ({username,email, password, repeatPassword}: {username: unknown,email: unknown, password: unknown , repeatPassword: unknown}) : Promise<string> {
        Validation.username(username);
        Validation.email(email);
        Validation.password(password);
        Validation.password(repeatPassword);
        
        const auth = Auth.findOne({ username });
        if(auth) throw new Error('username already exists');

        const _id = crypto.randomUUID();

        const hashedPassword = await bcrypt.hash(password as string, SALT_ROUNDS);

        Auth.create({
            _id:
            username,
            password: hashedPassword,
            email,
        }).save(); //save hace que se guarde en la dblocal

        return _id as string;
    }

    static async login ({email, password} : {email: unknown, password: unknown} ) : Promise<AuthPublic> {
        Validation.email(email);
        Validation.password(password);
        
        const user = Auth.findOne({email});
        if(!user) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(password as string, user.password as string);
        if(!isValid) throw new Error('password is invalid');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password:_password,  save:_save , ...publicUser  } = user as AuthBaseType;
        return publicUser as AuthPublic;
    }

    static async saveRefreshToken({userId, token}: AuthTokenInterface): Promise<void> {
        const user = Auth.findOne({_id: userId});
        if(!user) throw new Error('User not found');

        user.refreshToken = token;
        user.save();
    }

    /**
    Busca el token público de refresco para un usuario dado.
    Devuelve undefined si el usuario no existe o no tiene token.
    */

    static async getRefreshToken (userId : string): Promise <AuthTokenPublic | undefined> {
        const { refreshToken } : { refreshToken: string} = Auth.findOne({ _id: userId }) as AuthBaseType;
        
        if( !refreshToken)
            return undefined;

        if (typeof refreshToken !== 'string')
            return undefined;

        return {refreshToken} as  AuthTokenPublic;
    }

    /**
        Busca un usuario con un id dado e intenta borrar el refresh token.
        Devuelve undefined si no lo encuentra o si ya se borro, si lo encuentra borra el token
    */

    static async deleteRefreshToken (userId: string) : Promise<void | undefined > {
        const user: AuthBaseType = Auth.findOne({ _id: userId});

        if(!user) return undefined;

        if(!user.refreshToken) return undefined;

        user.update(
            { id: user.id }, //buscar
            { refreshToken: null } //actualizar
        );
    }

    static async chechAuth (id: string): Promise<void | undefined> {
        const user: AuthBaseType = Auth.findOne({ _id: id});
        if(!user) return undefined;

        if(!user.refreshToken) return undefined;

        return user;
    }
    

}


