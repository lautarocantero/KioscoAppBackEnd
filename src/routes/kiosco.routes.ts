import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireKioscoContext, requireKioscoRole } from '../middlewares/kioscoMiddleware';
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

router.post('/create', authMiddleware, createKiosco);
router.get('/my-kioscos', authMiddleware, getMyKioscos);
router.post('/join', authMiddleware, joinKiosco);

router.get(
  '/:kiosco_id/invite-info',
  authMiddleware,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  getInviteInfo,
);
router.put(
  '/:kiosco_id',
  authMiddleware,
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
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  removeKioscoMember,
);
router.put(
  '/:kiosco_id/member/:user_id/role',
  authMiddleware,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  updateKioscoMemberRole,
);

export default router;
