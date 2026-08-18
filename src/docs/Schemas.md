/*──────────────────────────────
📘 Schemas.md
──────────────────────────────
📜 Propósito:
Centralizar la documentación de todos los esquemas del proyecto.  
Cada archivo en `/schemas` define la estructura de datos para la base de datos **local**.  
Estos esquemas actúan como **respaldo offline** en caso de falta de internet.  
Cuando haya conexión, las consultas se realizan contra la base de datos **SQL oficial**.

🧩 Organización:
- auth.schema.ts → Esquema de autenticación
- kioscoSchema.ts → Esquema de kioscos (multi-tenant)
- kioscoMembershipSchema.ts → Esquema de membresías usuario↔kiosco (rol por-kiosco)
- product.schema.ts → Esquema de productos
- presentation.schema.ts → Esquema de presentationes de producto
- provider.schema.ts → Esquema de proveedores
- sell.schema.ts → Esquema de ventas
- seller.schema.ts → Esquema de vendedores

🏪 Multi-kiosco: `product.schema.ts`, `presentation.schema.ts`,
`provider.schema.ts`, `sell.schema.ts` y `notification.schema.ts` tienen
además un campo `kiosco_id` (String, requerido, indexado) — todo dato de
negocio queda aislado por kiosco. `auth.schema.ts` perdió su campo
`role`: el rol ahora es por-kiosco, vive en `kioscoMembershipSchema.ts`.

🛡️ Filosofía:
- Los esquemas locales NO reemplazan la base SQL, solo actúan como fallback.
- Los datos aquí son temporales y se sincronizan con SQL cuando hay conexión.
- Se utilizan con `db-local` para mantener consistencia en la estructura de datos.

🌀 Flujo estándar:
[Request] → [Router] → [Controller] → [Schema] → [DB Local/SQL] → [Response]

📍📜 Mapa de esquemas:

──────────────────────────────
🔑 AuthSchema
──────────────────────────────
- _id           → Identificador único (String, requerido)
- username      → Nombre de usuario (String, requerido)
- email         → Correo electrónico (String, requerido)
- password      → Contraseña encriptada (String, requerido)
- refreshToken  → Token de refresco (String, opcional)
- profilePhoto  → URL de foto de perfil (String, opcional)

──────────────────────────────
📦 ProductSchema
──────────────────────────────
- _id           → Identificador único (String, requerido)
- name          → Nombre del producto (String, requerido)
- description   → Descripción (String, requerido)
- created_at    → Fecha de creación (String, requerido)
- updated_at    → Fecha de última actualización (String, requerido)
- image_url     → Imagen principal (String, requerido)
- brand         → Marca (String, requerido)
- presentations      → Variantes asociadas (Array, requerido)

──────────────────────────────
🏪 KioscoSchema
──────────────────────────────
- _id           → Identificador único (String, requerido)
- name          → Nombre del kiosco (String, requerido)
- address       → Dirección del kiosco (String, requerido)
- owner_id      → Auth._id del usuario que lo creó (String, requerido)
- invite_code   → Código de invitación único (String, requerido, unique)
- currency      → Moneda configurada para este kiosco (String, requerido, default 'ARS')
- created_at    → Fecha de creación (String, requerido)
- updated_at    → Fecha de última edición (String, requerido)

──────────────────────────────
🪪 KioscoMembershipSchema
──────────────────────────────
- _id               → Identificador único (String, requerido)
- kiosco_id         → FK → Kiosco._id (String, requerido, indexado)
- user_id           → FK → Auth._id / Seller._id (String, requerido, indexado)
- role              → 'admin' | 'seller', el rol de ESTE usuario en ESTE kiosco (String, requerido)
- joined_at         → Fecha de alta a ese kiosco (String, requerido)
- last_accessed_at  → Última vez que entró a ese kiosco (String, opcional)

Índice único compuesto `(kiosco_id, user_id)`: un usuario no puede tener
dos membresías en el mismo kiosco. Este es el schema que reemplazó al
campo `role` que antes vivía directo en `AuthSchema`.

──────────────────────────────
🎭 PresentationSchema