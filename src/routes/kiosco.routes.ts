import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireKioscoContext, requireKioscoRole } from '../middlewares/kioscoMiddleware';
import { requireActiveMembership } from '../middlewares/requireActiveMembership';
// Import relativo (no @typings): acá se usa como VALOR (AuthRoleEnum.Admin),
// y el alias solo resuelve en tiempo de compilación, no en runtime (ts-node-dev).
import { AuthRoleEnum } from '../typings/auth/enums';
import {
  createKiosco,
  editKiosco,
  getInviteInfo,
  getMyKioscos,
  joinKiosco,
  removeKioscoMember,
  selectKiosco,
  updateKioscoMemberRole,
} from '../controllers/kiosco.controller';

const router = express.Router();

/*──────────────────────────────
🏪 KioscoRouter
──────────────────────────────
📂 Endpoints:
- POST /create                    → crear un kiosco nuevo (el creador queda como admin)
- GET  /my-kioscos                → kioscos a los que pertenece el usuario, con stats
- POST /join                      → unirse a un kiosco existente vía invite_code
- GET  /:kiosco_id/invite-info    → código/link de invitación (solo admin)
- PUT  /:kiosco_id                → editar nombre/dirección/moneda (solo admin)
- POST /:kiosco_id/select         → marcar "último acceso" al entrar a ese kiosco
  (los vendedores del kiosco se listan en GET /seller/get-sellers, scoped por header x-kiosco-id)
- DELETE /:kiosco_id/member/:user_id       → sacar a un vendedor del kiosco (solo admin)
- PUT    /:kiosco_id/member/:user_id/role  → cambiar el rol de un vendedor (solo admin)
──────────────────────────────*/

// /my-kioscos y /:kiosco_id/select NO llevan requireActiveMembership: son las
// rutas que el frontend usa para decidir a dónde navegar (hasActiveKiosco) al
// entrar a la app, incluso con la cuenta bloqueada — bloquearlas rompería esa
// decisión antes de poder mostrar la pantalla de "necesitás un plan".
router.post('/create', authMiddleware, requireActiveMembership, createKiosco);
router.get('/my-kioscos', authMiddleware, getMyKioscos);
router.post('/join', authMiddleware, requireActiveMembership, joinKiosco);

router.get(
  '/:kiosco_id/invite-info',
  authMiddleware,
  requireActiveMembership,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  getInviteInfo,
);
router.put(
  '/:kiosco_id',
  authMiddleware,
  requireActiveMembership,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  editKiosco,
);
router.post(
  '/:kiosco_id/select',
  authMiddleware,
  requireKioscoContext,
  selectKiosco,
);
router.delete(
  '/:kiosco_id/member/:user_id',
  authMiddleware,
  requireActiveMembership,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  removeKioscoMember,
);
router.put(
  '/:kiosco_id/member/:user_id/role',
  authMiddleware,
  requireActiveMembership,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  updateKioscoMemberRole,
);

export default router;
