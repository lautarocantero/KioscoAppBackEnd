import DBLocal from 'db-local';
import { AuthSchemaType } from '@typings/auth';

const { Schema } = new DBLocal({ path: './db'});

/*──────────────────────────────
🗂️ AuthSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de autenticación para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id          → Identificador único (String, requerido)
- username     → Nombre de usuario (String, requerido)
- email        → Correo electrónico (String, requerido)
- password     → Contraseña encriptada (String, requerido)
- refreshToken → Token de refresco (String, opcional)
- profilePhoto → URL de foto de perfil (String, opcional)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

export const AuthSchema = Schema<AuthSchemaType>('Auth', {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    refreshToken: { type: String, required: false },
    profilePhoto: { type: String, required: false },
});
