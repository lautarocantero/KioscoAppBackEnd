import DBLocal from 'db-local';

const { Schema } = new DBLocal({ path: './db'});

export const Auth = Schema('Auth', {
    _id: { type: String, required: true},
    username: { type: String, required: true},
    email: { type: String, required: true},
    password: { type: String, required: true},
    refreshToken: { type: String, required: false},
});