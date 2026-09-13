import { AuthSchema } from '../schemas/authSchema';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { PLAN_LIMITS } from '../config/planLimits';
// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum.Standard
// como fallback), y el alias solo resuelve en tiempo de compilación, no en
// runtime (ts-node-dev).
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../typings/membership/enums';

export type MembershipState = {
    plan: KioscoPlanEnum;
    plan_status: KioscoPlanStatusEnum;
    trial_ends_at: Date | null;
};

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

    // No hay cron: el vencimiento del trial se evalúa perezosamente acá (y en
    // MembershipModel.getStatus, que la usa para /membership/status). Si el
    // trial venció, persiste el pase a Blocked antes de devolverlo, así la
    // primera request de cualquier endpoint gateado ya ve el estado correcto.
    static async getMembershipState(userId: string): Promise<MembershipState> {
        const auth = await AuthSchema.findOne(
            { _id: userId },
            { plan: 1, plan_status: 1, trial_ends_at: 1 },
        ).lean();

        const plan = (auth?.plan as KioscoPlanEnum) ?? KioscoPlanEnum.Standard;
        const plan_status = (auth?.plan_status as KioscoPlanStatusEnum) ?? KioscoPlanStatusEnum.Trial;
        const trial_ends_at = auth?.trial_ends_at ?? null;

        const trialExpired = plan_status === KioscoPlanStatusEnum.Trial
            && trial_ends_at !== null
            && trial_ends_at.getTime() < Date.now();

        if (!trialExpired) return { plan, plan_status, trial_ends_at };

        await AuthSchema.findOneAndUpdate(
            { _id: userId },
            { $set: { plan_status: KioscoPlanStatusEnum.Blocked } },
        );

        return { plan, plan_status: KioscoPlanStatusEnum.Blocked, trial_ends_at };
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
