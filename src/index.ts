import express from 'express';
import authRoutes from './routes/auth.routes';
import cookieParser from 'cookie-parser';
import { PORT } from './config';

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use('/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});