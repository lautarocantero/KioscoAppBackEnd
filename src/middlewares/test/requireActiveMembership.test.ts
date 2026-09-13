import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireActiveMembership } from '../requireActiveMembership';
import { PlanService } from '../../services/planService';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../../typings/membership/enums';

vi.mock('../../services/planService', () => ({
    PlanService: { getMembershipState: vi.fn() },
}));

const mockedPlanService = vi.mocked(PlanService);

const buildRes = (): Response => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('requireActiveMembership', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('responde 401 si no hay req.user (no autenticado)', async () => {
        const req = {} as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();

        await requireActiveMembership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(mockedPlanService.getMembershipState).not.toHaveBeenCalled();
    });

    it('deja pasar si el plan está Active', async () => {
        const req = { user: { id: 'user-1', email: 'a@a.com' } } as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();
        mockedPlanService.getMembershipState.mockResolvedValueOnce({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Active, trial_ends_at: null,
        });

        await requireActiveMembership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('deja pasar si está en Trial vigente', async () => {
        const req = { user: { id: 'user-1', email: 'a@a.com' } } as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();
        mockedPlanService.getMembershipState.mockResolvedValueOnce({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial,
            trial_ends_at: new Date(Date.now() + 60_000),
        });

        await requireActiveMembership(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('bloquea con 402 si el Trial ya venció', async () => {
        const req = { user: { id: 'user-1', email: 'a@a.com' } } as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();
        mockedPlanService.getMembershipState.mockResolvedValueOnce({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial,
            trial_ends_at: new Date(Date.now() - 60_000),
        });

        await requireActiveMembership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(402);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'MEMBERSHIP_REQUIRED' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('bloquea con 402 si el plan está Blocked/Cancelled/PendingPayment', async () => {
        const req = { user: { id: 'user-1', email: 'a@a.com' } } as Request;
        const res = buildRes();
        const next: NextFunction = vi.fn();
        mockedPlanService.getMembershipState.mockResolvedValueOnce({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Blocked, trial_ends_at: null,
        });

        await requireActiveMembership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(402);
        expect(next).not.toHaveBeenCalled();
    });
});
