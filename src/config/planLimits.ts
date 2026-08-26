// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum
// como key de Record), y el alias solo resuelve en tiempo de compilación,
// no en runtime (ts-node-dev).
import { KioscoPlanEnum } from '../typings/membership/enums';

/*──────────────────────────────
🚧 PLAN_LIMITS
──────────────────────────────
📜 Propósito:
Fuente de verdad de qué puede hacer cada plan. El plan es de la CUENTA
(Auth), no del kiosco (ver services/planService.ts): estos límites se
evalúan siempre contra el plan del DUEÑO del kiosco en cuestión (para
límites de catálogo/miembros/reportes) o contra el plan del usuario que
está creando/uniéndose a un kiosco (para el límite de membresías).
`null` = sin límite.
──────────────────────────────*/

export type ReportsScope = 'currentMonth' | 'full';

export type PlanLimits = {
    // Cuántos kioscos puede integrar (como dueño o como vendedor) un usuario
    // con este plan, en total.
    maxKioscoMemberships: number | null;
    // Cuántos miembros en total (dueño incluido) puede tener un kiosco cuyo
    // dueño tiene este plan.
    maxKioscoMembers: number | null;
    // Cuántas "unidades de catálogo" (productos + presentaciones, cada uno
    // cuenta 1) puede tener un kiosco cuyo dueño tiene este plan.
    maxCatalogUnits: number | null;
    // Alcance de reportes/historial de ventas para un kiosco cuyo dueño
    // tiene este plan.
    reportsScope: ReportsScope;
};

export const PLAN_LIMITS: Record<KioscoPlanEnum, PlanLimits> = {
    [KioscoPlanEnum.Standard]: {
        maxKioscoMemberships: 1,
        maxKioscoMembers: 2,
        maxCatalogUnits: 1150,
        reportsScope: 'currentMonth',
    },
    [KioscoPlanEnum.Deluxe]: {
        maxKioscoMemberships: null,
        maxKioscoMembers: null,
        maxCatalogUnits: null,
        reportsScope: 'full',
    },
};
