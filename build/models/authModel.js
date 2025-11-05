"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModel = void 0;
const validation_1 = __importDefault(require("./validation"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
const db_local_1 = __importDefault(require("db-local"));
const { Schema } = new db_local_1.default({ path: './db' });
const Auth = Schema('Auth', {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    refreshToken: { type: String, required: false },
});
class AuthModel {
    static create(_a) {
        return __awaiter(this, arguments, void 0, function* ({ username, password }) {
            validation_1.default.username(username);
            validation_1.default.password(password);
            const auth = Auth.findOne({ username });
            if (auth)
                throw new Error('username already exists');
            const id = crypto.randomUUID();
            const hashedPassword = yield bcrypt_1.default.hash(password, config_1.SALT_ROUNDS);
            Auth.create({
                _id: id,
                username,
                password: hashedPassword,
            }).save();
            return id;
        });
    }
    static login(_a) {
        return __awaiter(this, arguments, void 0, function* ({ username, password }) {
            validation_1.default.username(username);
            validation_1.default.password(password);
            const user = Auth.findOne({ username });
            if (!user)
                throw new Error('username does not exist');
            const isValid = yield bcrypt_1.default.compare(password, user.password);
            if (!isValid)
                throw new Error('password is invalid');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _b = user, { password: _password, save: _save } = _b, publicUser = __rest(_b, ["password", "save"]);
            return publicUser;
        });
    }
    static saveRefreshToken(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, token }) {
            const user = Auth.findOne({ _id: userId });
            if (!user)
                throw new Error('User not found');
            user.refreshToken = token;
            user.save();
        });
    }
}
exports.AuthModel = AuthModel;
