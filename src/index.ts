import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import productVariantRoutes from './routes/presentation.routes';
import providerRoutes from './routes/provider.routes';
import sellRoutes from './routes/sell.routes';
import sellerRoutes from './routes/seller.routes';
import { connectDB } from './config/db';

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://69545059c2c5900008ded560--kioscoapp.netlify.app',
    'https://kioscoapp.netlify.app'
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/sell', sellRoutes);
app.use('/seller', sellerRoutes);
app.use('/provider', providerRoutes);
app.use('/product', productRoutes);
app.use('/presentation', productVariantRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = Number(process.env.PORT) || 3000;

connectDB().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Servidor corriendo en el puerto ${port}`);
    });
});