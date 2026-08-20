import { MercadoPagoConfig, PreApproval, WebhookSignatureValidator } from 'mercadopago';
import { PreApprovalResponse } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, FRONTEND_URL } from '../config';

/*──────────────────────────────
💳 MercadoPagoService
──────────────────────────────
📜 Propósito:
Encapsular todo el uso del SDK de Mercado Pago para suscripciones
(Preapproval). Un kiosco que sube de tier crea una preapproval recurrente
mensual; el webhook confirma cuándo quedó autorizada.
──────────────────────────────*/

let config: MercadoPagoConfig | null = null;

function getConfig(): MercadoPagoConfig {
    if (!MP_ACCESS_TOKEN) throw new Error('Mercado Pago is not configured (missing MP_ACCESS_TOKEN)');
    if (!config) config = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    return config;
}

export type CreatePreapprovalParams = {
    reason: string;
    payer_email: string;
    transaction_amount: number;
    currency_id: string;
    external_reference: string;
};

export class MercadoPagoService {

    //──────────────────────────────────────────── 📤 CREATE 📤 ───────────────────────────────────────────//

    static async createPreapproval(params: CreatePreapprovalParams): Promise<PreApprovalResponse> {
        const preApproval = new PreApproval(getConfig());

        return await preApproval.create({
            body: {
                reason: params.reason,
                payer_email: params.payer_email,
                external_reference: params.external_reference,
                back_url: `${FRONTEND_URL}/membership/checkout/result`,
                status: 'pending',
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: params.transaction_amount,
                    currency_id: params.currency_id,
                },
            },
        });
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getPreapproval(id: string): Promise<PreApprovalResponse> {
        const preApproval = new PreApproval(getConfig());
        return await preApproval.get({ id });
    }

    //──────────────────────────────────────────── 🔔 WEBHOOK 🔔 ───────────────────────────────────────────//

    // Sin MP_WEBHOOK_SECRET configurado no podemos validar la firma: se deja
    // pasar (con warning) para no bloquear el flujo antes de tener
    // credenciales, pero es inseguro — configurar el secret ni bien haya
    // credenciales reales de Mercado Pago.
    static validateWebhookSignature(options: { xSignature: string | string[] | undefined; xRequestId: string | string[] | undefined; dataId: string | string[] | undefined }): void {
        if (!MP_WEBHOOK_SECRET) {
            console.warn('⚠️  MP_WEBHOOK_SECRET is not set — skipping webhook signature validation');
            return;
        }

        WebhookSignatureValidator.validate({
            xSignature: options.xSignature,
            xRequestId: options.xRequestId,
            dataId: options.dataId,
            secret: MP_WEBHOOK_SECRET,
        });
    }
}
