import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireKioscoContext, requireKioscoRole } from '../kioscoMiddleware';
import { KioscoModel } from '../../models/kioscoModel';
import { AuthRoleEnum } from '../../typings/auth/enums';

vi.mock('../../models/kioscoModel', () => ({
    KioscoModel: { getMembership: vi.fn() },
}));

const mockedKioscoModel = vi.mocked(KioscoModel);

const buildRes = (): Response => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('requireKioscoContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('responde 400 si no viene ni kiosco_id param ni header x-kiosco-id', async () => {
        const req = { params: {}, headers: {} } as unknown as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireKioscoContext(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing kiosco context (x-kiosco-id header or kiosco_id param)' });
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 si no hay req.user (no autenticado)', async () => {
        const req = { params: {}, headers: { 'x-kiosco-id': 'kiosco-1' } } as unknown as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireKioscoContext(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
        expect(mockedKioscoModel.getMembership).not.toHaveBeenCalled();
    });

    it('responde 403 si el usuario no pertenece al kiosco', async () => {
        mockedKioscoModel.getMembership.mockResolvedValueOnce(null);
        const req = {
            params: {}, headers: { 'x-kiosco-id': 'kiosco-1' }, user: { id: 'user-1', email: 'a@a.com' },
        } as unknown as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireKioscoContext(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'You do not belong to this kiosco' });
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 500 si KioscoModel.getMembership rechaza', async () => {
        mockedKioscoModel.getMembership.mockRejectedValueOnce(new Error('DB down'));
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const req = {
            params: {}, headers: { 'x-kiosco-id': 'kiosco-1' }, user: { id: 'user-1', email: 'a@a.com' },
        } as unknown as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireKioscoContext(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('con membership válida: setea req.kioscoId/req.kioscoRole desde el param, prioritario sobre el header', async () => {
        mockedKioscoModel.getMembership.mockResolvedValueOnce({ role: AuthRoleEnum.Admin } as never);
        const req = {
            params: { kiosco_id: 'kiosco-from-param' },
            headers: { 'x-kiosco-id': 'kiosco-from-header' },
            user: { id: 'user-1', email: 'a@a.com' },
        } as unknown as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireKioscoContext(req, res, next);

        expect(mockedKioscoModel.getMembership).toHaveBeenCalledWith('kiosco-from-param', 'user-1');
        expect(req.kioscoId).toBe('kiosco-from-param');
        expect(req.kioscoRole).toBe(AuthRoleEnum.Admin);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('sin param, usa el header x-kiosco-id', async () => {
        mockedKioscoModel.getMembership.mockResolvedValueOnce({ role: AuthRoleEnum.Seller } as never);
        const req = {
            params: {}, headers: { 'x-kiosco-id': 'kiosco-from-header' }, user: { id: 'user-1', email: 'a@a.com' },
        } as unknown as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireKioscoContext(req, res, next);

        expect(mockedKioscoModel.getMembership).toHaveBeenCalledWith('kiosco-from-header', 'user-1');
        expect(req.kioscoId).toBe('kiosco-from-header');
    });
});

describe('requireKioscoRole', () => {
    it('responde 401 si no hay req.kioscoRole (requireKioscoContext no corrió antes)', () => {
        const req = {} as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        requireKioscoRole([AuthRoleEnum.Admin])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing kiosco context' });
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 403 si el rol del kiosco no está en la lista permitida', () => {
        const req = { kioscoRole: AuthRoleEnum.Seller } as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        requireKioscoRole([AuthRoleEnum.Admin])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions in this kiosco' });
        expect(next).not.toHaveBeenCalled();
    });

    it('llama a next() si el rol está permitido', () => {
        const req = { kioscoRole: AuthRoleEnum.Admin } as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        requireKioscoRole([AuthRoleEnum.Admin, AuthRoleEnum.Seller])(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
