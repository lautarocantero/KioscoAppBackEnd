/*──────────────────────────────
🏪 migrateToKiosco
──────────────────────────────
📜 Propósito:
Script ÚNICO Y MANUAL (no se corre en el boot de la app) que convierte una
base "un solo kiosco implícito" en el nuevo modelo multi-kiosco:

  1. Crea UN kiosco por defecto ("Mi Kiosco"), dueño = el primer usuario
     con role legado 'admin' (o el primer Auth que exista si no hay ninguno).
  2. Le asigna ese kiosco_id a TODO lo que hoy no lo tiene: products,
     presentations, providers, sells, notifications.
  3. Crea una KioscoMembership para cada Auth existente, usando su role
     legado (Auth.role, campo que el código ya no define pero que puede
     seguir presente en documentos viejos — se lee "en crudo").

▶️ Idempotente: si ya existe algún Kiosco, no hace nada (asume que la
   migración ya corrió).

🖥️ Uso:
   MONGODB_URI=<tu-uri-real> npx ts-node src/scripts/migrateToKiosco.ts
   (o `npm run migrate:kiosco` si MONGODB_URI ya está en tu .env)

⚠️ Corré esto primero contra un Mongo de prueba/local (docker-compose) y
   confirmá el resultado antes de correrlo contra la base real.
──────────────────────────────*/

import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { KioscoMembershipSchema } from '../schemas/kioscoMembershipSchema';
import { AuthSchema } from '../schemas/authSchema';
import { ProductMongo } from '../schemas/productSchema';
import { PresentationMongo } from '../schemas/presentationSchema';
import { ProviderSchema } from '../schemas/providerSchema';
import { SellSchema } from '../schemas/sellSchema';
import { NotificationSchema } from '../schemas/notificationSchema';
import { AuthRoleEnum } from '../typings/auth/enums';

const DEFAULT_KIOSCO_NAME = 'Mi Kiosco';
const DEFAULT_KIOSCO_ADDRESS = '';

function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
}

async function migrate(): Promise<void> {
  await connectDB();

  const existingKiosco = await KioscoSchema.findOne().lean();
  if (existingKiosco) {
    console.log('⏭️  Ya existe al menos un Kiosco — la migración ya corrió antes. No se hace nada.');
    await mongoose.disconnect();
    return;
  }

  // Se lee "en crudo" (sin pasar por el schema tipado, que ya no declara `role`)
  // porque documentos viejos todavía pueden tener ese campo en Mongo.
  const authDocs = await AuthSchema.find().lean() as unknown as { _id: string; role?: string }[];

  if (authDocs.length === 0) {
    console.log('⏭️  No hay usuarios (Auth) en la base — nada para migrar.');
    await mongoose.disconnect();
    return;
  }

  const ownerCandidate = authDocs.find((a) => a.role === AuthRoleEnum.Admin) ?? authDocs[0];
  const now = new Date().toISOString();
  const kioscoId = crypto.randomUUID();

  await KioscoSchema.create({
    _id: kioscoId,
    name: DEFAULT_KIOSCO_NAME,
    address: DEFAULT_KIOSCO_ADDRESS,
    owner_id: ownerCandidate._id,
    invite_code: generateInviteCode(),
    currency: 'ARS',
    created_at: now,
    updated_at: now,
  });
  console.log(`✅ Kiosco por defecto creado: "${DEFAULT_KIOSCO_NAME}" (_id: ${kioscoId}), owner: ${ownerCandidate._id}`);

  const backfillFilter = { $or: [{ kiosco_id: { $exists: false } }, { kiosco_id: null }] };
  const backfillUpdate = { $set: { kiosco_id: kioscoId } };

  const productsResult = await ProductMongo.updateMany(backfillFilter, backfillUpdate);
  console.log(`✅ products: ${productsResult.modifiedCount} documento(s) actualizados con kiosco_id`);

  const presentationsResult = await PresentationMongo.updateMany(backfillFilter, backfillUpdate);
  console.log(`✅ presentations: ${presentationsResult.modifiedCount} documento(s) actualizados con kiosco_id`);

  const providersResult = await ProviderSchema.updateMany(backfillFilter, backfillUpdate);
  console.log(`✅ providers: ${providersResult.modifiedCount} documento(s) actualizados con kiosco_id`);

  const sellsResult = await SellSchema.updateMany(backfillFilter, backfillUpdate);
  console.log(`✅ sells: ${sellsResult.modifiedCount} documento(s) actualizados con kiosco_id`);

  const notificationsResult = await NotificationSchema.updateMany(backfillFilter, backfillUpdate);
  console.log(`✅ notifications: ${notificationsResult.modifiedCount} documento(s) actualizados con kiosco_id`);

  let membershipsCreated = 0;
  for (const auth of authDocs) {
    const role = auth.role === AuthRoleEnum.Admin ? AuthRoleEnum.Admin : AuthRoleEnum.Seller;
    await KioscoMembershipSchema.create({
      _id: crypto.randomUUID(),
      kiosco_id: kioscoId,
      user_id: auth._id,
      role,
      joined_at: now,
      last_accessed_at: null,
    });
    membershipsCreated += 1;
  }
  console.log(`✅ ${membershipsCreated} membresía(s) creadas en el kiosco por defecto`);

  console.log('🎉 Migración completa.');
  await mongoose.disconnect();
}

migrate().catch((error) => {
  console.error('❌ Error corriendo la migración:', error);
  process.exit(1);
});
