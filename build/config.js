"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALT_ROUNDS = void 0;
_a = process.env.SALT_ROUNDS, exports.SALT_ROUNDS = _a === void 0 ? 10 : _a;
