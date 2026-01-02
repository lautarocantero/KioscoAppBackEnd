"use strict";
/**
 * ┌───────────────────────────────────────────────┐
 * │                 INDEX SERVER                  │
 * └───────────────────────────────────────────────┘
 * 🎭 Punto de entrada principal de la aplicación.
 * - Configura middlewares globales (CORS, JSON, cookies).
 * - Registra routers para cada dominio (auth, sell, seller, etc.).
 * - Inicia el servidor en el puerto definido en config.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const sell_routes_1 = __importDefault(require("./routes/sell.routes"));
const seller_routes_1 = __importDefault(require("./routes/seller.routes"));
const provider_routes_1 = __importDefault(require("./routes/provider.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const productVariant_routes_1 = __importDefault(require("./routes/productVariant.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
/**
 * ┌───────────────────────────────────────────────┐
 * │                 MIDDLEWARES                   │
 * └───────────────────────────────────────────────┘
 * 🎭 Configuración global de middlewares:
 * - CORS: habilita comunicación segura con frontend.
 * - JSON: parsea cuerpos de peticiones en formato JSON.
 * - Cookies: permite lectura y escritura de cookies.
 */
const allowedOrigins = ['http://localhost:5173', 'https://69545059c2c5900008ded560--kioscoapp.netlify.app'];
app.use((0, cors_1.default)({
    origin: allowedOrigins, // 🌐 Frontend permitido
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 🔧 Métodos habilitados
    credentials: true // 🍪 Permite envío de cookies
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
app.use('/auth', auth_routes_1.default);
app.use('/sell', sell_routes_1.default);
app.use('/seller', seller_routes_1.default); // usuario normal / admin
app.use('/provider', provider_routes_1.default); // dato externo, no usa la app
app.use('/product', product_routes_1.default);
app.use('/product-variant', productVariant_routes_1.default);
/**
 * ┌───────────────────────────────────────────────┐
 * │                 SERVER START                  │
 * └───────────────────────────────────────────────┘
 * 🎭 Inicializa el servidor en el puerto definido
 * en config. Muestra mensaje confirmando inicio.
 */
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});
