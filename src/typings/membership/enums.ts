
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
  // Free trial de 7 días desde el alta de la cuenta (ver AuthModel.create /
  // authSchema.trial_ends_at). Usa los límites de Standard (PLAN_LIMITS).
  Trial = 'trial',
  // Trial vencido sin suscripción activa: PlanService.getMembershipState lo
  // setea de forma perezosa (no hay cron), y requireActiveMembership bloquea
  // cualquier acción de negocio hasta que la cuenta pague.
  Blocked = 'blocked',
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
