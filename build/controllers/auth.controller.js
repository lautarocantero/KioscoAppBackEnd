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
Object.defineProperty(exports, "__esModule", { value: true });
exports.home = home;
exports.register = register;
exports.login = login;
const authModel_1 = require("../models/authModel");
function home(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.send('estas en auth!!!');
    });
}
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, password } = req.body;
        try {
            const id = yield authModel_1.AuthModel.create({ username, password });
            res.send({ id });
        }
        catch (error) {
            if (error instanceof Error) {
                res
                    .status(400)
                    .send(error.message);
                return;
            }
        }
    });
}
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, password } = req.body;
        try {
            const user = yield authModel_1.AuthModel.login({ username, password });
            res.send({ user });
        }
        catch (error) {
            if (error instanceof Error) {
                res
                    .status(401)
                    .send(error.message);
            }
        }
    });
}
// export async function logout(req: Request, res:Requ): Promise<void> {
// }
