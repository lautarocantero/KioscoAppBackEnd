"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
/*──────────────────────────────
🔑 AuthRouter
──────────────────────────────
📜 Propósito:
Define las rutas de autenticación y las conecta con sus controladores.

📂 Endpoints:
- GET    /            → home (lista de endpoints)
- POST   /register    → registrar usuario
- POST   /login       → iniciar sesión
- POST   /logout      → cerrar sesión
- POST   /check-auth  → verificar autenticación
- DELETE /delete-auth → eliminar credenciales
- PUT    /edit-auth   → editar credenciales
──────────────────────────────*/
router.get('/', auth_controller_1.home);
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/logout', auth_controller_1.logout);
router.post('/check-auth', auth_controller_1.checkAuth);
router.delete('/delete-auth', auth_controller_1.deleteAuth);
router.put('/edit-auth', auth_controller_1.editAuth);
exports.default = router;
