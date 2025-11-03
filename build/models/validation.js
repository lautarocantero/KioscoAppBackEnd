"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isString = (string) => {
    if (typeof string !== 'string')
        return false;
    return true;
};
const isShortString = (string) => {
    if (string.length < 3)
        return true;
    return false;
};
class Validation {
    static username(username) {
        if (!isString(username))
            throw new Error(`username must be a string ${username}`);
        if (isShortString(username))
            throw new Error('username must be at least 3 characters long');
    }
    static password(password) {
        if (!isString(password))
            throw new Error('password must be a string');
        if (isShortString(password))
            throw new Error('password must be at least 3 characters long');
    }
}
exports.default = Validation;
