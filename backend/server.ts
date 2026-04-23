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
const PORT = process.env.BACKEND_PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quick-wash';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
if (!process.env.MONGODB_URI) {
  console.warn('⚠️ WARNING: MONGODB_URI environment variable is not defined.');
  console.warn('In local development, ensure MongoDB is running at localhost:27017 or provide a URI.');
  console.warn('In production (AI Studio/Render), add your MONGODB_URI to the Secrets/Environment variables.');
}

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30 for faster failure feedback
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('Please verify that your database is running and the URI is correct.');
  });

console.log(`Starting backend server on port ${PORT}...`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend server successfully running on http://0.0.0.0:${PORT}`);
});
