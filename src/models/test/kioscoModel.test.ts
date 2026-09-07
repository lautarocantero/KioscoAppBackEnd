import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KioscoModel } from '../kioscoModel';
import { KioscoSchema } from '../../schemas/kioscoSchema';
import { KioscoMembershipSchema } from '../../schemas/kioscoMembershipSchema';
import { SellSchema } from '../../schemas/sellSchema';
import { SellerSchema } from '../../schemas/sellerSchema';
import { AuthSchema } from '../../schemas/authSchema';
import { PlanService } from '../../services/planService';
import { KioscoPlanEnum } from '../../typings/membership/enums';
import { AuthRoleEnum } from '../../typings/auth/enums';

vi.mock('../../schemas/kioscoSchema', () => ({
    KioscoSchema: {
        create: vi.fn(),
        findOne: vi.fn(),
        find: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock('../../schemas/kioscoMembershipSchema', () => ({
    KioscoMembershipSchema: {
        findOne: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        countDocuments: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
    },
}));

vi.mock('../../schemas/sellSchema', () => ({
    SellSchema: { find: vi.fn() },
}));

vi.mock('../../schemas/sellerSchema', () => ({
    SellerSchema: { find: vi.fn() },
}));

vi.mock('../../schemas/authSchema', () => ({
    AuthSchema: { find: vi.fn() },
}));

vi.mock('../../services/planService', () => ({
    PlanService: { getUserPlan: vi.fn() },
}));

const mockedKioscoSchema = vi.mocked(KioscoSchema);
const mockedKioscoMembershipSchema = vi.mocked(KioscoMembershipSchema);
const mockedSellSchema = vi.mocked(SellSchema);
const mockedSellerSchema = vi.mocked(SellerSchema);
const mockedAuthSchema = vi.mocked(AuthSchema);
const mockedPlanService = vi.mocked(PlanService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

describe('KioscoModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMembership', () => {
        it('devuelve la membresía si existe', async () => {
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean({ role: AuthRoleEnum.Admin }) as never);

            const result = await KioscoModel.getMembership('kiosco-1', 'user-1');

            expect(mockedKioscoMembershipSchema.findOne).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', user_id: 'user-1' });
            expect(result).toEqual({ role: AuthRoleEnum.Admin });
        });

        it('devuelve null si el usuario no pertenece al kiosco', async () => {
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean(null) as never);

            const result = await KioscoModel.getMembership('kiosco-1', 'user-1');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        const payload = { name: 'Kiosco Central', address: 'x', owner_id: 'user-1' };

        it('crea el kiosco y la membresía admin del dueño', async () => {
            mockedPlanService.getUserPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedKioscoMembershipSchema.countDocuments.mockResolvedValueOnce(0);
            mockedKioscoSchema.create.mockResolvedValueOnce({ toObject: () => ({ _id: 'kiosco-1', name: 'Kiosco Central' }) } as never);
            mockedKioscoMembershipSchema.create.mockResolvedValueOnce(undefined as never);

            const result = await KioscoModel.create(payload);

            expect(result).toEqual({ _id: 'kiosco-1', name: 'Kiosco Central' });
            expect(mockedKioscoMembershipSchema.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-1', role: AuthRoleEnum.Admin }));
        });

        it('lanza error si la cuenta alcanzó el límite de kioscos de su plan', async () => {
            mockedPlanService.getUserPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedKioscoMembershipSchema.countDocuments.mockResolvedValueOnce(1);

            await expect(KioscoModel.create(payload)).rejects.toThrow('Your account reached its kiosco limit for the current plan. Upgrade to Deluxe to create more.');
            expect(mockedKioscoSchema.create).not.toHaveBeenCalled();
        });

        it('no chequea límite si el plan no tiene tope (Deluxe)', async () => {
            mockedPlanService.getUserPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
            mockedKioscoSchema.create.mockResolvedValueOnce({ toObject: () => ({ _id: 'kiosco-1' }) } as never);
            mockedKioscoMembershipSchema.create.mockResolvedValueOnce(undefined as never);

            await KioscoModel.create(payload);

            expect(mockedKioscoMembershipSchema.countDocuments).not.toHaveBeenCalled();
        });
    });

    describe('join', () => {
        const payload = { invite_code: 'ABC12345', user_id: 'user-2' };
        const kiosco = { _id: 'kiosco-1', owner_id: 'owner-1' };

        it('suma al usuario como seller si hay cupo', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(kiosco) as never);
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean(null) as never);
            mockedPlanService.getUserPlan
                .mockResolvedValueOnce(KioscoPlanEnum.Standard) // owner
                .mockResolvedValueOnce(KioscoPlanEnum.Standard); // joiner
            mockedKioscoMembershipSchema.countDocuments
                .mockResolvedValueOnce(1) // member count del kiosco (< 2)
                .mockResolvedValueOnce(0); // membership count del joiner (< 1)
            mockedKioscoMembershipSchema.create.mockResolvedValueOnce(undefined as never);

            const result = await KioscoModel.join(payload);

            expect(result).toEqual(kiosco);
            expect(mockedKioscoMembershipSchema.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-2', role: AuthRoleEnum.Seller }));
        });

        it('lanza error si el código de invitación no existe', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(KioscoModel.join(payload)).rejects.toThrow('Invalid invite code');
        });

        it('lanza error si el usuario ya pertenece al kiosco', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(kiosco) as never);
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean({ _id: 'membership-1' }) as never);

            await expect(KioscoModel.join(payload)).rejects.toThrow('You already belong to this kiosco');
        });

        it('lanza error si el kiosco ya alcanzó el tope de miembros de su dueño', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(kiosco) as never);
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean(null) as never);
            mockedPlanService.getUserPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedKioscoMembershipSchema.countDocuments.mockResolvedValueOnce(2);

            await expect(KioscoModel.join(payload)).rejects.toThrow('This kiosco reached its plan member limit');
        });

        it('lanza error si el que se une ya está en el tope de membresías y el dueño no es Deluxe', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(kiosco) as never);
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean(null) as never);
            mockedPlanService.getUserPlan
                .mockResolvedValueOnce(KioscoPlanEnum.Standard) // owner
                .mockResolvedValueOnce(KioscoPlanEnum.Standard); // joiner
            mockedKioscoMembershipSchema.countDocuments
                .mockResolvedValueOnce(1) // kiosco member count ok
                .mockResolvedValueOnce(1); // joiner ya en el tope (1 >= 1)

            await expect(KioscoModel.join(payload)).rejects.toThrow('Ask this kiosco\'s admin to upgrade to Deluxe');
        });

        it('permite unirse pese al tope propio si el dueño del kiosco es Deluxe', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(kiosco) as never);
            mockedKioscoMembershipSchema.findOne.mockReturnValueOnce(lean(null) as never);
            mockedPlanService.getUserPlan
                .mockResolvedValueOnce(KioscoPlanEnum.Deluxe) // owner: sin tope de miembros, y excepción para el joiner
                .mockResolvedValueOnce(KioscoPlanEnum.Standard); // joiner
            mockedKioscoMembershipSchema.create.mockResolvedValueOnce(undefined as never);

            await KioscoModel.join(payload);

            expect(mockedKioscoMembershipSchema.create).toHaveBeenCalled();
        });
    });

    describe('getMyKioscos', () => {
        it('devuelve un array vacío si el usuario no tiene membresías', async () => {
            mockedKioscoMembershipSchema.find.mockReturnValueOnce(lean([]) as never);

            const result = await KioscoModel.getMyKioscos({ user_id: 'user-1' });

            expect(result).toEqual([]);
            expect(mockedKioscoSchema.find).not.toHaveBeenCalled();
        });

        it('agrega rol, cantidad de miembros y ventas de hoy a cada kiosco', async () => {
            const today = new Date().toISOString();
            mockedKioscoMembershipSchema.find
                .mockReturnValueOnce(lean([{ kiosco_id: 'kiosco-1', role: AuthRoleEnum.Admin, last_accessed_at: 'ayer' }]) as never)
                .mockReturnValueOnce(lean([{ kiosco_id: 'kiosco-1' }, { kiosco_id: 'kiosco-1' }]) as never);
            mockedKioscoSchema.find.mockReturnValueOnce(lean([{ _id: 'kiosco-1', name: 'Central' }]) as never);
            mockedSellSchema.find.mockReturnValueOnce(lean([
                { kiosco_id: 'kiosco-1', purchase_date: today, total_amount: 500 },
                { kiosco_id: 'kiosco-1', purchase_date: today, total_amount: 250 },
            ]) as never);

            const result = await KioscoModel.getMyKioscos({ user_id: 'user-1' });

            expect(result).toEqual([expect.objectContaining({
                _id: 'kiosco-1', name: 'Central', role: AuthRoleEnum.Admin, sellers_count: 2, sells_today_total: 750, last_accessed_at: 'ayer',
            })]);
        });
    });

    describe('getInviteInfo', () => {
        it('devuelve el código y el link de invitación', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ invite_code: 'ABC12345' }) as never);

            const result = await KioscoModel.getInviteInfo({ kiosco_id: 'kiosco-1' }, 'https://app.stocko.com');

            expect(result).toEqual({ invite_code: 'ABC12345', invite_link: 'https://app.stocko.com/join-kiosco?code=ABC12345' });
        });

        it('lanza error si el kiosco no existe', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(KioscoModel.getInviteInfo({ kiosco_id: 'kiosco-1' }, 'https://app.stocko.com')).rejects.toThrow('Kiosco not found');
        });
    });

    describe('edit', () => {
        it('actualiza solo los campos provistos más updated_at', async () => {
            mockedKioscoSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'kiosco-1' } as never);

            await KioscoModel.edit({ kiosco_id: 'kiosco-1', name: 'Nuevo nombre' });

            expect(mockedKioscoSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'kiosco-1' },
                { $set: { updated_at: expect.any(String), name: 'Nuevo nombre' } },
            );
        });

        it('lanza error si el kiosco no existe', async () => {
            mockedKioscoSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(KioscoModel.edit({ kiosco_id: 'kiosco-1', name: 'Nuevo' })).rejects.toThrow('There is not any kiosco with that id');
        });
    });

    describe('select', () => {
        it('actualiza last_accessed_at de la membresía', async () => {
            mockedKioscoMembershipSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'membership-1' } as never);

            await KioscoModel.select({ kiosco_id: 'kiosco-1', user_id: 'user-1' });

            expect(mockedKioscoMembershipSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { kiosco_id: 'kiosco-1', user_id: 'user-1' },
                { $set: { last_accessed_at: expect.any(String) } },
            );
        });

        it('lanza error si el usuario no es miembro del kiosco', async () => {
            mockedKioscoMembershipSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(KioscoModel.select({ kiosco_id: 'kiosco-1', user_id: 'user-1' })).rejects.toThrow('You are not a member of this kiosco');
        });
    });

    describe('getSellersOfKiosco', () => {
        it('combina Seller + email de Auth + rol de la membresía', async () => {
            mockedKioscoMembershipSchema.find.mockReturnValueOnce(lean([{ user_id: 'user-1', role: AuthRoleEnum.Admin, joined_at: 'hoy' }]) as never);
            mockedSellerSchema.find.mockReturnValueOnce(lean([{ _id: 'user-1', name: 'Ana', profilePhoto: null, user_status: 'online', created_at: 'hoy' }]) as never);
            mockedAuthSchema.find.mockReturnValueOnce(lean([{ _id: 'user-1', email: 'ana@a.com' }]) as never);

            const result = await KioscoModel.getSellersOfKiosco('kiosco-1');

            expect(result).toEqual([{
                _id: 'user-1', name: 'Ana', profilePhoto: null, email: 'ana@a.com',
                role: AuthRoleEnum.Admin, user_status: 'online', created_at: 'hoy', joined_at: 'hoy',
            }]);
        });

        it('devuelve un array vacío si el kiosco no tiene miembros', async () => {
            mockedKioscoMembershipSchema.find.mockReturnValueOnce(lean([]) as never);

            const result = await KioscoModel.getSellersOfKiosco('kiosco-1');

            expect(result).toEqual([]);
            expect(mockedSellerSchema.find).not.toHaveBeenCalled();
        });
    });

    describe('removeMember', () => {
        it('elimina la membresía de un vendedor que no es el dueño', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
            mockedKioscoMembershipSchema.findOneAndDelete.mockResolvedValueOnce({ _id: 'membership-1' } as never);

            await KioscoModel.removeMember('kiosco-1', 'user-2');

            expect(mockedKioscoMembershipSchema.findOneAndDelete).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', user_id: 'user-2' });
        });

        it('rechaza sacar al dueño del kiosco', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);

            await expect(KioscoModel.removeMember('kiosco-1', 'owner-1')).rejects.toThrow('Cannot modify the kiosco owner\'s membership');
            expect(mockedKioscoMembershipSchema.findOneAndDelete).not.toHaveBeenCalled();
        });

        it('lanza error si el usuario no es miembro del kiosco', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
            mockedKioscoMembershipSchema.findOneAndDelete.mockResolvedValueOnce(null as never);

            await expect(KioscoModel.removeMember('kiosco-1', 'user-2')).rejects.toThrow('This user is not a member of the kiosco');
        });
    });

    describe('updateMemberRole', () => {
        it('actualiza el rol de un vendedor que no es el dueño', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
            mockedKioscoMembershipSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'membership-1' } as never);

            await KioscoModel.updateMemberRole('kiosco-1', 'user-2', AuthRoleEnum.Admin);

            expect(mockedKioscoMembershipSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { kiosco_id: 'kiosco-1', user_id: 'user-2' },
                { $set: { role: AuthRoleEnum.Admin } },
            );
        });

        it('rechaza cambiar el rol del dueño', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);

            await expect(KioscoModel.updateMemberRole('kiosco-1', 'owner-1', AuthRoleEnum.Seller)).rejects.toThrow('Cannot modify the kiosco owner\'s membership');
        });

        it('lanza error si el rol no es admin ni seller', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);

            await expect(KioscoModel.updateMemberRole('kiosco-1', 'user-2', 'superadmin')).rejects.toThrow('Invalid role');
        });

        it('lanza error si el usuario no es miembro del kiosco', async () => {
            mockedKioscoSchema.findOne.mockReturnValueOnce(lean({ owner_id: 'owner-1' }) as never);
            mockedKioscoMembershipSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(KioscoModel.updateMemberRole('kiosco-1', 'user-2', AuthRoleEnum.Admin)).rejects.toThrow('This user is not a member of the kiosco');
        });
    });
});
