import Validation from './validation';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config';
//@ts-ignore
import DBLocal from 'db-local';

const { Schema } = new DBLocal({ path: './db'});

const Auth = Schema('Auth', {
    //campos //type //required
    _id: { type: String, required: true},
    username: { type: String, required: true},
    password: { type: String, required: true},
    refreshToken: { type: String, required: false},
})

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
}


