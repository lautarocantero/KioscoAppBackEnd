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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.home = home;
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.checkAuth = checkAuth;
exports.deleteAuth = deleteAuth;
exports.editAuth = editAuth;
const authModel_1 = require("../models/authModel");
const config_1 = require("../config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/authTypes";
// import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/index";
const handleControllerError_1 = require("../utils/handleControllerError");
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con autenticación 🕹️                                                             ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link              | Función         | Descripción                  | Params                  | Return   | Auth Req | Status ║
║--------|-------------------|-----------------|------------------------------|-------------------------|----------|----------|--------║
║ POST   | /register         | register         | Registro de usuarios         | body: {name,email,pwd}  | JSON {id}| No       | 201,400,500 ║
║ POST   | /login            | login            | Inicio de sesión             | body: {email,pwd}       | JWT token| No       | 200,401,500 ║
║ POST   | /logout           | logout           | Cierre de sesión             | headers: {Authorization}| JSON msg | Sí       | 200,401,500 ║
║ POST   | /checkAuth        | checkAuth       | Validación de sesión activa  | headers: {Authorization}| JSON bool| Sí       | 200,401,500 ║
║ PUT    | /edit-user        | editAuth        | Edición de usuario           | body: {id,fields...}    | JSON msg | Sí       | 200,400,404,500 ║
║ DELETE | /delete-user      | deleteAuth      | Eliminación de usuario       | body: {id}              | JSON msg | Sí       | 200,404,500 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
//─────────────────────────────────────────────────────────── 📥 GET 📥 ────────────────────────────────────────────────────────────────//
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función home 🎮 → Devuelve listado de endpoints disponibles                                                             ║
║ 📥 Entrada: -                                                                                                             ║
║ ⚙️ Proceso: Renderiza texto con rutas                                                                                     ║
║ 📤 Salida: HTML con endpoints                                                                                              ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function home(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res
            .status(200)
            .send(`
      Estas en auth<br>
      Endpoints =><br>
      ----Post: /register<br>
      ----Post: /login<br>
      ----Post: /logout<br>
      ----Post: /checkAuth<br>
      ----Delete: /delete-auth<br>
      ----Edit: /edit-auth<br>
  `);
    });
}
//─────────────────────────────────────────────────────────── 📥 GET 📥 ────────────────────────────────────────────────────────────────//
//─────────────────────────────────────────────────────────── 📤 POST 📤 ────────────────────────────────────────────────────────────────//
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función register 🎮 → Crea usuario nuevo                                                                               ║
║ 📥 Entrada: { username, email, profilePhoto, password, repeatPassword }                                                   ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, email, profilePhoto, password, repeatPassword } = req.body;
        try {
            const _id = yield authModel_1.AuthModel.create({ username, email, profilePhoto, password, repeatPassword });
            res
                .status(200)
                .json({
                id: _id,
                message: "User Registered successfully",
            });
        }
        catch (error) {
            (0, handleControllerError_1.handleControllerError)(res, error);
        }
    });
}
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función login 🎮 → Autentica usuario                                                                                   ║
║ 📥 Entrada: { email, password }                                                                                           ║
║ 📤 Salida: JSON { user, message }, cookies con access_token y refresh_token                                               ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        try {
            const user = yield authModel_1.AuthModel.login({ email, password });
            const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, config_1.ACCESS_SECRET, { expiresIn: '5m' });
            const refreshToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, config_1.REFRESH_SECRET, { expiresIn: '7d' });
            yield authModel_1.AuthModel.saveRefreshToken({ _id: user._id, token: refreshToken });
            res
                .cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 5,
            })
                .cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7,
            })
                .status(200)
                .json({
                user,
                message: "User Logged successfully",
            });
        }
        catch (error) {
            (0, handleControllerError_1.handleControllerError)(res, error);
        }
    });
}
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función logout 🎮 → Cierra sesión                                                                                      ║
║ 📥 Entrada: refresh_token (cookies)                                                                                       ║
║ 📤 Salida: JSON { message }, cookies limpiadas                                                                            ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function logout(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const refreshToken = (_a = req === null || req === void 0 ? void 0 : req.cookies) === null || _a === void 0 ? void 0 : _a.refresh_token;
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, config_1.REFRESH_SECRET);
            if (!(payload === null || payload === void 0 ? void 0 : payload.id)) {
                res
                    .status(401)
                    .json({ message: 'Invalid token payload' });
                return;
            }
            yield authModel_1.AuthModel.deleteRefreshToken({ _id: payload.id });
            res
                .clearCookie('access_token')
                .clearCookie('refresh_token')
                .status(200)
                .json({ message: 'Logged out successfully' });
        }
        catch (error) {
            (0, handleControllerError_1.handleControllerError)(res, error);
        }
    });
}
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función checkAuth 🎮 → Valida sesión                                                                                   ║
║ 📥 Entrada: refresh_token (cookies)                                                                                       ║
║ 📤 Salida: JSON { user }                                                                                                  ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function checkAuth(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refresh_token;
        try {
            const accessPayload = jsonwebtoken_1.default.verify(refreshToken, config_1.REFRESH_SECRET);
            const user = yield authModel_1.AuthModel.checkAuth({ _id: accessPayload.id });
            if (!user)
                throw new Error('No se encuentra ese usuario');
            res
                .status(200)
                .json(user);
        }
        catch (error) {
            (0, handleControllerError_1.handleControllerError)(res, error);
        }
    });
}
//─────────────────────────────────────────────────────────── 📤 POST 📤 ────────────────────────────────────────────────────────────────//
//─────────────────────────────────────────────────────────── 🗑️ DELETE 🗑️ ────────────────────────────────────────────────────────────────//
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función deleteAuth 🎮 → Elimina credenciales                                                                           ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function deleteAuth(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.body;
        try {
            yield authModel_1.AuthModel.deleteAuth({ _id });
            res
                .status(200)
                .json({
                _id,
                message: 'Auth deleted successfully',
            });
        }
        catch (error) {
            (0, handleControllerError_1.handleControllerError)(res, error);
        }
    });
}
//─────────────────────────────────────────────────────────── 🗑️ DELETE 🗑️ ────────────────────────────────────────────────────────────────//
//─────────────────────────────────────────────────────────── 🛠️ PUT 🛠️ ────────────────────────────────────────────────────────────────//
/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función editAuth 🎮 → Edita credenciales                                                                               ║
║ 📥 Entrada: { _id, username, email, password, profilePhoto }                                                              ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/
function editAuth(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, username, email, password, profilePhoto } = req.body;
        try {
            yield authModel_1.AuthModel.editAuth({ _id, username, email, password, profilePhoto });
            res
                .status(200)
                .json({
                _id,
                message: 'Auth has been edited successfully',
            });
        }
        catch (error) {
            (0, handleControllerError_1.handleControllerError)(res, error);
        }
    });
}
//─────────────────────────────────────────────────────────── 🛠️ PUT 🛠️ ────────────────────────────────────────────────────────────────//
