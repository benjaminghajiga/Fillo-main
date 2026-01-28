import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
// Allow flexible CORS in development. In production set FRONTEND_URL to the exact origin.
const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(
  cors({
    origin: process.env.NODE_ENV === 'development' ? true : FRONTEND_URL,
    credentials: true,
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`AgroConnect backend running on port ${PORT} (${NODE_ENV})`);
});
