// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum.Stocko
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
    [KioscoPlanEnum.Stocko]: {
        id: KioscoPlanEnum.Stocko,
        name: 'Stocko',
        price: 9999,
        currency_id: 'ARS',
    },
    [KioscoPlanEnum.SuperStocko]: {
        id: KioscoPlanEnum.SuperStocko,
        name: 'Super Stocko',
        price: 15000,
        currency_id: 'ARS',
    },
    [KioscoPlanEnum.MaxiStocko]: {
        id: KioscoPlanEnum.MaxiStocko,
        name: 'Maxi Stocko',
        price: 20000,
        currency_id: 'ARS',
    },
};
