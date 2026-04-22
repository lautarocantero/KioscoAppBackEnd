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
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
const authSchema_1 = require("../schemas/authSchema");
const validation_1 = require("./validation");
/*──────────────────────────────
🔐 AuthModel — Mongoose
──────────────────────────────
📜 Propósito: Autenticación y gestión de usuarios contra MongoDB
🧩 Dependencias: bcrypt, SALT_ROUNDS, AuthSchema, Validation, authTypes
──────────────────────────────*/
class AuthModel {
    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    /*══════════ 🎮 getRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id} ║
    ║ ⚙️ Proceso: valida id y busca refreshToken ║
    ║ 📤 Salida: AuthTokenPublic {refreshToken}  ║
    ╚══════════════════════════════════════════╝*/
    static getRefreshToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const idResult = validation_1.Validation.stringValidation(_id, '_id');
            const user = yield authSchema_1.AuthSchema.findOne({ _id: idResult }).lean();
            if (!user)
                throw new Error('User not found');
            const { refreshToken } = user;
            if (!refreshToken)
                throw new Error('Missing refresh token in cookies');
            if (typeof refreshToken !== 'string')
                throw new Error('Refresh token is not a string');
            return { refreshToken };
        });
    }
    /*══════════ 🎮 checkAuth ══════════╗
    ║ 📥 Entrada: AuthCheckAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id, busca usuario,   ║
    ║    elimina password y refreshToken      ║
    ║ 📤 Salida: AuthPublicSchema             ║
    ╚═════════════════════════════════════════╝*/
    static checkAuth(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const idResult = validation_1.Validation.stringValidation(_id, '_id');
            const authObject = yield authSchema_1.AuthSchema.findOne({ _id: idResult }).lean();
            if (!authObject)
                throw new Error('User not found');
            if (!authObject.refreshToken)
                throw new Error('Missing refresh token in cookies');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _a = authObject, { password: _password, refreshToken: _refreshToken } = _a, publicAuth = __rest(_a, ["password", "refreshToken"]);
            return publicAuth;
        });
    }
    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: AuthRegisterPayload ║
    ║ ⚙️ Proceso: valida, verifica duplicados, hashea password y guarda ║
    ║ 📤 Salida: string _id generado  ║
    ╚══════════════════════════════════╝*/
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, email, password, repeatPassword, profilePhoto } = data;
            const usernameResult = validation_1.Validation.stringValidation(username, 'username');
            const emailResult = validation_1.Validation.email(email);
            const passwordResult = validation_1.Validation.password(password);
            validation_1.Validation.password(repeatPassword);
            const profileResult = profilePhoto ? validation_1.Validation.image(profilePhoto) : '';
            const existing = yield authSchema_1.AuthSchema.findOne({ username: usernameResult }).lean();
            if (existing)
                throw new Error('username already exists');
            const _id = crypto.randomUUID();
            const hashedPassword = yield bcrypt_1.default.hash(passwordResult, config_1.SALT_ROUNDS);
            yield authSchema_1.AuthSchema.create({
                _id,
                username: usernameResult,
                email: emailResult,
                password: hashedPassword,
                refreshToken: '',
                profilePhoto: profileResult,
            });
            return _id;
        });
    }
    /*══════════ 🎮 login ══════════╗
    ║ 📥 Entrada: AuthLoginPayload {email,password} ║
    ║ ⚙️ Proceso: valida credenciales con bcrypt    ║
    ║ 📤 Salida: AuthPublic                         ║
    ╚═══════════════════════════════════════════════╝*/
    static login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = data;
            const emailResult = validation_1.Validation.email(email);
            const authObject = yield authSchema_1.AuthSchema.findOne({ email: emailResult }).lean();
            if (!authObject)
                throw new Error('email does not exist');
            const isValid = yield bcrypt_1.default.compare(password, authObject.password);
            if (!isValid)
                throw new Error('Password is incorrect. Make sure caps lock is off and try again.');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _a = authObject, { password: _password, refreshToken: _refreshToken } = _a, publicUser = __rest(_a, ["password", "refreshToken"]);
            return publicUser;
        });
    }
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    /*══════════ 🎮 deleteAuth ══════════╗
    ║ 📥 Entrada: DeleteAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina usuario ║
    ║ 📤 Salida: void                        ║
    ╚═══════════════════════════════════════╝*/
    static deleteAuth(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const deleted = yield authSchema_1.AuthSchema.findOneAndDelete({ _id: _idResult });
            if (!deleted)
                throw new Error('User not found');
        });
    }
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
    /*══════════ 🎮 saveRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id,token} ║
    ║ ⚙️ Proceso: valida id y token, guarda refreshToken ║
    ║ 📤 Salida: void                                ║
    ╚═══════════════════════════════════════════════╝*/
    static saveRefreshToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, token } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const tokenResult = validation_1.Validation.stringValidation(token, 'token');
            const updated = yield authSchema_1.AuthSchema.findOneAndUpdate({ _id: _idResult }, { $set: { refreshToken: tokenResult } });
            if (!updated)
                throw new Error('User not found');
        });
    }
    /*══════════ 🎮 deleteRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id}   ║
    ║ ⚙️ Proceso: valida id, borra refreshToken   ║
    ║ 📤 Salida: void                             ║
    ╚════════════════════════════════════════════╝*/
    static deleteRefreshToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const authObject = yield authSchema_1.AuthSchema.findOne({ _id: _idResult });
            if (!authObject)
                throw new Error('User not found');
            if (!authObject.refreshToken)
                throw new Error('Missing refresh token in cookies');
            yield authSchema_1.AuthSchema.findOneAndUpdate({ _id: _idResult }, { $unset: { refreshToken: '' } });
        });
    }
    /*══════════ 🎮 editAuth ══════════╗
    ║ 📥 Entrada: EditAuthPayload      ║
    ║ ⚙️ Proceso: valida campos y actualiza usuario ║
    ║ 📤 Salida: void                  ║
    ╚══════════════════════════════════╝*/
    static editAuth(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, username, profilePhoto, email, password } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const userNameResult = validation_1.Validation.stringValidation(username, 'username');
            const profileResult = validation_1.Validation.stringValidation(profilePhoto, 'profile photo');
            const emailResult = validation_1.Validation.email(email);
            const passwordResult = validation_1.Validation.password(password);
            const updated = yield authSchema_1.AuthSchema.findOneAndUpdate({ _id: _idResult }, { $set: {
                    username: userNameResult,
                    email: emailResult,
                    profilePhoto: profileResult,
                    password: passwordResult,
                } });
            if (!updated)
                throw new Error('User not found');
        });
    }
}
exports.AuthModel = AuthModel;
