import { AuthSchema } from '../schemas/authSchema';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { MEMBERSHIP_PLANS } from '../config/membershipPlans';
import { KioscoPlanEnum, KioscoPlanStatusEnum, MembershipPaymentMethodEnum } from '../typings/membership/enums';
import {
    CreateMembershipCheckoutPayload,
    CreateMembershipCheckoutResult,
    GetMembershipStatusPayload,
    MembershipStatus,
} from '@typings/membership';

// Mensaje genérico para un rechazo de tarjeta: el error crudo del SDK de
// Mercado Pago puede traer detalles internos de la API (códigos, causas) que
// no queremos exponer tal cual al cliente.
const CARD_DECLINED_MESSAGE = 'Tu tarjeta fue rechazada. Verificá los datos o probá con otro medio de pago.';

/*──────────────────────────────
💳 MembershipModel
──────────────────────────────
📜 Propósito: Gestión del tier de suscripción de una CUENTA (checkout y
aplicación de resultados de Mercado Pago). El plan es de Auth, no de
Kiosco: un usuario paga un único plan que aplica a todos los kioscos donde
participa (ver services/planService.ts para cómo se resuelve el plan
efectivo de un kiosco a partir de su dueño).
──────────────────────────────*/

function isValidPlan(value: unknown): value is KioscoPlanEnum {
    return typeof value === 'string' && Object.values(KioscoPlanEnum).includes(value as KioscoPlanEnum);
}

// external_reference de la preapproval: "<user_id>:<plan>". Evita necesitar
// una colección aparte para trackear checkouts pendientes.
function buildExternalReference(userId: string, plan: KioscoPlanEnum): string {
    return `${userId}:${plan}`;
}

function parseExternalReference(externalReference: string): { userId: string; plan: KioscoPlanEnum } | null {
    const [userId, plan] = externalReference.split(':');
    if (!userId || !isValidPlan(plan)) return null;
    return { userId, plan };
}

export class MembershipModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getStatus(data: GetMembershipStatusPayload): Promise<MembershipStatus> {
        const auth = await AuthSchema.findOne({ _id: data.user_id }).lean();
        if (!auth) throw new Error('User not found');

        let next_payment_date: string | null = null;
        if (auth.mp_preapproval_id && auth.plan_status === KioscoPlanStatusEnum.Active) {
            try {
                const preapproval = await MercadoPagoService.getPreapproval(auth.mp_preapproval_id);
                next_payment_date = preapproval.next_payment_date ?? null;
            } catch {
                // Si Mercado Pago no está configurado o la preapproval ya no existe,
                // igual devolvemos el plan/estado que tenemos guardado.
            }
        }

        return {
            // Fallback defensivo: ver PlanService.getUserPlan.
            plan: (auth.plan as KioscoPlanEnum) ?? KioscoPlanEnum.Standard,
            plan_status: (auth.plan_status as KioscoPlanStatusEnum) ?? KioscoPlanStatusEnum.Active,
            next_payment_date,
        };
    }

    //──────────────────────────────────────────── 📤 CHECKOUT 📤 ───────────────────────────────────────────//

    static async createCheckout(data: CreateMembershipCheckoutPayload): Promise<CreateMembershipCheckoutResult> {
        if (!isValidPlan(data.plan)) throw new Error('Invalid plan');
        const planDefinition = MEMBERSHIP_PLANS[data.plan];

        // Default a Redirect: compatibilidad con clientes que todavía no mandan
        // payment_method en el body (versiones viejas del build de Electron).
        const paymentMethod = data.payment_method === MembershipPaymentMethodEnum.Card
            ? MembershipPaymentMethodEnum.Card
            : MembershipPaymentMethodEnum.Redirect;

        if (paymentMethod === MembershipPaymentMethodEnum.Card && !data.card_token_id) {
            throw new Error('card_token_id is required for card payments');
        }

        const auth = await AuthSchema.findOne({ _id: data.user_id }).lean();
        if (!auth) throw new Error('User not found');
        if (auth.plan === data.plan && auth.plan_status === KioscoPlanStatusEnum.Active) {
            throw new Error('This account is already subscribed to this plan');
        }

        let preapproval;
        try {
            preapproval = await MercadoPagoService.createPreapproval({
                reason: `Membresía ${planDefinition.name} - Stocko`,
                payer_email: data.payer_email,
                transaction_amount: planDefinition.price,
                currency_id: planDefinition.currency_id,
                external_reference: buildExternalReference(data.user_id, data.plan),
                card_token_id: paymentMethod === MembershipPaymentMethodEnum.Card ? data.card_token_id : undefined,
            });
        } catch (error: unknown) {
            // No repropagar el error crudo del SDK de Mercado Pago ante un
            // rechazo de tarjeta: puede traer detalles internos de la API.
            if (paymentMethod === MembershipPaymentMethodEnum.Card) throw new Error(CARD_DECLINED_MESSAGE);
            throw error;
        }

        if (!preapproval.id) throw new Error('Mercado Pago did not return a valid subscription id');
        if (paymentMethod === MembershipPaymentMethodEnum.Redirect && !preapproval.init_point) {
            throw new Error('Mercado Pago did not return a valid checkout link');
        }

        await AuthSchema.findOneAndUpdate(
            { _id: data.user_id },
            {
                $set: {
                    plan_status: KioscoPlanStatusEnum.PendingPayment,
                    mp_preapproval_id: preapproval.id,
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

        const auth = await AuthSchema.findOne({ _id: parsed.userId }).lean();
        if (!auth) throw new Error('User not found');
        // Evita que una notificación vieja/fuera de orden pise el estado de una
        // preapproval más nueva de la misma cuenta.
        if (auth.mp_preapproval_id !== preapprovalId) return;

        const planStatus = mapPreapprovalStatus(preapproval.status);
        // Cancelada/pausada: la cuenta cae al tier base (Standard) en vez de
        // quedar "activa" en un tier que ya no está pagando.
        const plan = planStatus === KioscoPlanStatusEnum.Active ? parsed.plan : KioscoPlanEnum.Standard;

        await AuthSchema.findOneAndUpdate(
            { _id: parsed.userId },
            {
                $set: {
                    plan,
                    plan_status: planStatus,
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
