"use strict";
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_SECRET = exports.ACCESS_SECRET = exports.SALT_ROUNDS = exports.PORT = void 0;
_a = process.env, _b = _a.PORT, exports.PORT = _b === void 0 ? 3000 : _b, _c = _a.SALT_ROUNDS, exports.SALT_ROUNDS = _c === void 0 ? 10 : _c, _d = _a.ACCESS_SECRET, exports.ACCESS_SECRET = _d === void 0 ? 'ember-shadow-echo-pulse-crystal-hawk-orbit-glide-spark-forest-vortex-flux-sunset-nova-mirror-logic' : _d, _e = _a.REFRESH_SECRET, exports.REFRESH_SECRET = _e === void 0 ? 'lunar-thorn-blaze-cascade-echo-ripple-zenith-hollow-ember-quartz-surge-mirror-drift-aurora-pulse-vault' : _e;
