import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MembershipModel } from '../membershipModel';
import { AuthSchema } from '../../schemas/authSchema';
import { MercadoPagoService } from '../../services/mercadoPagoService';
import { KioscoPlanEnum, KioscoPlanStatusEnum, MembershipPaymentMethodEnum } from '../../typings/membership/enums';

vi.mock('../../schemas/authSchema', () => ({
    AuthSchema: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock('../../services/mercadoPagoService', () => ({
    MercadoPagoService: {
        getPreapproval: vi.fn(),
        createPreapproval: vi.fn(),
    },
}));

const mockedAuthSchema = vi.mocked(AuthSchema);
const mockedMercadoPagoService = vi.mocked(MercadoPagoService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

describe('MembershipModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStatus', () => {
        // getStatus lee el doc completo una vez y PlanService.getMembershipState
        // (vencimiento perezoso del trial) hace su propia lectura proyectada:
        // cada test encola dos findOne, uno por cada lectura.
        const mockAuthTwice = (data: Record<string, unknown>) => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(data) as never);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(data) as never);
        };

        it('devuelve plan/estado guardados sin consultar Mercado Pago si no hay preapproval', async () => {
            mockAuthTwice({
                plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active,
                mp_preapproval_id: null, trial_ends_at: null,
            });

            const result = await MembershipModel.getStatus({ user_id: 'user-1' });

            expect(result).toEqual({
                plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active,
                next_payment_date: null, trial_ends_at: null,
            });
            expect(mockedMercadoPagoService.getPreapproval).not.toHaveBeenCalled();
        });

        it('agrega next_payment_date si hay una preapproval activa', async () => {
            mockAuthTwice({
                plan: KioscoPlanEnum.Deluxe, plan_status: KioscoPlanStatusEnum.Active,
                mp_preapproval_id: 'pre-1', trial_ends_at: null,
            });
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({ next_payment_date: '2026-10-01' } as never);

            const result = await MembershipModel.getStatus({ user_id: 'user-1' });

            expect(result.next_payment_date).toEqual('2026-10-01');
        });

        it('no rompe si Mercado Pago falla al consultar la preapproval', async () => {
            mockAuthTwice({
                plan: KioscoPlanEnum.Deluxe, plan_status: KioscoPlanStatusEnum.Active,
                mp_preapproval_id: 'pre-1', trial_ends_at: null,
            });
            mockedMercadoPagoService.getPreapproval.mockRejectedValueOnce(new Error('MP down'));

            const result = await MembershipModel.getStatus({ user_id: 'user-1' });

            expect(result.next_payment_date).toBeNull();
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(MembershipModel.getStatus({ user_id: 'user-1' })).rejects.toThrow('User not found');
        });

        it('vence el trial y bloquea la cuenta si trial_ends_at ya pasó', async () => {
            mockAuthTwice({
                plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial,
                mp_preapproval_id: null, trial_ends_at: new Date('2020-01-01'),
            });
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            const result = await MembershipModel.getStatus({ user_id: 'user-1' });

            expect(result.plan_status).toEqual(KioscoPlanStatusEnum.Blocked);
            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { plan_status: KioscoPlanStatusEnum.Blocked } },
            );
        });

        it('mantiene el trial si todavía no venció', async () => {
            mockAuthTwice({
                plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial,
                mp_preapproval_id: null, trial_ends_at: new Date(Date.now() + 60_000),
            });

            const result = await MembershipModel.getStatus({ user_id: 'user-1' });

            expect(result.plan_status).toEqual(KioscoPlanStatusEnum.Trial);
            expect(mockedAuthSchema.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('createCheckout', () => {
        const basePayload = { user_id: 'user-1', plan: KioscoPlanEnum.Deluxe, payer_email: 'a@a.com' };

        it('crea la preapproval por redirect y deja la cuenta pending_payment', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active }) as never);
            mockedMercadoPagoService.createPreapproval.mockResolvedValueOnce({ id: 'pre-1', init_point: 'https://mp/checkout' } as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            const result = await MembershipModel.createCheckout(basePayload);

            expect(result).toEqual({ init_point: 'https://mp/checkout', preapproval_id: 'pre-1' });
            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { plan_status: KioscoPlanStatusEnum.PendingPayment, mp_preapproval_id: 'pre-1' } },
            );
        });

        it('crea la preapproval con card_token_id cuando el método es card', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active }) as never);
            mockedMercadoPagoService.createPreapproval.mockResolvedValueOnce({ id: 'pre-1' } as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            await MembershipModel.createCheckout({ ...basePayload, payment_method: MembershipPaymentMethodEnum.Card, card_token_id: 'card-tok-1' });

            expect(mockedMercadoPagoService.createPreapproval).toHaveBeenCalledWith(expect.objectContaining({ card_token_id: 'card-tok-1' }));
        });

        it('lanza error si falta card_token_id con método card', async () => {
            await expect(MembershipModel.createCheckout({ ...basePayload, payment_method: MembershipPaymentMethodEnum.Card }))
                .rejects.toThrow('card_token_id is required for card payments');
            expect(mockedAuthSchema.findOne).not.toHaveBeenCalled();
        });

        it('lanza error si el plan es inválido', async () => {
            await expect(MembershipModel.createCheckout({ ...basePayload, plan: 'gold' as KioscoPlanEnum }))
                .rejects.toThrow('Invalid plan');
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(MembershipModel.createCheckout(basePayload)).rejects.toThrow('User not found');
        });

        it('lanza error si la cuenta ya está activa en el plan pedido', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Deluxe, plan_status: KioscoPlanStatusEnum.Active }) as never);

            await expect(MembershipModel.createCheckout(basePayload)).rejects.toThrow('This account is already subscribed to this plan');
            expect(mockedMercadoPagoService.createPreapproval).not.toHaveBeenCalled();
        });

        it('devuelve un mensaje genérico (sin detalle del SDK) si la tarjeta es rechazada', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active }) as never);
            mockedMercadoPagoService.createPreapproval.mockRejectedValueOnce(new Error('cc_rejected_insufficient_amount'));

            await expect(MembershipModel.createCheckout({ ...basePayload, payment_method: MembershipPaymentMethodEnum.Card, card_token_id: 'card-tok-1' }))
                .rejects.toThrow('Tu tarjeta fue rechazada. Verificá los datos o probá con otro medio de pago.');
        });

        it('repropaga el error del SDK tal cual para el flujo de redirect', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active }) as never);
            mockedMercadoPagoService.createPreapproval.mockRejectedValueOnce(new Error('mp_api_error'));

            await expect(MembershipModel.createCheckout(basePayload)).rejects.toThrow('mp_api_error');
        });

        it('lanza error si Mercado Pago no devuelve un id de suscripción', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active }) as never);
            mockedMercadoPagoService.createPreapproval.mockResolvedValueOnce({} as never);

            await expect(MembershipModel.createCheckout(basePayload)).rejects.toThrow('Mercado Pago did not return a valid subscription id');
        });

        it('lanza error si el redirect no trae init_point', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active }) as never);
            mockedMercadoPagoService.createPreapproval.mockResolvedValueOnce({ id: 'pre-1' } as never);

            await expect(MembershipModel.createCheckout(basePayload)).rejects.toThrow('Mercado Pago did not return a valid checkout link');
        });
    });

    describe('applyPreapprovalUpdate', () => {
        it('activa el plan pedido cuando la preapproval está autorizada', async () => {
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({
                external_reference: 'user-1:deluxe', status: 'authorized',
            } as never);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ mp_preapproval_id: 'pre-1' }) as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            await MembershipModel.applyPreapprovalUpdate('pre-1');

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { plan: KioscoPlanEnum.Deluxe, plan_status: KioscoPlanStatusEnum.Active } },
            );
        });

        it('cae a Standard cuando la preapproval fue cancelada', async () => {
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({
                external_reference: 'user-1:deluxe', status: 'cancelled',
            } as never);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ mp_preapproval_id: 'pre-1' }) as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            await MembershipModel.applyPreapprovalUpdate('pre-1');

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Cancelled } },
            );
        });

        it('ignora la notificación si ya no es la preapproval vigente de la cuenta (out-of-order)', async () => {
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({
                external_reference: 'user-1:deluxe', status: 'authorized',
            } as never);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ mp_preapproval_id: 'pre-mas-nueva' }) as never);

            await MembershipModel.applyPreapprovalUpdate('pre-vieja');

            expect(mockedAuthSchema.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it('lanza error si la preapproval no trae external_reference', async () => {
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({} as never);

            await expect(MembershipModel.applyPreapprovalUpdate('pre-1')).rejects.toThrow('Preapproval has no external_reference');
        });

        it('lanza error si el external_reference no se puede parsear', async () => {
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({ external_reference: 'formato-invalido' } as never);

            await expect(MembershipModel.applyPreapprovalUpdate('pre-1')).rejects.toThrow('Could not parse external_reference');
        });

        it('lanza error si el usuario ya no existe', async () => {
            mockedMercadoPagoService.getPreapproval.mockResolvedValueOnce({ external_reference: 'user-1:deluxe', status: 'authorized' } as never);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(MembershipModel.applyPreapprovalUpdate('pre-1')).rejects.toThrow('User not found');
        });
    });
});
