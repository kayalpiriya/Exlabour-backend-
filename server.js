import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import errorHandler from './src/utils/errorHandler.js';
import { createServer } from 'http';
import { initSocket } from './src/utils/socketUtils.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import bidRoutes from './src/routes/bidRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

// Middleware
// app.use(cors());
// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     "https://exlabour-frontend.vercel.app"
//   ],
//   credentials: true
// }));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://exlabour-frontend.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);


// Base route
app.get('/', (req, res) => {
    res.send('ExLabour API is running...');
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.io`);
});