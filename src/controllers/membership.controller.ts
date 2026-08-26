import { Request, Response } from 'express';
import { handleControllerError } from '../utils/handleControllerError';
import { MembershipModel } from '../models/membershipModel';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { MEMBERSHIP_PLANS } from '../config/membershipPlans';
import {
  CreateMembershipCheckoutRequest,
  CreateMembershipCheckoutResult,
  MembershipStatus,
} from '@typings/membership';

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints de membresía (plan/suscripción de la cuenta) 🕹️                                                ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Tipo   | Link       | Función            | Auth Req                                            | Status          ║
║--------|------------|--------------------|------------------------------------------------------|-----------------║
║ GET    | /plans     | getMembershipPlans | authMiddleware                                        | 200,500         ║
║ GET    | /status    | getMembershipStatus| authMiddleware                                        | 200,404,500     ║
║ POST   | /checkout  | createCheckout     | authMiddleware                                        | 200,400,500     ║
║ POST   | /webhook   | receiveWebhook     | (público, validado por firma de Mercado Pago)         | 200,401         ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getMembershipPlans(_req: Request, res: Response): Promise<void> {
    res.status(200).json(Object.values(MEMBERSHIP_PLANS));
}

export async function getMembershipStatus(req: Request, res: Response): Promise<void> {
    try {
        const status: MembershipStatus = await MembershipModel.getStatus({ user_id: req.user!.id });
        res.status(200).json(status);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function createMembershipCheckout(req: CreateMembershipCheckoutRequest, res: Response): Promise<void> {
    const { plan } = req.body;

    try {
        const result: CreateMembershipCheckoutResult = await MembershipModel.createCheckout({
            user_id: req.user!.id,
            plan,
            payer_email: req.user!.email,
        });
        res.status(200).json(result);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

// Mercado Pago llama a este endpoint sin nuestra sesión (cookie JWT): la
// autenticidad se valida con la firma HMAC (x-signature), no con authMiddleware.
// Siempre responder 200 salvo firma inválida, para que MP no reintente en loop
// por errores de negocio que ya quedaron logueados server-side.
export async function receiveMembershipWebhook(req: Request, res: Response): Promise<void> {
    const dataId = (req.query['data.id'] ?? req.body?.data?.id) as string | string[] | undefined;
    const type = (req.query.type ?? req.body?.type) as string | undefined;

    try {
        MercadoPagoService.validateWebhookSignature({
            xSignature: req.headers['x-signature'],
            xRequestId: req.headers['x-request-id'],
            dataId,
        });
    } catch (error: unknown) {
        console.error('Invalid Mercado Pago webhook signature', error);
        res.status(401).json({ message: 'Invalid signature' });
        return;
    }

    if (type !== 'subscription_preapproval' && type !== 'preapproval') {
        res.status(200).json({ message: 'Ignored: not a preapproval event' });
        return;
    }

    if (!dataId || typeof dataId !== 'string') {
        res.status(200).json({ message: 'Ignored: missing data.id' });
        return;
    }

    try {
        await MembershipModel.applyPreapprovalUpdate(dataId);
        res.status(200).json({ message: 'Membership updated' });
    } catch (error: unknown) {
        console.error('Failed to apply Mercado Pago webhook', error);
        res.status(200).json({ message: 'Acknowledged with errors, see server logs' });
    }
}
