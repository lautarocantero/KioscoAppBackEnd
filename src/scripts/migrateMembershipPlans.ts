/*──────────────────────────────
💳 migrateMembershipPlans
──────────────────────────────
📜 Propósito:
Script ÚNICO Y MANUAL (no se corre en el boot de la app) que backfillea
`plan`/`plan_status`/`mp_preapproval_id` en las cuentas (Auth) creadas ANTES
de este feature. Mongoose solo aplica `default` al crear un documento
nuevo — las cuentas viejas simplemente no tienen esos campos en Mongo, lo
que rompe la validación Zod del frontend (GET /membership/status espera
`plan` ∈ KioscoPlanEnum, y `undefined` no matchea).

El plan solía vivir en Kiosco (una versión anterior de este mismo feature);
si el usuario ya era dueño de un kiosco con un plan pago, ese plan se
migra a su cuenta en vez de resetearlo a Standard (los kioscos viejos
todavía tienen ese campo en Mongo aunque el schema actual ya no lo declare
— `.lean()` lo sigue leyendo igual).

▶️ Idempotente: solo toca cuentas donde falte alguno de los 3 campos.

🖥️ Uso:
   npm run migrate:membership-plans
   (usa MONGODB_URI del .env)
──────────────────────────────*/

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { AuthSchema } from '../schemas/authSchema';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../typings/membership/enums';

type LegacyKioscoPlanFields = { owner_id: string; plan?: KioscoPlanEnum; plan_status?: KioscoPlanStatusEnum; mp_preapproval_id?: string | null };

async function migrate(): Promise<void> {
    await connectDB();

    const filter = {
        $or: [
            { plan: { $exists: false } },
            { plan_status: { $exists: false } },
            { mp_preapproval_id: { $exists: false } },
        ],
    };

    const authsToBackfill = await AuthSchema.find(filter, { _id: 1 }).lean();

    let migratedFromKiosco = 0;
    let backfilledWithDefault = 0;

    for (const auth of authsToBackfill) {
        // Kioscos viejos (pre-refactor) todavía pueden tener plan/plan_status/
        // mp_preapproval_id en Mongo aunque el schema actual no los declare.
        const ownedKiosco = await KioscoSchema.findOne(
            { owner_id: auth._id, plan: { $exists: true } },
        ).lean() as unknown as LegacyKioscoPlanFields | null;

        if (ownedKiosco?.plan) migratedFromKiosco += 1;
        else backfilledWithDefault += 1;

        await AuthSchema.updateOne({ _id: auth._id }, {
            $set: {
                plan: ownedKiosco?.plan ?? KioscoPlanEnum.Standard,
                plan_status: ownedKiosco?.plan_status ?? KioscoPlanStatusEnum.Active,
                mp_preapproval_id: ownedKiosco?.mp_preapproval_id ?? null,
            },
        });
    }

    console.log(`✅ cuentas: ${migratedFromKiosco} migrada(s) desde su kiosco propio, ${backfilledWithDefault} con default Standard`);
    console.log('🎉 Migración completa.');
    await mongoose.disconnect();
}

migrate().catch((error) => {
    console.error('❌ Error corriendo la migración:', error);
    process.exit(1);
});
