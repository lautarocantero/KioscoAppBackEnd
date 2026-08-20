
/*──────────────────────────────
📘 MembershipTypes
──────────────────────────────
📜 Propósito:
Definir tipados para el tier de suscripción de un kiosco y el checkout de
Mercado Pago (Preapproval / suscripciones) que lo activa.
──────────────────────────────*/

import { KioscoPlanEnum, KioscoPlanStatusEnum } from '@typings/membership/enums';

declare module '@typings/membership' {

/*══════════════════════════════════════════════════════════════════════╗
║ 💳 PLAN DEFINITION 💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳             ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type MembershipPlanDefinition = {
  id: KioscoPlanEnum;
  name: string;
  price: number;
  currency_id: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 STATUS 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                       ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type MembershipStatus = {
  plan: KioscoPlanEnum;
  plan_status: KioscoPlanStatusEnum;
  next_payment_date: string | null;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type CreateMembershipCheckoutPayload = {
  kiosco_id: string;
  plan: unknown;
  payer_email: string;
};

export type CreateMembershipCheckoutResult = {
  init_point: string;
  preapproval_id: string;
};

export type GetMembershipStatusPayload = {
  kiosco_id: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🔔 WEBHOOK 🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔           ║
╚══════════════════════════════════════════════════════════════════════╝*/

// external_reference de la preapproval: "<kiosco_id>:<plan>", parseado en el
// webhook para saber a qué kiosco/tier aplicar la actualización.
export type MembershipExternalReference = {
  kiosco_id: string;
  plan: KioscoPlanEnum;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type CreateMembershipCheckoutRequest = Request<unknown, unknown, Omit<CreateMembershipCheckoutPayload, 'kiosco_id' | 'payer_email'>>;

}
