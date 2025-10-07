
import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import authRoutes from './routes/authRoutes';
// import productRoutes from './routes/productRoutes'; // Example for future
// import storeRoutes from './routes/storeRoutes'; // Example for future
// import orderRoutes from './routes/orderRoutes'; // Example for future
// import aiRoutes from './routes/aiRoutes'; // Example for future

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // For development, allow any localhost origin or no origin (e.g. Postman, server-to-server)
    if ((origin && origin.startsWith('http://localhost:')) || !origin) {
      callback(null, true);
    } else if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
      // For production or specific configured origin
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production' && origin === 'null') {
      // Allow 'null' origin which can happen when opening HTML files directly in some browsers (less common for React apps)
      // This is generally not recommended for production.
      callback(null, true);
    }
    else {
      console.warn(`CORS: Origin ${origin} not allowed.`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, // Important for cookies or Authorization headers
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions) as RequestHandler); // Cast to RequestHandler

// Middleware for parsing JSON request bodies
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/stores', storeRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/ai', aiRoutes);


// Simple root route
app.get('/', (req: Request, res: Response) => {
  (res as any).send('AI Product Page Generator Backend is running!');
});

// Basic Not Found Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  (res as any).status(404).json({ message: 'Resource not found' });
});

// Basic Error Handler Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err.stack || err.message);
  const statusCode = ((res as any).statusCode && (res as any).statusCode !== 200) ? (res as any).statusCode : 500;
  (res as any).status(statusCode).json({
    message: err.message || 'An unexpected error occurred',
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS origin policy: Dynamic (allows localhost, no-origin, or configured CORS_ORIGIN)`);
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not set in .env file.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set in .env file. Authentication will not work correctly.');
  }
});
