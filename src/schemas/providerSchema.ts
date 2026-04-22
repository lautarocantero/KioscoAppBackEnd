/*──────────────────────────────
🏢 ProviderSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de proveedores para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id              → Identificador único (String, requerido)
- name             → Nombre del proveedor (String, requerido)
- valoration       → Valoración del proveedor (Number, opcional)
- contact_phone    → Teléfono de contacto principal (String, requerido)
- contact_auxiliar → Teléfono de contacto auxiliar (String, opcional)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { ProviderSchemaType } from '@typings/provider';

const ProviderMongoSchema = new Schema<ProviderSchemaType>({
    _id:              { type: String, required: true },
    name:             { type: String, required: true },
    valoration:       { type: Number, required: false },
    contact_phone:    { type: String, required: true },
    contact_auxiliar: { type: String, required: false },
}, { _id: false });

export const ProviderSchema = mongoose.models.Provider ||
    mongoose.model<ProviderSchemaType>('Provider', ProviderMongoSchema, 'providers');