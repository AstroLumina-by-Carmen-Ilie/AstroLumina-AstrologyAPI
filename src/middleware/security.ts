import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Security headers
export const securityHeaders = helmet();

// CORS configuration
const defaultOrigins = [
  'http://localhost:5173',
  'https://astrolumina.pages.dev',
  'https://development.astrolumina.pages.dev',
  'https://develop.astrolumina.pages.dev',
  'https://carmenilie.com',
  'https://www.carmenilie.com',
  'https://carmenilieastrolog.com',
  'https://www.carmenilieastrolog.com',
  'https://astrolumina.com',
  'https://www.astrolumina.com',
];

const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : defaultOrigins;

export const corsMiddleware = cors({ origin: corsOrigins });

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after a minute' },
});
