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
exports.AuthModel = void 0;
const validation_1 = __importDefault(require("./validation"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
const db_local_1 = __importDefault(require("db-local"));
const { Schema } = (0, db_local_1.default)({ path: './db' });
const Auth = Schema('Auth', {
    //campos //type //required
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
}
exports.AuthModel = AuthModel;
