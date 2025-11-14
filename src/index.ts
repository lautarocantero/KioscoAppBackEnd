import express from 'express';
import authRoutes from './routes/auth.routes';
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

app.listen(PORT, () => { console.log(`en el puerto numero ${PORT}`);
    
});