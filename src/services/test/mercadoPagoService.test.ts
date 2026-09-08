import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockConfigCtor = vi.fn();
const mockCreate = vi.fn();
const mockGet = vi.fn();
const mockValidate = vi.fn();

vi.mock('mercadopago', () => {
    class MercadoPagoConfig {
        constructor(opts: { accessToken: string }) {
            mockConfigCtor(opts);
        }
    }
    class PreApproval {
        create = mockCreate;
        get = mockGet;
        constructor(_config: unknown) { /* noop */ }
    }
    return {
        MercadoPagoConfig,
        PreApproval,
        WebhookSignatureValidator: { validate: mockValidate },
    };
});

const configState: { MP_ACCESS_TOKEN?: string; MP_WEBHOOK_SECRET?: string; FRONTEND_URL: string } = {
    MP_ACCESS_TOKEN: 'test-access-token',
    MP_WEBHOOK_SECRET: 'test-webhook-secret',
    FRONTEND_URL: 'http://localhost:5173',
};

vi.mock('../../config', () => ({
    get MP_ACCESS_TOKEN() { return configState.MP_ACCESS_TOKEN; },
    get MP_WEBHOOK_SECRET() { return configState.MP_WEBHOOK_SECRET; },
    get FRONTEND_URL() { return configState.FRONTEND_URL; },
}));

// mercadoPagoService.ts cachea el MercadoPagoConfig en una variable de módulo
// (`let config`), así que una vez creado con un token válido no se vuelve a
// invocar el constructor en llamadas subsiguientes dentro del mismo test
// file — usamos resetModules + import dinámico para tener un módulo fresco
// por test y poder variar MP_ACCESS_TOKEN/MP_WEBHOOK_SECRET libremente.
async function loadService() {
    vi.resetModules();
    const mod = await import('../mercadoPagoService');
    return mod.MercadoPagoService;
}

describe('MercadoPagoService.createPreapproval', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configState.MP_ACCESS_TOKEN = 'test-access-token';
        configState.MP_WEBHOOK_SECRET = 'test-webhook-secret';
        configState.FRONTEND_URL = 'http://localhost:5173';
    });

    it('lanza si falta MP_ACCESS_TOKEN', async () => {
        configState.MP_ACCESS_TOKEN = undefined;
        const MercadoPagoService = await loadService();

        await expect(MercadoPagoService.createPreapproval({
            reason: 'Plan Deluxe',
            payer_email: 'user@test.com',
            transaction_amount: 49900,
            currency_id: 'ARS',
            external_reference: 'user-1:deluxe',
        })).rejects.toThrow('Mercado Pago is not configured (missing MP_ACCESS_TOKEN)');

        expect(mockCreate).not.toHaveBeenCalled();
    });

    it('sin card_token_id crea la preapproval en estado pending (redirect a checkout)', async () => {
        mockCreate.mockResolvedValueOnce({ id: 'pre-1', init_point: 'https://mp/checkout' });
        const MercadoPagoService = await loadService();

        const result = await MercadoPagoService.createPreapproval({
            reason: 'Plan Deluxe',
            payer_email: 'user@test.com',
            transaction_amount: 49900,
            currency_id: 'ARS',
            external_reference: 'user-1:deluxe',
        });

        expect(result).toEqual({ id: 'pre-1', init_point: 'https://mp/checkout' });
        expect(mockCreate).toHaveBeenCalledWith({
            body: expect.objectContaining({
                status: 'pending',
                card_token_id: undefined,
                back_url: 'http://localhost:5173/membership/checkout/result',
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: 49900,
                    currency_id: 'ARS',
                },
            }),
        });
    });

    it('con card_token_id crea la preapproval ya autorizada (Card Payment Brick)', async () => {
        mockCreate.mockResolvedValueOnce({ id: 'pre-2', status: 'authorized' });
        const MercadoPagoService = await loadService();

        await MercadoPagoService.createPreapproval({
            reason: 'Plan Deluxe',
            payer_email: 'user@test.com',
            transaction_amount: 49900,
            currency_id: 'ARS',
            external_reference: 'user-1:deluxe',
            card_token_id: 'card-tok-1',
        });

        expect(mockCreate).toHaveBeenCalledWith({
            body: expect.objectContaining({ status: 'authorized', card_token_id: 'card-tok-1' }),
        });
    });

    it('propaga el rechazo del SDK (p.ej. tarjeta rechazada)', async () => {
        mockCreate.mockRejectedValueOnce(new Error('cc_rejected_insufficient_amount'));
        const MercadoPagoService = await loadService();

        await expect(MercadoPagoService.createPreapproval({
            reason: 'Plan Deluxe',
            payer_email: 'user@test.com',
            transaction_amount: 49900,
            currency_id: 'ARS',
            external_reference: 'user-1:deluxe',
            card_token_id: 'card-tok-1',
        })).rejects.toThrow('cc_rejected_insufficient_amount');
    });
});

