import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
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
- GET  /plans      → precio/moneda de los 2 tiers (copy de marketing vive en el frontend)
- GET  /status      → plan y estado de la suscripción de la cuenta autenticada
- POST /checkout    → crea una preapproval de Mercado Pago para la cuenta autenticada y devuelve el link de pago
- POST /webhook     → notificaciones de Mercado Pago (sin auth propia, validado por firma HMAC)

📌 El plan es de la cuenta (Auth), no de un kiosco puntual: cualquier
   usuario autenticado gestiona SU PROPIO plan, sin importar su rol dentro
   de los kioscos donde participa (por eso no hay requireKioscoContext acá).
──────────────────────────────*/

router.get('/plans', authMiddleware, getMembershipPlans);
router.get('/status', authMiddleware, getMembershipStatus);
router.post('/checkout', authMiddleware, createMembershipCheckout);
router.post('/webhook', receiveMembershipWebhook);

export default router;
