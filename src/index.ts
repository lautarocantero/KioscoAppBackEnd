/**
 * ┌───────────────────────────────────────────────┐
 * │                 INDEX SERVER                  │
 * └───────────────────────────────────────────────┘
 * 🎭 Punto de entrada principal de la aplicación.
 * - Configura middlewares globales (CORS, JSON, cookies).
 * - Registra routers para cada dominio (auth, sell, seller, etc.).
 * - Inicia el servidor en el puerto definido en config.
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import productVariantRoutes from './routes/productVariant.routes';
import providerRoutes from './routes/provider.routes';
import sellRoutes from './routes/sell.routes';
import sellerRoutes from './routes/seller.routes';

const app = express();

/**
 * ┌───────────────────────────────────────────────┐
 * │                 MIDDLEWARES                   │
 * └───────────────────────────────────────────────┘
 * 🎭 Configuración global de middlewares:
 * - CORS: habilita comunicación segura con frontend.
 * - JSON: parsea cuerpos de peticiones en formato JSON.
 * - Cookies: permite lectura y escritura de cookies.
 */

const allowedOrigins = [ 'http://localhost:5173', 'http://localhost:5174', 'https://69545059c2c5900008ded560--kioscoapp.netlify.app', 'https://kioscoapp.netlify.app' ];

app.use(cors({
  origin: allowedOrigins, /*─────────────────── 🔎 Frontend permitido 🔎 ───────────────────*/
  methods: ['GET', 'POST', 'PUT', 'DELETE'], /*─────────────────── 🔎 Métodos habilitados 🔎 ───────────────────*/
  credentials: true /*─────────────────── 🔎 Cookies 🔎 ───────────────────*/
}));
app.use(express.json());
app.use(cookieParser());

/**
 * ┌───────────────────────────────────────────────┐
 * │                   ROUTERS                     │
 * └───────────────────────────────────────────────┘
 * 🎭 Registro de rutas principales:
 * - /auth → autenticación y sesiones
 * - /sell → ventas y transacciones
 * - /seller → gestión de usuarios (normal/admin)
 * - /provider → datos externos (no usan la app)
 * - /product → catálogo de productos
 * - /product-variant → variantes de productos
 */
app.use('/auth', authRoutes);
app.use('/sell', sellRoutes);
app.use('/seller', sellerRoutes);       // usuario normal / admin
app.use('/provider', providerRoutes);   // dato externo, no usa la app
app.use('/product', productRoutes);
app.use('/product-variant', productVariantRoutes);

// Registrar ruta de documentación 
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * ┌───────────────────────────────────────────────┐
 * │                 SERVER START                  │
 * └───────────────────────────────────────────────┘
 * 🎭 Inicializa el servidor en el puerto definido
 * en config o en el 3000 en su defecto. Muestra mensaje confirmando inicio.
 */
const port = Number(process.env.PORT) || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});
