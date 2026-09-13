import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanService } from '../planService';
import { AuthSchema } from '../../schemas/authSchema';
import { KioscoSchema } from '../../schemas/kioscoSchema';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../../typings/membership/enums';

vi.mock('../../schemas/authSchema', () => ({
    AuthSchema: { findOne: vi.fn(), findOneAndUpdate: vi.fn() },
}));

vi.mock('../../schemas/kioscoSchema', () => ({
    KioscoSchema: { findOne: vi.fn() },
}));

const mockedAuthSchema = vi.mocked(AuthSchema);
const mockedKioscoSchema = vi.mocked(KioscoSchema);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

describe('PlanService.getUserPlan', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devuelve el plan de la cuenta', async () => {
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Deluxe }) as never);

        const result = await PlanService.getUserPlan('user-1');

        expect(result).toBe(KioscoPlanEnum.Deluxe);
        expect(mockedAuthSchema.findOne).toHaveBeenCalledWith({ _id: 'user-1' }, { plan: 1 });
    });

    it('usa Standard como fallback si la cuenta no tiene plan seteado', async () => {
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({}) as never);

        const result = await PlanService.getUserPlan('user-1');

        expect(result).toBe(KioscoPlanEnum.Standard);
    });

    it('usa Standard como fallback si la cuenta no existe', async () => {
        mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

        const result = await PlanService.getUserPlan('user-1');

        expect(result).toBe(KioscoPlanEnum.Standard);
    });
});

describe('PlanService.getKioscoOwnerPlan', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lanza si el kiosco no existe', async () => {
        mockedKioscoSchema.findOne.mockReturnValueOnce(lean(null) as never);

        await expect(PlanService.getKioscoOwnerPlan('kiosco-1')).rejects.toThrow('Kiosco not found');
        expect(mockedAuthSchema.findOne).not.toHaveBeenCalled();
    });

    it('resuelve el plan del owner_id del kiosco, no del que llama', async () => {
        mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Deluxe }) as never);

        const result = await PlanService.getKioscoOwnerPlan('kiosco-1');

        expect(result).toBe(KioscoPlanEnum.Deluxe);
        expect(mockedAuthSchema.findOne).toHaveBeenCalledWith({ _id: 'owner-1' }, { plan: 1 });
    });
});

describe('PlanService.getMembershipState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devuelve Active tal cual, sin tocar la DB', async () => {
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({
            plan: KioscoPlanEnum.Deluxe, plan_status: KioscoPlanStatusEnum.Active, trial_ends_at: null,
        }) as never);

        const result = await PlanService.getMembershipState('user-1');

        expect(result).toEqual({ plan: KioscoPlanEnum.Deluxe, plan_status: KioscoPlanStatusEnum.Active, trial_ends_at: null });
        expect(mockedAuthSchema.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('mantiene Trial si trial_ends_at todavía no pasó', async () => {
        const trialEndsAt = new Date(Date.now() + 60_000);
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial, trial_ends_at: trialEndsAt,
        }) as never);

        const result = await PlanService.getMembershipState('user-1');

        expect(result.plan_status).toBe(KioscoPlanStatusEnum.Trial);
        expect(mockedAuthSchema.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('pasa a Blocked y lo persiste si trial_ends_at ya pasó', async () => {
        const trialEndsAt = new Date(Date.now() - 60_000);
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial, trial_ends_at: trialEndsAt,
        }) as never);
        mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

        const result = await PlanService.getMembershipState('user-1');

        expect(result.plan_status).toBe(KioscoPlanStatusEnum.Blocked);
        expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: 'user-1' },
            { $set: { plan_status: KioscoPlanStatusEnum.Blocked } },
        );
    });

    it('cuentas sin trial_ends_at (viejas) no se bloquean solas', async () => {
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({
            plan: KioscoPlanEnum.Standard, plan_status: KioscoPlanStatusEnum.Trial, trial_ends_at: null,
        }) as never);

        const result = await PlanService.getMembershipState('user-1');

        expect(result.plan_status).toBe(KioscoPlanStatusEnum.Trial);
        expect(mockedAuthSchema.findOneAndUpdate).not.toHaveBeenCalled();
    });
});

describe('PlanService.getSellsDateFloor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('plan Deluxe (reportsScope full) => sin piso de fecha (null)', async () => {
        mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Deluxe }) as never);

        const result = await PlanService.getSellsDateFloor('kiosco-1');

        expect(result).toBeNull();
    });

    it('plan Standard (reportsScope currentMonth) => piso en el día 1 del mes actual', async () => {
        mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
        mockedAuthSchema.findOne.mockReturnValueOnce(lean({ plan: KioscoPlanEnum.Standard }) as never);

        const now = new Date();
        const result = await PlanService.getSellsDateFloor('kiosco-1');

        expect(result).toEqual(new Date(now.getFullYear(), now.getMonth(), 1));
    });
});
