import express from 'express';
import authRouter from './routes/authRoute.js';
import gadgetRouter from './routes/gadgetRoute.js';
import cookieParser from 'cookie-parser';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/gadgets', gadgetRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});