"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALT_ROUNDS = exports.REFRESH_SECRET = exports.ACCESS_SECRET = exports.PORT = void 0;
_a = process.env, _b = _a.PORT, exports.PORT = _b === void 0 ? 3000 : _b, _c = _a.ACCESS_SECRET, exports.ACCESS_SECRET = _c === void 0 ? 'ember-shadow-echo-pulse-crystal-hawk-orbit-glide-spark-forest-vortex-flux-sunset-nova-mirror-logic' : _c, _d = _a.REFRESH_SECRET, exports.REFRESH_SECRET = _d === void 0 ? 'lunar-thorn-blaze-cascade-echo-ripple-zenith-hollow-ember-quartz-surge-mirror-drift-aurora-pulse-vault' : _d;
exports.SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
