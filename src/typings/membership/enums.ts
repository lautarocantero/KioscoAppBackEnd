
/*══════════════════════════════════════════════════════════════════════╗
║ 💳 PLAN 💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳💳                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

// El tier de suscripción de un kiosco. No confundir con KioscoMembership
// (typings/kioscoMembership), que es la relación N:N usuario↔kiosco.
export enum KioscoPlanEnum {
  Standard = 'standard',
  Deluxe = 'deluxe',
}

export enum KioscoPlanStatusEnum {
  Active = 'active',
  PendingPayment = 'pending_payment',
  Cancelled = 'cancelled',
}

/*══════════════════════════════════════════════════════════════════════╗
║ 💰 CHECKOUT 💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰💰                 ║
╚══════════════════════════════════════════════════════════════════════╝*/

// Cómo se autoriza la preapproval de Mercado Pago: redirigiendo al checkout
// hospedado (init_point) o con un card_token_id tokenizado en el cliente
// (Card Payment Brick) para autorizarla sin salir de la app.
export enum MembershipPaymentMethodEnum {
  Redirect = 'redirect',
  Card = 'card',
}
