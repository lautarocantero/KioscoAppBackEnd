
/*──────────────────────────────
🧑‍💼 SellerSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de vendedores para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id         → Identificador único (String, requerido)
- name        → Nombre del vendedor (String, requerido)
- email       → Correo electrónico (String, requerido)
- password    → Contraseña encriptada (String, requerido)
- rol         → Rol del vendedor (String, requerido)
- created_at  → Fecha de creación (String, requerido)
- user_status → Estado del usuario (String, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { SellerSchemaType } from '@typings/seller';

const SellerMongoSchema = new Schema<SellerSchemaType>({
    _id:         { type: String, required: true },
    name:        { type: String, required: true },
    email:       { type: String, required: true },
    password:    { type: String, required: true },
    rol:         { type: String, required: true },
    created_at:  { type: String, required: true },
    user_status: { type: String, required: true },
}, { _id: false });

export const SellerSchema = mongoose.models.Seller ||
    mongoose.model<SellerSchemaType>('Seller', SellerMongoSchema, 'sellers');