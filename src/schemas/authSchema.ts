import DBLocal from 'db-local';
import { AuthSchemaType } from '../typings/auth/authTypes';

const { Schema } = new DBLocal({ path: './db'});

export const AuthSchema = Schema<AuthSchemaType>('Auth', {
    _id: { type: String, required: true},
    username: { type: String, required: true},
    email: { type: String, required: true},
    password: { type: String, required: true},
    refreshToken: { type: String, required: false},
});