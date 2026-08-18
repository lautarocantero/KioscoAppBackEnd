/*──────────────────────────────
📘 Routes.md
──────────────────────────────
📜 Propósito:
Centralizar la documentación de todas las rutas del proyecto.  
Cada archivo en `/routes` define los endpoints disponibles para un recurso específico y los conecta con sus controladores.

🧩 Organización:
- auth.routes.ts → Rutas de autenticación
- kiosco.routes.ts → Rutas de kioscos (multi-tenant)
- product.routes.ts → Rutas de productos
- presentation.routes.ts → Rutas de presentationes de producto
- provider.routes.ts → Rutas de proveedores
- sell.routes.ts → Rutas de ventas
- seller.routes.ts → Rutas de vendedores

🛡️ Seguridad:
- Endpoints de escritura (POST, PUT, DELETE) requieren autenticación.
- Validaciones y manejo de errores se realizan en los controladores.
- Nunca se exponen datos sensibles en respuestas.

🏪 Multi-kiosco (ver KioscoRouter más abajo):
- Todos los routers de recursos de negocio (Product, Presentation,
  Provider, Sell, Seller, Receipts) exigen `authMiddleware` +
  `requireKioscoContext`: el kiosco activo viaja en el header
  `x-kiosco-id` y se valida contra la membership del usuario logueado
  (403 si no pertenece a ese kiosco). Las rutas en sí no cambiaron de
  forma — el scoping es transparente, no hay `:kiosco_id` en la URL de
  estos recursos.
- El rol (`admin`/`seller`) ya no es global sobre `Auth` — vive por-kiosco
  en `KioscoMembership`. Ver KioscoRouter.

🌀 Flujo estándar:
[Request] → [Router] → [Controller] → [Model] → [DB] → [Response]

📍📜 Mapa de rutas:

──────────────────────────────
🔑 AuthRouter
──────────────────────────────
- GET    /                       → home (lista de endpoints)
- POST   /register                → registrar usuario
- POST   /login                   → iniciar sesión
- POST   /google                  → login/registro vía Google
- POST   /logout                  → cerrar sesión
- POST   /check-auth              → verificar autenticación
- POST   /refresh                 → renovar access token
- POST   /request-password-reset  → solicitar reset de contraseña
- POST   /reset-password          → aplicar nueva contraseña
- DELETE /delete-auth              → eliminar la PROPIA cuenta (self-service,
                                      cascada a Seller + membresías de kiosco;
                                      ya no acepta un _id ajeno en el body)
- PUT    /edit-auth                → editar credenciales (email/password —
                                      `role` se eliminó del body, ver KioscoRouter)

Todas menos `/`, `/register`, `/login`, `/google`, `/check-auth`,
`/request-password-reset` y `/reset-password` requieren `authMiddleware`.

──────────────────────────────
🏪 KioscoRouter
──────────────────────────────
- POST   /create                          → crear un kiosco nuevo (el creador queda como admin)
- GET    /my-kioscos                      → kioscos a los que pertenece el usuario, con stats
- POST   /join                            → unirse a un kiosco existente vía invite_code
- GET    /:kiosco_id/invite-info          → código/link de invitación (solo admin)
- PUT    /:kiosco_id                      → editar nombre/dirección/moneda (solo admin)
- POST   /:kiosco_id/select               → marcar "último acceso" al entrar a ese kiosco
- DELETE /:kiosco_id/member/:user_id      → sacar a un vendedor del kiosco (solo admin, NO borra su cuenta)
- PUT    /:kiosco_id/member/:user_id/role → cambiar el rol de un vendedor en ese kiosco (solo admin)

Todas requieren `authMiddleware`. Las que operan sobre un `:kiosco_id`
puntual además exigen `requireKioscoContext` (¿pertenece el usuario a ese
kiosco?) y, salvo `/select`, `requireKioscoRole([admin])`.

Los vendedores de un kiosco se listan en `GET /seller/get-sellers`, scoped
por el header `x-kiosco-id` — no hay un endpoint `/kiosco/:id/sellers`
separado.

──────────────────────────────
📦 ProductRouter
──────────────────────────────
- GET    /get-products          → obtener todos los productos
- GET    /get-product-by-id     → obtener producto por ID
- GET    /get-product-by-name   → obtener productos por nombre
- GET    /get-product-by-brand  → obtener productos por marca
- POST   /create-product        → crear producto nuevo
- DELETE /delete-product        → eliminar producto
- PUT    /edit-product          → editar producto existente

──────────────────────────────
🎭 PresentationRouter
──────────────────────────────
- GET    /get-product-presentations              → obtener todas las presentationes
- GET    /get-presentation-by-id         → obtener presentatione por ID
- GET    /get-presentation-by-product-id → obtener presentationes por producto
- GET    /get-presentation-by-brand      → obtener presentationes por marca
- GET    /get-presentation-by-stock      → obtener presentationes por stock
- GET    /get-presentation-by-price      → obtener presentationes por precio
- GET    /get-presentation-by-size       → obtener presentationes por tamaño
- GET    /get-presentation-by-presentation → obtener presentationes por presentación
- POST   /create-presentation            → crear nueva presentatione
- DELETE /delete-presentation            → eliminar presentatione
- PUT    /edit-presentation              → editar presentatione existente

──────────────────────────────
🏢 ProviderRouter
──────────────────────────────
- GET    /get-providers            → obtener todos los proveedores
- GET    /get-provider-by-id       → obtener proveedor por ID
- GET    /get-provider-by-name     → obtener proveedores por nombre
- GET    /get-provider-by-valoration → obtener proveedores por valoración
- GET    /get-providers-by-contact → obtener proveedores por contacto
- POST   /create-provider          → crear proveedor nuevo
- DELETE /delete-provider          → eliminar proveedor
- PUT    /edit-provider            → editar proveedor existente

──────────────────────────────
💰 SellRouter
──────────────────────────────
- GET    /get-sells          → obtener todas las ventas
- GET    /get-sell-by-id     → obtener venta por ID
- GET    /get-sells-by-seller→ obtener ventas por vendedor
- GET    /get-sells-by-date  → obtener ventas por fecha
- GET    /get-sells-by-product → obtener ventas por producto
- POST   /create-sell        → crear nueva venta
- DELETE /delete-sell        → eliminar venta
- PUT    /edit-sell          → editar venta existente

──────────────────────────────
🧑‍💼 SellerRouter
──────────────────────────────
- GET    /get-sellers         → vendedores del KIOSCO ACTIVO (perfil + email + rol, join con KioscoMembership)
- GET    /get-seller-by-id    → obtener vendedor por ID
- GET    /get-seller-by-name  → obtener vendedores por nombre
- GET    /get-seller-by-email → obtener vendedor por email
- PUT    /edit-seller         → editar vendedor existente (solo name/profilePhoto/user_status)

Ya no hay `/create-seller`, `/delete-seller` ni `/get-seller-by-rol` en
este router: crear una cuenta se hace vía `/auth/register`, sumar/sacar
de un kiosco vía `KioscoRouter` (`/kiosco/join`,
`/kiosco/:id/member/:user_id`), y el rol se resuelve por kiosco (no hay
"vendedores por rol" global).
