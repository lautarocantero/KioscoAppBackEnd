![Stoko ilustration](/public/images/stocko-banner.png)

# 🏪 Stocko Backend

API RESTful para la gestión de Stocko construida con **Node.js**, **Express** y **TypeScript**.

## 📝 Descripción

Este backend administra:
- 🔐 autenticación y gestión de usuarios
- 🧑‍💼 vendedores
- 📦 productos
- 🏷️ presentaciones de productos
- 🚚 proveedores
- 🛒 ventas

Incluye documentación Swagger (`/api-docs`) y una arquitectura modular basada en rutas, controladores, modelos y esquemas.

## 🧩 Tecnologías

- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- JWT
- bcrypt
- dotenv
- cors
- swagger-jsdoc + swagger-ui-express
- db-local (fallback local)

## 🔧 Instalación

```bash
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` en la raíz con al menos estas variables:

```env
PORT=3000
MONGODB_URI=mongodb://admin:secret@localhost:27017/mi_base?authSource=admin
RESEND_API_KEY=tu_resend_api_key
EMAIL_FROM="Stocko <onboarding@resend.dev>"
FRONTEND_URL=http://localhost:5173
SALT_ROUNDS=10
NODE_ENV=development
```

> ⚠️ Nota: `RESEND_API_KEY` es obligatorio, ya que el servicio de correo usa la librería `resend`.

## 🚀 Ejecución

Modo desarrollo:

```bash
npm run dev
```

Compilar TypeScript:

```bash
npm run build
```

Ejecutar el código compilado:

```bash
npm start
```

## 🛣️ Rutas principales

### 🔐 Autenticación (`/auth`)
- `GET /auth/`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/logout`
- `POST /auth/check-auth`
- `POST /auth/refresh`
- `POST /auth/request-password-reset`
- `POST /auth/reset-password`
- `DELETE /auth/delete-auth`
- `PUT /auth/edit-auth`

### 📦 Productos (`/product`)
- `GET /product/`
- `GET /product/get-products`
- `GET /product/get-product-by-id/:_id`
- `GET /product/get-product-by-name?name=...`
- `GET /product/get-product-by-brand?brand=...`
- `GET /product/get-products-with-presentations`
- `GET /product/get-products-with-stock`
- `GET /product/get-product-stats`
- `GET /product/search-products-with-presentations?term=...&category=...`
- `POST /product/create-product`
- `PUT /product/edit-product`
- `DELETE /product/delete-product`

### 🏷️ Presentaciones (`/presentation`)
- `GET /presentation/`
- `GET /presentation/get-product-presentations`
- `GET /presentation/get-presentation-by-id/:product_presentation_id`
- `GET /presentation/get-presentation-by-barcode/:barcode`
- `GET /presentation/get-presentation-by-product-id/:product_id`
- `GET /presentation/get-presentation-by-stock?stock=...`
- `GET /presentation/get-presentation-by-price?price=...`
- `GET /presentation/get-presentation-by-status?status=...`
- `GET /presentation/get-presentation-by-model-size?model_size=...`
- `GET /presentation/get-presentation-by-category?category=...`
- `GET /presentation/get-presentations-with-stock-by-product-id/:product_id`
- `GET /presentation/get-presentation-analytics/:presentation_id`
- `POST /presentation/create-presentation`
- `PUT /presentation/edit-presentation/:presentation_id`
- `DELETE /presentation/delete-presentation`

### 🚚 Proveedores (`/provider`)
- `GET /provider/`
- `GET /provider/get-providers`
- `GET /provider/get-provider-by-id`
- `GET /provider/get-provider-by-name`
- `GET /provider/get-provider-by-valoration`
- `GET /provider/get-providers-by-contact`
- `GET /provider/get-providers-stats`
- `POST /provider/create-provider`
- `PUT /provider/edit-provider`
- `DELETE /provider/delete-provider`

### 🛒 Ventas (`/sell`)
- `GET /sell/`
- `GET /sell/get-sells`
- `GET /sell/get-sell-by-id/:_id`
- `GET /sell/get-sells-by-seller`
- `GET /sell/get-sells-by-date`
- `GET /sell/get-sells-by-product`
- `GET /sell/get-today-sells-count`
- `GET /sell/search-sells`
- `POST /sell/create-sell`
- `PUT /sell/edit-sell`
- `DELETE /sell/delete-sell/:_id`

### 🧑‍💼 Vendedores (`/seller`)
- `GET /seller/`
- `GET /seller/get-sellers`
- `GET /seller/get-seller-by-id`
- `GET /seller/get-seller-by-name`
- `GET /seller/get-seller-by-email`
- `GET /seller/get-seller-by-rol`
- `POST /seller/create-seller`
- `PUT /seller/edit-seller`
- `DELETE /seller/delete-seller`

## 📚 Documentación adicional

- Swagger UI disponible en `http://localhost:3000/api-docs`
- Documentación técnica en `src/docs/Architecture.md`, `src/docs/Routes.md`, `src/docs/Models.md`, `src/docs/Controllers.md`, `src/docs/Utils.md`

## 📁 Estructura principal

- `src/index.ts`: entrada principal, configuración de CORS, rutas y documentación Swagger.
- `src/config/db.ts`: conexión a MongoDB.
- `src/controllers/`: lógica de negocio por recurso.
- `src/routes/`: routers con endpoints.
- `src/models/`: acceso a datos y abstracción de persistencia.
- `src/schemas/`: esquemas Mongoose y respaldos locales.
- `src/typings/`: tipados y contratos TypeScript.
- `src/utils/`: utilidades compartidas.

## 🛠️ Notas importantes

- El proyecto usa cookies `access_token` y `refresh_token` para manejar sesión.
- CORS está configurado en `src/index.ts` con una lista de orígenes permitidos.
- Si `RESEND_API_KEY` no está presente, el servidor no arranca.
- La conexión a MongoDB se verifica antes de iniciar el servidor.

## 📦 Comandos

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run tsc`
- `npm run docgen`