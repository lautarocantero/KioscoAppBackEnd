/*──────────────────────────────
🏢 ProviderSchema
──────────────────────────────
🧩 Campos:
- _id            → Identificador único (String, requerido)
- name           → Nombre del proveedor (String, requerido)
- valoration     → Valoración del proveedor, 1 a 5 (Number, requerido)
- contact_phone  → Teléfono de contacto (String, requerido)
- contact_email  → Email de contacto (String, requerido)
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { ProviderSchemaType } from '@typings/provider';

const ProviderMongoSchema = new Schema<ProviderSchemaType>({
    _id:            { type: String, required: true },
    kiosco_id:      { type: String, required: true, index: true },
    name:           { type: String, required: true },
    valoration:     { type: Number, required: true, min: 1, max: 5 },
    contact_phone:  { type: String, required: true },
    contact_email:  { type: String, required: true },
}, { _id: false });

export const ProviderSchema = mongoose.models.Provider ||
    mongoose.model<ProviderSchemaType>('Provider', ProviderMongoSchema, 'providers');
