import crypto from 'crypto';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { KioscoMembershipSchema } from '../schemas/kioscoMembershipSchema';
import { SellSchema } from '../schemas/sellSchema';
import { SellerSchema } from '../schemas/sellerSchema';
import { AuthSchema } from '../schemas/authSchema';
import { Validation } from './validation';
import { PlanService } from '../services/planService';
import { PLAN_LIMITS } from '../config/planLimits';
// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum.Deluxe),
// y el alias solo resuelve en tiempo de compilación, no en runtime (ts-node-dev).
import { KioscoPlanEnum } from '../typings/membership/enums';
import {
    CreateKioscoPayload,
    EditKioscoPayload,
    GetInviteInfoPayload,
    GetMyKioscosPayload,
    InviteInfo,
    JoinKioscoPayload,
    Kiosco,
    KioscoWithStats,
    SelectKioscoPayload,
} from '@typings/kiosco';
import { KioscoMembership, KioscoSellerMember } from '@typings/kioscoMembership';
// Import relativo (no @typings): acá se usa como VALOR (AuthRoleEnum.Admin/.Seller),
// y el alias solo resuelve en tiempo de compilación, no en runtime (ts-node-dev).
import { AuthRoleEnum } from '../typings/auth/enums';

/*──────────────────────────────
🏪 KioscoModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión de kioscos y su membresía (quién pertenece a cuál, con qué rol)
──────────────────────────────*/

function generateInviteCode(): string {
    // 8 caracteres alfanuméricos en mayúscula, fáciles de compartir/tipear a mano.
    return crypto.randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
}

export class KioscoModel {

    //──────────────────────────────────────────── 🔎 MEMBERSHIP 🔎 ───────────────────────────────────────────//

    // Usado por el middleware de scoping: null si el usuario no pertenece a ese kiosco.
    static async getMembership(kioscoId: string, userId: string): Promise<KioscoMembership | null> {
        const membership = await KioscoMembershipSchema.findOne({ kiosco_id: kioscoId, user_id: userId }).lean();
        return membership as unknown as KioscoMembership | null;
    }

    //──────────────────────────────────────────── 📤 CREATE 📤 ───────────────────────────────────────────//

    static async create(data: CreateKioscoPayload): Promise<Kiosco> {
        const { name, address, owner_id } = data;

        const nameResult = Validation.stringValidation(name, 'name');
        const addressResult = Validation.stringValidation(address, 'address', 1);

        // El límite de kioscos es de la CUENTA, no de un kiosco puntual: cuenta
        // toda membresía (propia o como vendedor de otro kiosco), porque crear
        // uno nuevo es, en el fondo, sumarse una membresía más.
        const ownerPlan = await PlanService.getUserPlan(owner_id);
        const membershipLimit = PLAN_LIMITS[ownerPlan].maxKioscoMemberships;
        if (membershipLimit !== null) {
            const membershipCount = await KioscoMembershipSchema.countDocuments({ user_id: owner_id });
            if (membershipCount >= membershipLimit) {
                throw new Error('Your account reached its kiosco limit for the current plan. Upgrade to Deluxe to create more.');
            }
        }

        const _id = crypto.randomUUID();
        const now = new Date().toISOString();
        const invite_code = generateInviteCode();

        const kiosco = await KioscoSchema.create({
            _id,
            name: nameResult,
            address: addressResult,
            owner_id,
            invite_code,
            currency: 'ARS',
            created_at: now,
            updated_at: now,
        });

        await KioscoMembershipSchema.create({
            _id: crypto.randomUUID(),
            kiosco_id: _id,
            user_id: owner_id,
            role: AuthRoleEnum.Admin,
            joined_at: now,
            last_accessed_at: now,
        });

        return kiosco.toObject() as unknown as Kiosco;
    }

    //──────────────────────────────────────────── 🤝 JOIN 🤝 ───────────────────────────────────────────//

