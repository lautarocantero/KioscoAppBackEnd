"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./docs/swagger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const presentation_routes_1 = __importDefault(require("./routes/presentation.routes"));
const provider_routes_1 = __importDefault(require("./routes/provider.routes"));
const sell_routes_1 = __importDefault(require("./routes/sell.routes"));
const seller_routes_1 = __importDefault(require("./routes/seller.routes"));
const db_1 = require("./config/db");
const app = (0, express_1.default)();
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://69545059c2c5900008ded560--kioscoapp.netlify.app',
    'https://kioscoapp.netlify.app'
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/auth', auth_routes_1.default);
app.use('/sell', sell_routes_1.default);
app.use('/seller', seller_routes_1.default);
app.use('/provider', provider_routes_1.default);
app.use('/product', product_routes_1.default);
app.use('/presentation', presentation_routes_1.default);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
const port = Number(process.env.PORT) || 3000;
(0, db_1.connectDB)().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Servidor corriendo en el puerto ${port}`);
    });
});
