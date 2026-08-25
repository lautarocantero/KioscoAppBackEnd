import { KioscoSchema } from '../schemas/kioscoSchema';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { MEMBERSHIP_PLANS } from '../config/membershipPlans';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../typings/membership/enums';
import {
    CreateMembershipCheckoutPayload,
    CreateMembershipCheckoutResult,
    GetMembershipStatusPayload,
    MembershipStatus,
} from '@typings/membership';

/*──────────────────────────────
💳 MembershipModel
──────────────────────────────
📜 Propósito: Gestión del tier de suscripción de un kiosco (checkout y
aplicación de resultados de Mercado Pago). No confundir con KioscoModel
(datos del kiosco en sí) ni con KioscoMembership (rol usuario↔kiosco).
──────────────────────────────*/

function isValidPlan(value: unknown): value is KioscoPlanEnum {
    return typeof value === 'string' && Object.values(KioscoPlanEnum).includes(value as KioscoPlanEnum);
}

// external_reference de la preapproval: "<kiosco_id>:<plan>". Evita necesitar
// una colección aparte para trackear checkouts pendientes.
function buildExternalReference(kioscoId: string, plan: KioscoPlanEnum): string {
    return `${kioscoId}:${plan}`;
}

function parseExternalReference(externalReference: string): { kioscoId: string; plan: KioscoPlanEnum } | null {
    const [kioscoId, plan] = externalReference.split(':');
    if (!kioscoId || !isValidPlan(plan)) return null;
    return { kioscoId, plan };
}

export class MembershipModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getStatus(data: GetMembershipStatusPayload): Promise<MembershipStatus> {
        const kiosco = await KioscoSchema.findOne({ _id: data.kiosco_id }).lean();
        if (!kiosco) throw new Error('Kiosco not found');

        let next_payment_date: string | null = null;
        if (kiosco.mp_preapproval_id && kiosco.plan_status === KioscoPlanStatusEnum.Active) {
            try {
                const preapproval = await MercadoPagoService.getPreapproval(kiosco.mp_preapproval_id);
                next_payment_date = preapproval.next_payment_date ?? null;
            } catch {
                // Si Mercado Pago no está configurado o la preapproval ya no existe,
                // igual devolvemos el plan/estado que tenemos guardado.
            }
        }

        return {
            // Fallback defensivo: un kiosco creado por un proceso con schema
            // desactualizado (o insertado a mano) puede no tener plan/plan_status
            // en Mongo — migrate:membership-plans backfillea esto, pero leer con
            // default evita 500 mientras esa migración no corrió todavía.
            plan: (kiosco.plan as KioscoPlanEnum) ?? KioscoPlanEnum.Stocko,
            plan_status: (kiosco.plan_status as KioscoPlanStatusEnum) ?? KioscoPlanStatusEnum.Active,
            next_payment_date,
        };
    }

    //──────────────────────────────────────────── 📤 CHECKOUT 📤 ───────────────────────────────────────────//

    static async createCheckout(data: CreateMembershipCheckoutPayload): Promise<CreateMembershipCheckoutResult> {
        if (!isValidPlan(data.plan)) throw new Error('Invalid plan');
        const planDefinition = MEMBERSHIP_PLANS[data.plan];

        const kiosco = await KioscoSchema.findOne({ _id: data.kiosco_id }).lean();
        if (!kiosco) throw new Error('Kiosco not found');
        if (kiosco.plan === data.plan && kiosco.plan_status === KioscoPlanStatusEnum.Active) {
            throw new Error('This kiosco is already subscribed to this plan');
        }

        const preapproval = await MercadoPagoService.createPreapproval({
            reason: `Membresía ${planDefinition.name} - Stocko`,
            payer_email: data.payer_email,
            transaction_amount: planDefinition.price,
            currency_id: planDefinition.currency_id,
            external_reference: buildExternalReference(data.kiosco_id, data.plan),
        });

        if (!preapproval.id || !preapproval.init_point) throw new Error('Mercado Pago did not return a valid checkout link');

        await KioscoSchema.findOneAndUpdate(
            { _id: data.kiosco_id },
            {
                $set: {
                    plan_status: KioscoPlanStatusEnum.PendingPayment,
                    mp_preapproval_id: preapproval.id,
                    updated_at: new Date().toISOString(),
                },
            },
        );

        return { init_point: preapproval.init_point, preapproval_id: preapproval.id };
    }

    //──────────────────────────────────────────── 🔔 WEBHOOK 🔔 ───────────────────────────────────────────//

    // Idempotente: se puede llamar varias veces con la misma preapproval (MP
    // reintenta notificaciones) sin efectos duplicados, porque solo aplica un
    // $set con el estado actual leído desde la API de Mercado Pago.
    static async applyPreapprovalUpdate(preapprovalId: string): Promise<void> {
        const preapproval = await MercadoPagoService.getPreapproval(preapprovalId);
        if (!preapproval.external_reference) throw new Error('Preapproval has no external_reference');

        const parsed = parseExternalReference(preapproval.external_reference);
        if (!parsed) throw new Error('Could not parse external_reference');

        const kiosco = await KioscoSchema.findOne({ _id: parsed.kioscoId }).lean();
        if (!kiosco) throw new Error('Kiosco not found');
        // Evita que una notificación vieja/fuera de orden pise el estado de una
        // preapproval más nueva del mismo kiosco.
        if (kiosco.mp_preapproval_id !== preapprovalId) return;

        const planStatus = mapPreapprovalStatus(preapproval.status);
        // Cancelada/pausada: el kiosco cae al tier base (Stocko) en vez de
        // quedar "activo" en un tier que ya no está pagando.
        const plan = planStatus === KioscoPlanStatusEnum.Active ? parsed.plan : KioscoPlanEnum.Stocko;

        await KioscoSchema.findOneAndUpdate(
            { _id: parsed.kioscoId },
            {
                $set: {
                    plan,
                    plan_status: planStatus,
                    updated_at: new Date().toISOString(),
                },
            },
        );
    }
}

function mapPreapprovalStatus(status: string | undefined): KioscoPlanStatusEnum {
    if (status === 'authorized') return KioscoPlanStatusEnum.Active;
    if (status === 'cancelled') return KioscoPlanStatusEnum.Cancelled;
    return KioscoPlanStatusEnum.PendingPayment;
}
