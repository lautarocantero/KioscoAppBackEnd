import express from 'express';
import { 
  checkAuth, 
  deleteAuth, 
  editAuth, 
  home, 
  login, 
  logout, 
  refresh, 
  register 
} from '../controllers/auth.controller';

const router = express.Router();

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
- POST   /refresh  → renovar token de acceso
- DELETE /delete-auth → eliminar credenciales
- PUT    /edit-auth   → editar credenciales
──────────────────────────────*/

router.get('/', home);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/check-auth', checkAuth);
router.post('/refresh', refresh);
router.delete('/delete-auth', deleteAuth);
router.put('/edit-auth', editAuth);

export default router;