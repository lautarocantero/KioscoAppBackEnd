import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireKioscoContext, requireKioscoRole } from '../middlewares/kioscoMiddleware';
// Import relativo (no @typings): acá se usa como VALOR (AuthRoleEnum.Admin),
// y el alias solo resuelve en tiempo de compilación, no en runtime (ts-node-dev).
import { AuthRoleEnum } from '../typings/auth/enums';
import {
  createMembershipCheckout,
  getMembershipPlans,
  getMembershipStatus,
  receiveMembershipWebhook,
} from '../controllers/membership.controller';

const router = express.Router();

/*──────────────────────────────
💳 MembershipRouter
──────────────────────────────
📂 Endpoints:
- GET  /plans      → precio/moneda de los 3 tiers (copy de marketing vive en el frontend)
- GET  /status      → plan y estado de la suscripción del kiosco activo (header x-kiosco-id)
- POST /checkout    → crea una preapproval de Mercado Pago y devuelve el link de pago (solo admin)
- POST /webhook     → notificaciones de Mercado Pago (sin auth propia, validado por firma HMAC)
──────────────────────────────*/

router.get('/plans', authMiddleware, getMembershipPlans);
router.get('/status', authMiddleware, requireKioscoContext, getMembershipStatus);
router.post(
  '/checkout',
  authMiddleware,
  requireKioscoContext,
  requireKioscoRole([AuthRoleEnum.Admin]),
  createMembershipCheckout,
);
router.post('/webhook', receiveMembershipWebhook);

export default router;
