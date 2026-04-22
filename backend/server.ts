import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import priceRoutes from './routes/priceRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quick-wash';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/system', systemRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Quick-Wash Backend API Running');
});

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

console.log(`Starting backend server on port ${PORT}...`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend server successfully running on http://0.0.0.0:${PORT}`);
});
