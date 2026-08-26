// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum.Standard
// como computed key), y el alias solo resuelve en tiempo de compilación, no
// en runtime (ts-node-dev).
import { KioscoPlanEnum } from '../typings/membership/enums';
import { MembershipPlanDefinition } from '@typings/membership';

/*──────────────────────────────
💳 MEMBERSHIP_PLANS
──────────────────────────────
📜 Propósito:
Fuente de verdad del precio/moneda de cada tier. El backend solo necesita
esto para crear la suscripción en Mercado Pago con el monto correcto; el
copy de marketing (ventajas, textos) vive en el frontend.
──────────────────────────────*/

export const MEMBERSHIP_PLANS: Record<KioscoPlanEnum, MembershipPlanDefinition> = {
    [KioscoPlanEnum.Standard]: {
        id: KioscoPlanEnum.Standard,
        name: 'Standard',
        price: 50000,
        currency_id: 'ARS',
    },
    [KioscoPlanEnum.Deluxe]: {
        id: KioscoPlanEnum.Deluxe,
        name: 'Deluxe',
        price: 65000,
        currency_id: 'ARS',
    },
};
