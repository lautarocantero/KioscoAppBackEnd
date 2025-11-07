import Validation from './validation';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
import DBLocal from 'db-local';
import { AuthBaseType, AuthPublic, AuthTokenInterface, AuthTokenPublic } from '../typings/auth/authTypes';

const { Schema } = new DBLocal({ path: './db'});

// prueba de mi script de guardado

const Auth = Schema('Auth', {
    _id: { type: String, required: true},
    username: { type: String, required: true},
    password: { type: String, required: true},
    refreshToken: { type: String, required: false},
});

export class AuthModel {

    static async create ({username, password}: {username: unknown, password: unknown}) : Promise<string> {
        Validation.username(username);
        Validation.password(password);
        
        const auth = Auth.findOne({ username });
        if(auth) throw new Error('username already exists');

        const id = crypto.randomUUID();

        const hashedPassword = await bcrypt.hash(password as string, SALT_ROUNDS);

        Auth.create({
            _id: id,
            username,
            password: hashedPassword,
        }).save();

        return id;
    }

    // Busca el usuario, si lo encuentra y la contra coincide, devuelo los datos del usuario

    static async login ({username, password} : {username: unknown, password: unknown} ) : Promise<AuthPublic> {
        Validation.username(username);
        Validation.password(password);

        const user = Auth.findOne({username});
        if(!user) throw new Error('username does not exist');

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
    

}


