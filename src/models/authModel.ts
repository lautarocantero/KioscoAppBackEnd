import Validation from './validation';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import DBLocal from 'db-local';
import { AuthBaseType, AuthPublic, AuthTokenInterface } from '../typings/auth/authTypes';

const { Schema } = new DBLocal({ path: './db'});

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

}


