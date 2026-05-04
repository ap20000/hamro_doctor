import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import pharmaceuticalRoutes from './routes/pharmaceuticalRoutes.js';
import surgicalRoutes from './routes/surgicalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import newsRoutes from './routes/newsRoutes.js';

dotenv.config();

const app = express();

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hamro Doctor API',
      version: '1.0.0',
      description: 'Production level API for Hamro Doctor Healthcare Platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://hamro-doctor.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport Middleware
app.use(passport.initialize());

// Static files (for prescription PDFs)
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/src/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Hamro Doctor API is running' });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/stories', storyRoutes);
app.use('/api/v1/doctor', doctorRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/forum', forumRoutes);
app.use('/api/v1/hospital', hospitalRoutes);
app.use('/api/v1/pharmaceutical', pharmaceuticalRoutes);
app.use('/api/v1/surgical', surgicalRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/marketing', marketingRoutes);
app.use('/api/v1/news', newsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => {
      // Clean up enum errors
      if (val.kind === 'enum') {
        return `Please select a valid ${val.path.split('.').pop()}`;
      }
      return val.message;
    });
    message = messages[0]; // Return the first clean error
  }

  // Handle Mongoose Duplicate Key Errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
