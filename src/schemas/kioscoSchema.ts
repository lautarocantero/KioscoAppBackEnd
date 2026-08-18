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
- created_at    → Fecha de creación (String, requerido)
- updated_at    → Fecha de última edición (String, requerido)
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { KioscoSchemaType } from '@typings/kiosco';

const KioscoMongoSchema = new Schema<KioscoSchemaType>({
    _id:          { type: String, required: true },
    name:         { type: String, required: true },
    address:      { type: String, required: true },
    owner_id:     { type: String, required: true, index: true },
    invite_code:  { type: String, required: true, unique: true },
    currency:     { type: String, required: true, default: 'ARS' },
    created_at:   { type: String, required: true },
    updated_at:   { type: String, required: true },
}, { _id: false });

export const KioscoSchema = mongoose.models.Kiosco ||
    mongoose.model<KioscoSchemaType>('Kiosco', KioscoMongoSchema, 'kioscos');
