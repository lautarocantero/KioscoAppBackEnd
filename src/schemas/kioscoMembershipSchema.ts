/*──────────────────────────────
🪪 KioscoMembershipSchema
──────────────────────────────
🧩 Campos:
- _id               → Identificador único (String, requerido)
- kiosco_id         → FK → Kiosco._id (String, requerido)
- user_id           → FK → Auth._id / Seller._id (String, requerido)
- role              → 'admin' | 'seller', por kiosco (String, requerido)
- joined_at         → Fecha de alta a ese kiosco (String, requerido)
- last_accessed_at  → Última vez que entró a ese kiosco (String, opcional)

🔑 Índice único compuesto (kiosco_id, user_id): un usuario no puede tener
   dos membresías en el mismo kiosco.
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { KioscoMembershipSchemaType } from '@typings/kioscoMembership';
// Import relativo (no @typings): acá se usa como VALOR (enum: Object.values(...)),
// y el alias solo resuelve en tiempo de compilación, no en runtime (ts-node-dev).
import { AuthRoleEnum } from '../typings/auth/enums';

const KioscoMembershipMongoSchema = new Schema<KioscoMembershipSchemaType>({
    _id:               { type: String, required: true },
    kiosco_id:         { type: String, required: true, index: true },
    user_id:           { type: String, required: true, index: true },
    role: {
      type: String,
      enum: Object.values(AuthRoleEnum),
      required: true,
      default: AuthRoleEnum.Seller,
    },
    joined_at:         { type: String, required: true },
    last_accessed_at:  { type: String, required: false, default: null },
}, { _id: false });

KioscoMembershipMongoSchema.index({ kiosco_id: 1, user_id: 1 }, { unique: true });

export const KioscoMembershipSchema = mongoose.models.KioscoMembership ||
    mongoose.model<KioscoMembershipSchemaType>('KioscoMembership', KioscoMembershipMongoSchema, 'kiosco_memberships');
