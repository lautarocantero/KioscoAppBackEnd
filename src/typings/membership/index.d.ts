
/*──────────────────────────────
📘 MembershipTypes
──────────────────────────────
📜 Propósito:
Definir tipados para el tier de suscripción de una CUENTA (Auth, no Kiosco:
un usuario paga un único plan que aplica a todos los kioscos donde
participa) y el checkout de Mercado Pago (Preapproval / suscripciones) que
lo activa.
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
  user_id: string;
  plan: unknown;
  payer_email: string;
  payment_method?: unknown;
  card_token_id?: string;
};

export type CreateMembershipCheckoutResult = {
  // Ausente cuando el checkout se autoriza directamente con card_token_id
  // (Card Payment Brick) — no hay checkout hospedado al que redirigir.
  init_point?: string;
  preapproval_id: string;
};

export type GetMembershipStatusPayload = {
  user_id: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🔔 WEBHOOK 🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔           ║
╚══════════════════════════════════════════════════════════════════════╝*/

// external_reference de la preapproval: "<user_id>:<plan>", parseado en el
// webhook para saber a qué cuenta/tier aplicar la actualización.
export type MembershipExternalReference = {
  user_id: string;
  plan: KioscoPlanEnum;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type CreateMembershipCheckoutRequest = Request<unknown, unknown, Omit<CreateMembershipCheckoutPayload, 'user_id' | 'payer_email'>>;

}
