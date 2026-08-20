/*──────────────────────────────
🏪 KioscoSchema
──────────────────────────────
🧩 Campos:
- _id           → Identificador único (String, requerido)
- name          → Nombre del kiosco (String, requerido)
- address       → Dirección del kiosco (String, requerido)
- owner_id      → Auth._id del usuario que lo creó (String, requerido)
- invite_code   → Código de invitación único (String, requerido)
- currency      → Moneda configurada para este kiosco (String, requerido)
- plan          → Tier de suscripción activo (String, requerido, default 'stocko')
- plan_status   → Estado de la suscripción (String, requerido, default 'active')
- mp_preapproval_id → Id de la última suscripción de Mercado Pago (String, opcional)
- created_at    → Fecha de creación (String, requerido)
- updated_at    → Fecha de última edición (String, requerido)
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { KioscoSchemaType } from '@typings/kiosco';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../typings/membership/enums';

const KioscoMongoSchema = new Schema<KioscoSchemaType>({
    _id:                { type: String, required: true },
    name:               { type: String, required: true },
    address:            { type: String, required: true },
    owner_id:           { type: String, required: true, index: true },
    invite_code:        { type: String, required: true, unique: true },
    currency:           { type: String, required: true, default: 'ARS' },
    plan: {
      type: String,
      enum: Object.values(KioscoPlanEnum),
      required: true,
      default: KioscoPlanEnum.Stocko,
    },
    plan_status: {
      type: String,
      enum: Object.values(KioscoPlanStatusEnum),
      required: true,
      default: KioscoPlanStatusEnum.Active,
    },
    mp_preapproval_id: { type: String, required: false, default: null },
    created_at:         { type: String, required: true },
    updated_at:         { type: String, required: true },
}, { _id: false });

export const KioscoSchema = mongoose.models.Kiosco ||
    mongoose.model<KioscoSchemaType>('Kiosco', KioscoMongoSchema, 'kioscos');
