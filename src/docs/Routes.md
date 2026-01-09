/*──────────────────────────────
📘 Routes.md
──────────────────────────────
📜 Propósito:
Centralizar la documentación de todas las rutas del proyecto.  
Cada archivo en `/routes` define los endpoints disponibles para un recurso específico y los conecta con sus controladores.

🧩 Organización:
- auth.routes.ts → Rutas de autenticación
- product.routes.ts → Rutas de productos
- productVariant.routes.ts → Rutas de variantes de producto
- provider.routes.ts → Rutas de proveedores
- sell.routes.ts → Rutas de ventas
- seller.routes.ts → Rutas de vendedores

🛡️ Seguridad:
- Endpoints de escritura (POST, PUT, DELETE) requieren autenticación.
- Validaciones y manejo de errores se realizan en los controladores.
- Nunca se exponen datos sensibles en respuestas.

🌀 Flujo estándar:
[Request] → [Router] → [Controller] → [Model] → [DB] → [Response]

📍📜 Mapa de rutas:

──────────────────────────────
🔑 AuthRouter
──────────────────────────────
- GET    /              → home (lista de endpoints)
- POST   /register      → registrar usuario
- POST   /login         → iniciar sesión
- POST   /logout        → cerrar sesión
- POST   /check-auth    → verificar autenticación
- DELETE /delete-auth   → eliminar credenciales
- PUT    /edit-auth     → editar credenciales

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
🎭 ProductVariantRouter
──────────────────────────────
- GET    /get-product-variants              → obtener todas las variantes
- GET    /get-product-variant-by-id         → obtener variante por ID
- GET    /get-product-variant-by-product-id → obtener variantes por producto
- GET    /get-product-variant-by-brand      → obtener variantes por marca
- GET    /get-product-variant-by-stock      → obtener variantes por stock
- GET    /get-product-variant-by-price      → obtener variantes por precio
- GET    /get-product-variant-by-size       → obtener variantes por tamaño
- GET    /get-product-variant-by-presentation → obtener variantes por presentación
- POST   /create-product-variant            → crear nueva variante
- DELETE /delete-product-variant            → eliminar variante
- PUT    /edit-product-variant              → editar variante existente

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
- GET    /get-sellers        → obtener todos los vendedores
- GET    /get-seller-by-id   → obtener vendedor por ID
- GET    /get-seller-by-name → obtener vendedores por nombre
- GET    /get-seller-by-email→ obtener vendedor por email
- GET    /get-seller-by-rol  → obtener vendedores por rol
- POST   /create-seller      → crear nuevo vendedor
- DELETE /delete-seller      → eliminar vendedor
- PUT    /edit-seller        → editar vendedor existente
