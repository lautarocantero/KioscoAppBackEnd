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
- product.schema.ts → Esquema de productos
- productVariant.schema.ts → Esquema de variantes de producto
- provider.schema.ts → Esquema de proveedores
- sell.schema.ts → Esquema de ventas
- seller.schema.ts → Esquema de vendedores

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
- gallery_urls  → Galería de imágenes (Array, requerido)
- brand         → Marca (String, requerido)
- variants      → Variantes asociadas (Array, requerido)

──────────────────────────────
🎭 ProductVariantSchema