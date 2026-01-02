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
🔐 AuthModel
──────────────────────────────
📜 Propósito: Autenticación y gestión de usuarios
🧩 Dependencias: bcrypt, SALT_ROUNDS, AuthSchema, Validation, authTypes
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Hash de contraseñas con bcrypt + SALT_ROUNDS
   - Nunca devolver password ni refreshToken
   - Validaciones estrictas en todos los campos
──────────────────────────────*/
/*──────────────────────────────
📚 Tipos usados en Auth
──────────────────────────────
- AuthRegisterPayload: datos para registro
- AuthLoginPayload: credenciales de login
- AuthPublic: usuario sin datos sensibles
- AuthPublicSchema: usuario público validado
- AuthTokenPublic: objeto con refreshToken
- AuthSchemaType: documento completo en BD
- AuthModelType: instancia del modelo en BD
- AuthCheckAuthPayload: payload para validar usuario
- AuthRefreshTokenPayload: payload para manejar refreshToken
- DeleteAuthPayload: payload para eliminar usuario
- EditAuthPayload: payload para editar usuario
──────────────────────────────*/
/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Contraseñas: siempre hash con bcrypt + SALT_ROUNDS
🗑️ Password y refreshToken nunca se devuelven en JSON
⚠️ Validaciones estrictas en todos los campos
──────────────────────────────*/
/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[Register] → crea usuario con hash → guarda en AuthSchema
[Login] → valida email + bcrypt.compare → devuelve AuthPublic
[GetRefreshToken] → busca token de refresco por _id
[CheckAuth] → valida usuario y devuelve datos públicos
[SaveRefreshToken] → guarda token de refresco en usuario
[DeleteRefreshToken] → borra token de refresco de usuario
[DeleteAuth] → elimina usuario
[EditAuth] → actualiza datos validados
──────────────────────────────*/
class AuthModel {
    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    /*══════════ 🎮 getRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id} ║
    ║ ⚙️ Proceso: valida id y busca refreshToken ║
    ║ 📤 Salida: AuthTokenPublic {refreshToken}  ║
    ║ 🛠️ Errores: faltante o tipo inválido       ║
    ╚══════════════════════════════════════════╝*/
    static getRefreshToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const idResult = validation_1.Validation.stringValidation(_id, '_id');
            const { refreshToken } = authSchema_1.AuthSchema.findOne({ _id: idResult });
            if (!refreshToken)
                throw new Error("Missing refresh token in cookies");
            if (typeof refreshToken !== 'string')
                throw new Error("Refresh token is not a string");
            return { refreshToken };
        });
    }
    /*══════════ 🎮 checkAuth ══════════╗
    ║ 📥 Entrada: AuthCheckAuthPayload {_id} ║
    ║ ⚙️ Proceso: valida id, busca usuario,   ║
    ║    elimina password y refreshToken      ║
    ║ 📤 Salida: AuthPublicSchema             ║
    ║ 🛠️ Errores: usuario no encontrado,      ║
    ║    token faltante                       ║
    ╚═════════════════════════════════════════╝*/
    static checkAuth(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const idResult = validation_1.Validation.stringValidation(_id, '_id');
            const authObject = authSchema_1.AuthSchema.findOne({ _id: idResult });
            if (!authObject)
                throw new Error('User not found');
            if (!authObject.refreshToken)
                throw new Error('Missing refresh token in cookies');
            // eliminacion de dato sensible password
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _a = authObject, { password: _password, refreshToken: _refreshToken } = _a, publicAuth = __rest(_a, ["password", "refreshToken"]);
            return publicAuth;
        });
    }
    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: AuthRegisterPayload {username,email,password,repeatPassword,profilePhoto} ║
    ║ ⚙️ Proceso: valida campos, verifica duplicados, genera _id y hash de password         ║
    ║ 📤 Salida: string _id generado                                                        ║
    ║ 🛠️ Errores: username existente, validaciones fallidas                                ║
    ╚═════════════════════════════════════════════════════════════════════════════════════╝*/
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, email, password, repeatPassword, profilePhoto } = data;
            const usernameResult = validation_1.Validation.stringValidation(username, 'username');
            const emailResult = validation_1.Validation.email(email);
            const passwordResult = validation_1.Validation.password(password);
            validation_1.Validation.password(repeatPassword);
            const profileResult = profilePhoto ? validation_1.Validation.image(profilePhoto) : '';
            const authObject = authSchema_1.AuthSchema.findOne({ username: usernameResult });
            if (authObject)
                throw new Error('username already exists');
            const _id = crypto.randomUUID();
            const hashedPassword = yield bcrypt_1.default.hash(passwordResult, config_1.SALT_ROUNDS);
            authSchema_1.AuthSchema.create({
                _id,
                username: usernameResult,
                email: emailResult,
                password: hashedPassword,
                refreshToken: '',
                profilePhoto: profileResult,
            }).save(); //save hace que se guarde en la dblocal
            return _id;
        });
    }
    /*══════════ 🎮 login ══════════╗
     📥 Entrada: AuthLoginPayload {email,password} ║
     ⚙️ Proceso: valida credenciales con bcrypt     ║
     📤 Salida: AuthPublic                          ║
     🛠️ Errores: email inexistente, password inválido ║
    ═══════════════════════════════════════════════╝*/
    static login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = data;
            const emailResult = validation_1.Validation.email(email);
            const passwordResult = validation_1.Validation.password(password);
            const authObject = authSchema_1.AuthSchema.findOne({ email: emailResult });
            if (!authObject)
                throw new Error('email does not exist');
            const isValid = yield bcrypt_1.default.compare(passwordResult, authObject.password);
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
    ║ 🛠️ Errores: usuario no encontrado      ║
    ╚═══════════════════════════════════════╝*/
    static deleteAuth(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const authObject = authSchema_1.AuthSchema.findOne({ _id: _idResult });
            if (!authObject)
                throw new Error('User not found');
            authObject.remove();
        });
    }
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
    /*══════════ 🎮 saveRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id,token} ║
    ║ ⚙️ Proceso: valida id y token, guarda refreshToken ║
    ║ 📤 Salida: void                                ║
    ║ 🛠️ Errores: usuario no encontrado              ║
    ╚═══════════════════════════════════════════════╝*/
    static saveRefreshToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, token } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const tokenResult = validation_1.Validation.stringValidation(token, 'token');
            const authObject = authSchema_1.AuthSchema.findOne({ _id: _idResult });
            if (!authObject)
                throw new Error('User not found');
            authObject.refreshToken = tokenResult;
            authObject.save();
        });
    }
    /*══════════ 🎮 deleteRefreshToken ══════════╗
    ║ 📥 Entrada: AuthRefreshTokenPayload {_id}   ║
    ║ ⚙️ Proceso: valida id, borra refreshToken   ║
    ║ 📤 Salida: void                             ║
    ║ 🛠️ Errores: usuario no encontrado, token faltante ║
    ╚════════════════════════════════════════════╝*/
    static deleteRefreshToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const authObject = authSchema_1.AuthSchema.findOne({ _id: _idResult });
            if (!authObject)
                throw new Error('User not found');
            if (!authObject.refreshToken)
                throw new Error('Missing refresh token in cookies');
            authObject.refreshToken = undefined;
            authObject.save();
        });
    }
    /*══════════ 🎮 editAuth ══════════╗
    ║ 📥 Entrada: EditAuthPayload {_id,username,profilePhoto,email,password} ║
    ║ ⚙️ Proceso: valida campos y actualiza usuario                          ║
    ║ 📤 Salida: void                                                        ║
    ║ 🛠️ Errores: usuario no encontrado, validaciones fallidas               ║
    ╚═══════════════════════════════════════════════════════════════════════╝*/
    static editAuth(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, username, profilePhoto, email, password } = data;
            const _idResult = validation_1.Validation.stringValidation(_id, '_id');
            const userNameResult = validation_1.Validation.stringValidation(username, 'username');
            const profileResult = validation_1.Validation.stringValidation(profilePhoto, 'profile photo');
            const emailResult = validation_1.Validation.email(email);
            const passwordResult = validation_1.Validation.password(password);
            const authObject = authSchema_1.AuthSchema.findOne({ _id: _idResult });
            if (!authObject)
                throw new Error('User not found');
            authObject.username = userNameResult;
            authObject.email = emailResult;
            authObject.profilePhoto = profileResult;
            authObject.password = passwordResult;
            authObject.save();
        });
    }
}
exports.AuthModel = AuthModel;
