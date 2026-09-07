import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { MembershipModel } from '../../models/membershipModel';
import { MercadoPagoService } from '../../services/mercadoPagoService';
import { MEMBERSHIP_PLANS } from '../../config/membershipPlans';
import {
    createMembershipCheckout,
    getMembershipPlans,
    getMembershipStatus,
    receiveMembershipWebhook,
} from '../membership.controller';

vi.mock('../../models/membershipModel', () => ({
    MembershipModel: {
        getStatus: vi.fn(),
        createCheckout: vi.fn(),
        applyPreapprovalUpdate: vi.fn(),
    },
}));

vi.mock('../../services/mercadoPagoService', () => ({
    MercadoPagoService: { validateWebhookSignature: vi.fn() },
}));

const mockedMembershipModel = vi.mocked(MembershipModel);
const mockedMercadoPagoService = vi.mocked(MercadoPagoService);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ params: {}, body: {}, query: {}, headers: {}, ...overrides }) as unknown as T;

describe('membership.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('getMembershipPlans', () => {
        it('devuelve los planes disponibles sin necesitar sesión', async () => {
            const res = buildRes();

            await getMembershipPlans(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(Object.values(MEMBERSHIP_PLANS));
        });
    });

    describe('getMembershipStatus', () => {
        it('devuelve el estado de la cuenta autenticada', async () => {
            mockedMembershipModel.getStatus.mockResolvedValueOnce({ plan: 'standard', plan_status: 'active', next_payment_date: null } as never);
            const res = buildRes();

            await getMembershipStatus(buildReq({ user: { id: 'user-1', email: 'a@a.com' } }), res);

            expect(mockedMembershipModel.getStatus).toHaveBeenCalledWith({ user_id: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el modelo lanza un Error', async () => {
            mockedMembershipModel.getStatus.mockRejectedValueOnce(new Error('User not found'));
            const res = buildRes();

            await getMembershipStatus(buildReq({ user: { id: 'user-1', email: 'a@a.com' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('createMembershipCheckout', () => {
        it('crea el checkout para la cuenta autenticada', async () => {
            mockedMembershipModel.createCheckout.mockResolvedValueOnce({ init_point: 'https://mp/x', preapproval_id: 'pre-1' });
            const res = buildRes();

            await createMembershipCheckout(buildReq({
                user: { id: 'user-1', email: 'a@a.com' },
                body: { plan: 'deluxe', payment_method: 'redirect' },
            }), res);

            expect(mockedMembershipModel.createCheckout).toHaveBeenCalledWith({
                user_id: 'user-1', plan: 'deluxe', payer_email: 'a@a.com', payment_method: 'redirect', card_token_id: undefined,
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ init_point: 'https://mp/x', preapproval_id: 'pre-1' });
        });

        it('responde 400 si el checkout es rechazado', async () => {
            mockedMembershipModel.createCheckout.mockRejectedValueOnce(new Error('This account is already subscribed to this plan'));
            const res = buildRes();

            await createMembershipCheckout(buildReq({ user: { id: 'user-1', email: 'a@a.com' }, body: { plan: 'standard' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('receiveMembershipWebhook', () => {
        it('responde 401 si la firma es inválida', async () => {
            mockedMercadoPagoService.validateWebhookSignature.mockImplementationOnce(() => {
                throw new Error('Invalid signature');
            });
            const res = buildRes();

            await receiveMembershipWebhook(buildReq({ query: { 'data.id': 'pre-1', type: 'preapproval' } }), res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockedMembershipModel.applyPreapprovalUpdate).not.toHaveBeenCalled();
        });

        it('ignora eventos que no son de preapproval', async () => {
            const res = buildRes();

            await receiveMembershipWebhook(buildReq({ query: { 'data.id': 'pre-1', type: 'payment' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockedMembershipModel.applyPreapprovalUpdate).not.toHaveBeenCalled();
        });

        it('ignora el evento si falta data.id', async () => {
            const res = buildRes();

            await receiveMembershipWebhook(buildReq({ query: { type: 'preapproval' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockedMembershipModel.applyPreapprovalUpdate).not.toHaveBeenCalled();
        });

        it('aplica la actualización de la preapproval con firma válida', async () => {
            mockedMembershipModel.applyPreapprovalUpdate.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await receiveMembershipWebhook(buildReq({ query: { 'data.id': 'pre-1', type: 'subscription_preapproval' } }), res);

            expect(mockedMembershipModel.applyPreapprovalUpdate).toHaveBeenCalledWith('pre-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Membership updated' });
        });

        it('responde 200 (para que MP no reintente) aunque applyPreapprovalUpdate falle', async () => {
            mockedMembershipModel.applyPreapprovalUpdate.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await receiveMembershipWebhook(buildReq({ query: { 'data.id': 'pre-1', type: 'preapproval' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Acknowledged with errors, see server logs' });
        });
    });
});
