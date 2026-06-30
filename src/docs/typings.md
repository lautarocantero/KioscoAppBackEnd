/*──────────────────────────────
📘 Typings Overview
──────────────────────────────
📜 Propósito:
Centralizar tipados para entidades, repositorios, payloads y requests.  
Cada archivo en `/typings` define la estructura de datos y contratos que aseguran consistencia entre controladores, esquemas y DB local/SQL.

🧩 Organización:
- AuthTypes.ts → Tipados de autenticación
- ProductTypes.ts → Tipados de productos
- PresentationTypes.ts → Tipados de presentationes de producto
- ProviderTypes.ts → Tipados de proveedores
- SellerTypes.ts → Tipados de vendedores
- SellTypes.ts → Tipados de ventas

🛡️ Filosofía:
- **Entity** → Define la base de datos (local/SQL).
- **Repository** → Expone métodos de acceso (find, findOne, save, remove).
- **PayloadUnknown** → Representa datos sin validar (unknown).
- **Payloads** → Derivados específicos para cada operación (Get, Create, Edit, Delete).
- **Requests** → Tipados de Express para cada endpoint.
- **Public** → Versiones seguras que ocultan campos sensibles (ej. password, tokens).

🌀 Flujo estándar:
[Request] → [Payload] → [Repository] → [Schema] → [DB Local/SQL] → [Response]

──────────────────────────────
🔑 Ejemplo de derivaciones
──────────────────────────────
AuthEntity → AuthSchema → AuthRepository → AuthModelType  
AuthEntity → AuthPublic → AuthPublicSchema  
AuthEntity → AuthPayloadUnknown → AuthPayload → Requests
──────────────────────────────*/