describe('MercadoPagoService.getPreapproval', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configState.MP_ACCESS_TOKEN = 'test-access-token';
        configState.MP_WEBHOOK_SECRET = 'test-webhook-secret';
    });

    it('lanza si falta MP_ACCESS_TOKEN', async () => {
        configState.MP_ACCESS_TOKEN = undefined;
        const MercadoPagoService = await loadService();

        await expect(MercadoPagoService.getPreapproval('pre-1')).rejects.toThrow('Mercado Pago is not configured');
    });

    it('devuelve la preapproval por id', async () => {
        mockGet.mockResolvedValueOnce({ id: 'pre-1', status: 'authorized' });
        const MercadoPagoService = await loadService();

        const result = await MercadoPagoService.getPreapproval('pre-1');

        expect(result).toEqual({ id: 'pre-1', status: 'authorized' });
        expect(mockGet).toHaveBeenCalledWith({ id: 'pre-1' });
    });
});

describe('MercadoPagoService.validateWebhookSignature', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.clearAllMocks();
        configState.MP_ACCESS_TOKEN = 'test-access-token';
        configState.MP_WEBHOOK_SECRET = 'test-webhook-secret';
    });

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });

    it('con secret configurado, delega en WebhookSignatureValidator.validate', async () => {
        const MercadoPagoService = await loadService();

        MercadoPagoService.validateWebhookSignature({
            xSignature: 'ts=123,v1=abc',
            xRequestId: 'req-1',
            dataId: 'data-1',
        });

        expect(mockValidate).toHaveBeenCalledWith({
            xSignature: 'ts=123,v1=abc',
            xRequestId: 'req-1',
            dataId: 'data-1',
            secret: 'test-webhook-secret',
        });
    });

    it('propaga el error de firma inválida del validator', async () => {
        mockValidate.mockImplementationOnce(() => { throw new Error('SignatureMismatch'); });
        const MercadoPagoService = await loadService();

        expect(() => MercadoPagoService.validateWebhookSignature({
            xSignature: 'ts=123,v1=bad',
            xRequestId: 'req-1',
            dataId: 'data-1',
        })).toThrow('SignatureMismatch');
    });

    it('sin secret y NODE_ENV=production, rechaza fail-closed sin llamar al validator', async () => {
        configState.MP_WEBHOOK_SECRET = undefined;
        process.env.NODE_ENV = 'production';
        const MercadoPagoService = await loadService();

        expect(() => MercadoPagoService.validateWebhookSignature({
            xSignature: undefined,
            xRequestId: undefined,
            dataId: undefined,
        })).toThrow('MP_WEBHOOK_SECRET is not set — refusing to accept webhook in production');

        expect(mockValidate).not.toHaveBeenCalled();
    });

    it('sin secret fuera de producción, deja pasar con warning sin llamar al validator', async () => {
        configState.MP_WEBHOOK_SECRET = undefined;
        process.env.NODE_ENV = 'development';
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const MercadoPagoService = await loadService();

        expect(() => MercadoPagoService.validateWebhookSignature({
            xSignature: undefined,
            xRequestId: undefined,
            dataId: undefined,
        })).not.toThrow();

        expect(mockValidate).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});