    static async join(data: JoinKioscoPayload): Promise<Kiosco> {
        const { invite_code, user_id } = data;
        const inviteCodeResult = Validation.stringValidation(invite_code, 'invite_code', 1);

        const kiosco = await KioscoSchema.findOne({ invite_code: inviteCodeResult }).lean();
        if (!kiosco) throw new Error('Invalid invite code');

        const existing = await KioscoMembershipSchema.findOne({ kiosco_id: kiosco._id, user_id }).lean();
        if (existing) throw new Error('You already belong to this kiosco');

        // Tope de miembros del kiosco: se evalúa contra el plan de SU DUEÑO
        // (el kiosco ya no tiene plan propio, ver PlanService).
        const ownerPlan = await PlanService.getUserPlan(kiosco.owner_id);
        const memberLimit = PLAN_LIMITS[ownerPlan].maxKioscoMembers;
        if (memberLimit !== null) {
            const memberCount = await KioscoMembershipSchema.countDocuments({ kiosco_id: kiosco._id });
            if (memberCount >= memberLimit) throw new Error('This kiosco reached its plan member limit');
        }

        // Tope de membresías DE QUIEN SE UNE: cuántos kioscos puede integrar en
        // total su propia cuenta. Excepción: si quien lo invita (el dueño de
        // este kiosco) tiene Deluxe, puede sumarse aunque ya esté en el tope.
        const joinerPlan = await PlanService.getUserPlan(user_id);
        const joinerMembershipLimit = PLAN_LIMITS[joinerPlan].maxKioscoMemberships;
        if (joinerMembershipLimit !== null && ownerPlan !== KioscoPlanEnum.Deluxe) {
            const joinerMembershipCount = await KioscoMembershipSchema.countDocuments({ user_id });
            if (joinerMembershipCount >= joinerMembershipLimit) {
                throw new Error('Your account already belongs to another kiosco. Ask this kiosco\'s admin to upgrade to Deluxe, or upgrade your own plan.');
            }
        }

        const now = new Date().toISOString();
        await KioscoMembershipSchema.create({
            _id: crypto.randomUUID(),
            kiosco_id: kiosco._id,
            user_id,
            role: AuthRoleEnum.Seller,
            joined_at: now,
            last_accessed_at: now,
        });

        return kiosco as unknown as Kiosco;
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    static async getMyKioscos(data: GetMyKioscosPayload): Promise<KioscoWithStats[]> {
        const { user_id } = data;

        const memberships = await KioscoMembershipSchema.find({ user_id }).lean();
        if (memberships.length === 0) return [];

        const kioscoIds = memberships.map((m) => m.kiosco_id);
        const kioscos = await KioscoSchema.find({ _id: { $in: kioscoIds } }).lean();

        const todayStr = new Date().toDateString();
        const sellsRaw = await SellSchema.find(
            { kiosco_id: { $in: kioscoIds } },
            { kiosco_id: 1, purchase_date: 1, total_amount: 1 },
        ).lean();
        const todaySells = (sellsRaw as unknown as { kiosco_id: string; purchase_date: string; total_amount: number }[])
            .filter((sell) => new Date(sell.purchase_date).toDateString() === todayStr);

        const allMembersOfTheseKioscos = await KioscoMembershipSchema.find({ kiosco_id: { $in: kioscoIds } }, { kiosco_id: 1 }).lean();
        const membersCountByKiosco = new Map<string, number>();
        for (const membership of allMembersOfTheseKioscos) {
            membersCountByKiosco.set(membership.kiosco_id, (membersCountByKiosco.get(membership.kiosco_id) ?? 0) + 1);
        }

        const membershipByKiosco = new Map(memberships.map((m) => [m.kiosco_id, m]));

        return kioscos.map((kiosco) => {
            const membership = membershipByKiosco.get(kiosco._id);
            const sellsToday = todaySells.filter((sell) => sell.kiosco_id === kiosco._id);
            return {
                ...(kiosco as unknown as Kiosco),
                role: membership?.role ?? AuthRoleEnum.Seller,
                sellers_count: membersCountByKiosco.get(kiosco._id) ?? 0,
                sells_today_total: sellsToday.reduce((sum, sell) => sum + (sell.total_amount ?? 0), 0),
                last_accessed_at: membership?.last_accessed_at ?? null,
            };
        }) as unknown as KioscoWithStats[];
    }

    static async getInviteInfo(data: GetInviteInfoPayload, frontendUrl: string): Promise<InviteInfo> {
        const { kiosco_id } = data;
        const kioscoIdResult = Validation.stringValidation(kiosco_id, 'kiosco_id');

        const kiosco = await KioscoSchema.findOne({ _id: kioscoIdResult }).lean();
        if (!kiosco) throw new Error('Kiosco not found');

        return {
            invite_code: kiosco.invite_code,
            invite_link: `${frontendUrl}/join-kiosco?code=${kiosco.invite_code}`,
        };
    }

    //──────────────────────────────────────────── 🛠️ EDIT 🛠️ ───────────────────────────────────────────//

    static async edit(data: EditKioscoPayload): Promise<void> {
        const { kiosco_id, name, address, currency } = data;
        const kioscoIdResult = Validation.stringValidation(kiosco_id, 'kiosco_id');

        const setFields: Partial<Kiosco> = { updated_at: new Date().toISOString() };
        if (name !== undefined) setFields.name = Validation.stringValidation(name, 'name');
        if (address !== undefined) setFields.address = Validation.stringValidation(address, 'address', 1);
        if (currency !== undefined) setFields.currency = Validation.stringValidation(currency, 'currency', 1);

        const updated = await KioscoSchema.findOneAndUpdate({ _id: kioscoIdResult }, { $set: setFields });
        if (!updated) throw new Error('There is not any kiosco with that id');
    }

    static async select(data: SelectKioscoPayload): Promise<void> {
        const { kiosco_id, user_id } = data;
        const kioscoIdResult = Validation.stringValidation(kiosco_id, 'kiosco_id');

        const updated = await KioscoMembershipSchema.findOneAndUpdate(
            { kiosco_id: kioscoIdResult, user_id },
            { $set: { last_accessed_at: new Date().toISOString() } },
        );
        if (!updated) throw new Error('You are not a member of this kiosco');
    }

    //──────────────────────────────────────────── 👥 MEMBERS 👥 ───────────────────────────────────────────//

    // Vendedores de un kiosco: perfil (Seller) + email (Auth) + rol (KioscoMembership).
    static async getSellersOfKiosco(kioscoId: string): Promise<KioscoSellerMember[]> {
        const memberships = await KioscoMembershipSchema.find({ kiosco_id: kioscoId }).lean();
        if (memberships.length === 0) return [];

        const userIds = memberships.map((m) => m.user_id);
        const [sellers, authData] = await Promise.all([
            SellerSchema.find({ _id: { $in: userIds } }).lean(),
            AuthSchema.find({ _id: { $in: userIds } }, { _id: 1, email: 1 }).lean(),
        ]);

        const emailMap = new Map(authData.map((a) => [a._id, a.email]));
        const membershipMap = new Map(memberships.map((m) => [m.user_id, m]));

        return sellers.map((seller) => {
            const membership = membershipMap.get(seller._id);
            return {
                _id: seller._id,
                name: seller.name,
                profilePhoto: seller.profilePhoto,
                email: emailMap.get(seller._id) ?? '',
                role: membership?.role ?? AuthRoleEnum.Seller,
                user_status: seller.user_status,
                created_at: seller.created_at,
                joined_at: membership?.joined_at ?? '',
            };
        }) as unknown as KioscoSellerMember[];
    }

    // No permite sacar/degradar al dueño del kiosco (siempre queda al menos un admin).
    private static async assertNotOwner(kioscoId: string, userId: string): Promise<void> {
        const kiosco = await KioscoSchema.findOne({ _id: kioscoId }).lean();
        if (!kiosco) throw new Error('Kiosco not found');
        if (kiosco.owner_id === userId) throw new Error('Cannot modify the kiosco owner\'s membership');
    }

    static async removeMember(kioscoId: string, userId: string): Promise<void> {
        await this.assertNotOwner(kioscoId, userId);

        const deleted = await KioscoMembershipSchema.findOneAndDelete({ kiosco_id: kioscoId, user_id: userId });
        if (!deleted) throw new Error('This user is not a member of the kiosco');
    }

    static async updateMemberRole(kioscoId: string, userId: string, role: unknown): Promise<void> {
        await this.assertNotOwner(kioscoId, userId);
        if (role !== AuthRoleEnum.Admin && role !== AuthRoleEnum.Seller) throw new Error('Invalid role');

        const updated = await KioscoMembershipSchema.findOneAndUpdate(
            { kiosco_id: kioscoId, user_id: userId },
            { $set: { role } },
        );
        if (!updated) throw new Error('This user is not a member of the kiosco');
    }
}
