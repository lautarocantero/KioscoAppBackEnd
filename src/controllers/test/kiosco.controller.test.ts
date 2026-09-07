import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { KioscoModel } from '../../models/kioscoModel';
import {
    createKiosco,
    editKiosco,
    getInviteInfo,
    getMyKioscos,
    joinKiosco,
    removeKioscoMember,
    selectKiosco,
    updateKioscoMemberRole,
} from '../kiosco.controller';

vi.mock('../../models/kioscoModel', () => ({
    KioscoModel: {
        create: vi.fn(),
        getMyKioscos: vi.fn(),
        join: vi.fn(),
        getInviteInfo: vi.fn(),
        edit: vi.fn(),
        select: vi.fn(),
        removeMember: vi.fn(),
        updateMemberRole: vi.fn(),
    },
}));

const mockedKioscoModel = vi.mocked(KioscoModel);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ params: {}, body: {}, query: {}, user: { id: 'user-1', email: 'a@a.com' }, ...overrides }) as unknown as T;

describe('kiosco.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createKiosco', () => {
        it('crea el kiosco con el dueño de la sesión actual', async () => {
            mockedKioscoModel.create.mockResolvedValueOnce({ _id: 'kiosco-1' } as never);
            const res = buildRes();

            await createKiosco(buildReq({ body: { name: 'Central', address: 'x' } }), res);

            expect(mockedKioscoModel.create).toHaveBeenCalledWith({ name: 'Central', address: 'x', owner_id: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si se alcanzó el límite del plan', async () => {
            mockedKioscoModel.create.mockRejectedValueOnce(new Error('Your account reached its kiosco limit for the current plan. Upgrade to Deluxe to create more.'));
            const res = buildRes();

            await createKiosco(buildReq({ body: { name: 'Central', address: 'x' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getMyKioscos', () => {
        it('devuelve los kioscos del usuario de la sesión', async () => {
            mockedKioscoModel.getMyKioscos.mockResolvedValueOnce([{ _id: 'kiosco-1' }] as never);
            const res = buildRes();

            await getMyKioscos(buildReq(), res);

            expect(mockedKioscoModel.getMyKioscos).toHaveBeenCalledWith({ user_id: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('joinKiosco', () => {
        it('une al usuario de la sesión al kiosco del código', async () => {
            mockedKioscoModel.join.mockResolvedValueOnce({ _id: 'kiosco-1' } as never);
            const res = buildRes();

            await joinKiosco(buildReq({ body: { invite_code: 'ABC12345' } }), res);

            expect(mockedKioscoModel.join).toHaveBeenCalledWith({ invite_code: 'ABC12345', user_id: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el código de invitación es inválido', async () => {
            mockedKioscoModel.join.mockRejectedValueOnce(new Error('Invalid invite code'));
            const res = buildRes();

            await joinKiosco(buildReq({ body: { invite_code: 'nope' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getInviteInfo', () => {
        it('devuelve el código y link de invitación del kiosco del path param', async () => {
            mockedKioscoModel.getInviteInfo.mockResolvedValueOnce({ invite_code: 'ABC12345', invite_link: 'https://x/join?code=ABC12345' });
            const res = buildRes();

            await getInviteInfo(buildReq({ params: { kiosco_id: 'kiosco-1' } }), res);

            expect(mockedKioscoModel.getInviteInfo).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' }, expect.any(String));
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('editKiosco', () => {
        it('edita el kiosco del path param', async () => {
            mockedKioscoModel.edit.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await editKiosco(buildReq({ params: { kiosco_id: 'kiosco-1' }, body: { name: 'Nuevo' } }), res);

            expect(mockedKioscoModel.edit).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', name: 'Nuevo', address: undefined, currency: undefined });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('selectKiosco', () => {
        it('marca el kiosco como recientemente accedido por el usuario de la sesión', async () => {
            mockedKioscoModel.select.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await selectKiosco(buildReq({ params: { kiosco_id: 'kiosco-1' } }), res);

            expect(mockedKioscoModel.select).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', user_id: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('removeKioscoMember', () => {
        it('elimina la membresía indicada en los path params', async () => {
            mockedKioscoModel.removeMember.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await removeKioscoMember(buildReq({ params: { kiosco_id: 'kiosco-1', user_id: 'user-2' } }), res);

            expect(mockedKioscoModel.removeMember).toHaveBeenCalledWith('kiosco-1', 'user-2');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si se intenta sacar al dueño', async () => {
            mockedKioscoModel.removeMember.mockRejectedValueOnce(new Error('Cannot modify the kiosco owner\'s membership'));
            const res = buildRes();

            await removeKioscoMember(buildReq({ params: { kiosco_id: 'kiosco-1', user_id: 'owner-1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('updateKioscoMemberRole', () => {
        it('actualiza el rol de la membresía indicada', async () => {
            mockedKioscoModel.updateMemberRole.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await updateKioscoMemberRole(buildReq({ params: { kiosco_id: 'kiosco-1', user_id: 'user-2' }, body: { role: 'admin' } }), res);

            expect(mockedKioscoModel.updateMemberRole).toHaveBeenCalledWith('kiosco-1', 'user-2', 'admin');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el rol es inválido', async () => {
            mockedKioscoModel.updateMemberRole.mockRejectedValueOnce(new Error('Invalid role'));
            const res = buildRes();

            await updateKioscoMemberRole(buildReq({ params: { kiosco_id: 'kiosco-1', user_id: 'user-2' }, body: { role: 'superadmin' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
