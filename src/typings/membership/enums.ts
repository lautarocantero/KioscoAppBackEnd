
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
