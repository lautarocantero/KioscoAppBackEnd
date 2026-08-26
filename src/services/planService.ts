import { AuthSchema } from '../schemas/authSchema';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { PLAN_LIMITS } from '../config/planLimits';
// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum.Standard
// como fallback), y el alias solo resuelve en tiempo de compilación, no en
// runtime (ts-node-dev).
import { KioscoPlanEnum } from '../typings/membership/enums';

/*──────────────────────────────
🚧 PlanService
──────────────────────────────
📜 Propósito:
Único lugar que sabe cómo resolver "qué plan aplica acá". El plan es de la
CUENTA (Auth), no del kiosco: todo límite de catálogo/miembros/reportes de
un kiosco se evalúa contra el plan de su DUEÑO (kiosco.owner_id), nunca
contra el usuario que está haciendo la request.
──────────────────────────────*/

export class PlanService {

    static async getUserPlan(userId: string): Promise<KioscoPlanEnum> {
        const auth = await AuthSchema.findOne({ _id: userId }, { plan: 1 }).lean();
        // Fallback defensivo: una cuenta creada por un proceso con schema
        // desactualizado (o insertada a mano) puede no tener `plan` en Mongo
        // todavía (migrate:membership-plans lo backfillea, pero leer con
        // default evita romper mientras esa migración no corrió).
        return (auth?.plan as KioscoPlanEnum) ?? KioscoPlanEnum.Standard;
    }

    static async getKioscoOwnerPlan(kioscoId: string): Promise<KioscoPlanEnum> {
        const kiosco = await KioscoSchema.findOne({ _id: kioscoId }, { owner_id: 1 }).lean();
        if (!kiosco) throw new Error('Kiosco not found');
        return this.getUserPlan(kiosco.owner_id);
    }

    // null = sin piso de fecha (reportsScope 'full', plan Deluxe). Un Date =
    // el kiosco (plan Standard de su dueño) solo puede ver ventas desde ahí.
    static async getSellsDateFloor(kioscoId: string): Promise<Date | null> {
        const ownerPlan = await this.getKioscoOwnerPlan(kioscoId);
        if (PLAN_LIMITS[ownerPlan].reportsScope !== 'currentMonth') return null;
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
}
