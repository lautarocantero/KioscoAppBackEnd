/*──────────────────────────────
💳 migrateMembershipPlans
──────────────────────────────
📜 Propósito:
Script ÚNICO Y MANUAL (no se corre en el boot de la app) que backfillea
`plan`/`plan_status`/`mp_preapproval_id` en los kioscos creados ANTES del
feature de membresías. Mongoose solo aplica `default` al crear un
documento nuevo — los kioscos viejos simplemente no tienen esos campos en
Mongo, lo que rompe la validación Zod del frontend (GET /membership/status
espera `plan` ∈ KioscoPlanEnum, y `undefined` no matchea).

▶️ Idempotente: solo toca kioscos donde falte alguno de los 3 campos.

🖥️ Uso:
   npm run migrate:membership-plans
   (usa MONGODB_URI del .env)
──────────────────────────────*/

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../typings/membership/enums';

async function migrate(): Promise<void> {
    await connectDB();

    const filter = {
        $or: [
            { plan: { $exists: false } },
            { plan_status: { $exists: false } },
            { mp_preapproval_id: { $exists: false } },
        ],
    };

    const result = await KioscoSchema.updateMany(filter, {
        $set: {
            plan: KioscoPlanEnum.Stocko,
            plan_status: KioscoPlanStatusEnum.Active,
            mp_preapproval_id: null,
        },
    });

    console.log(`✅ kioscos: ${result.modifiedCount} documento(s) backfilleados con plan/plan_status por defecto`);
    console.log('🎉 Migración completa.');
    await mongoose.disconnect();
}

migrate().catch((error) => {
    console.error('❌ Error corriendo la migración:', error);
    process.exit(1);
});
