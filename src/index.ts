import express from 'express';
import authRoutes from './routes/auth.routes';
import sellRoutes from './routes/sell.routes';
import sellerRoutes from './routes/seller.routes';
import providerRoutes from './routes/provider.routes';
import productRoutes from './routes/product.routes';
import productVariantRoutes from './routes/productVariant.routes';
import cookieParser from 'cookie-parser';
import { PORT } from './config';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


app.use('/auth', authRoutes);
app.use('/sell', sellRoutes);
app.use('/seller', sellerRoutes); //usuario normal/ admin 
app.use('/provider', providerRoutes); //dato externo, no usa la app
app.use('/product', productRoutes);
app.use('/product-variant', productVariantRoutes);



app.listen(PORT, () => { console.log(`en el puerto numero ${PORT}`);});