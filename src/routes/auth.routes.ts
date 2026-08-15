import express from 'express';
import { 
  checkAuth, 
  deleteAuth, 
  editAuth, 
  googleLogin, 
  home, 
  login, 
  logout, 
  refresh, 
  register, 
  requestPasswordReset, 
  resetPassword,
  // verifyEmail
} from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { AuthRoleEnum } from '../typings/auth/enums';

const router = express.Router();

/*──────────────────────────────
🔑 AuthRouter
──────────────────────────────
📜 Propósito:
Define las rutas de autenticación y las conecta con sus controladores.

📂 Endpoints:
- GET    /                       → home (lista de endpoints)
- POST   /register                → registrar usuario
- POST   /login                   → iniciar sesión
- POST   /logout                  → cerrar sesión
- POST   /check-auth              → verificar autenticación
- POST   /refresh                 → renovar token de acceso
- POST   /verify-email            → confirmar email con token
- POST   /request-password-reset  → solicitar link de reset
- POST   /reset-password          → aplicar nueva contraseña
- DELETE /delete-auth              → eliminar credenciales
- PUT    /edit-auth                → editar credenciales
──────────────────────────────*/

router.get('/', home);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.post('/check-auth', checkAuth);
router.post('/refresh', refresh);
// router.post('/verify-email', verifyEmail); // TODO(email-verification): reactivar cuando se pague Resend.
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
// Elimina identidad + cascada a Seller: solo un admin puede borrar cuentas.
router.delete('/delete-auth', authMiddleware, requireRole([AuthRoleEnum.Admin]), deleteAuth);
router.put('/edit-auth', authMiddleware, editAuth);

export default router;