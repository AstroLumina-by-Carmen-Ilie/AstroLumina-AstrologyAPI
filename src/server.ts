// Sentry instrument must be loaded first
import { Sentry } from './instrument.js';

import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { securityHeaders, corsMiddleware, rateLimiter } from './middleware/security.js';
import { payloadTooLargeHandler, notFoundHandler, globalErrorHandler } from './middleware/error-handler.js';
import healthRouter from './routes/health.js';
import astrologyRouter from './routes/astrology.js';

const isProduction = env.NODE_ENV === 'production';

const app = express();

// ─── Security ────────────────────────────────────────────────
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter);

// ─── Compression ─────────────────────────────────────────────
app.use(compression());

// ─── Logging ─────────────────────────────────────────────────
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ─── Body parser ─────────────────────────────────────────────
app.use(express.json({
  limit: '1mb',
  verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf;
  },
}));

// ─── Routes ──────────────────────────────────────────────────
app.use(healthRouter);
app.use(astrologyRouter);

// ─── Error handling ──────────────────────────────────────────
app.use(payloadTooLargeHandler);
app.use(notFoundHandler);

// Sentry error handler — must be after routes
Sentry.setupExpressErrorHandler(app);

// Global error handler — must be last
app.use(globalErrorHandler);

// ─── Server startup ──────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Node: ${process.version}`);
});

// ─── Connection tracking for graceful shutdown ────────────────
const connections = new Set<import('net').Socket>();

server.on('connection', (conn) => {
  connections.add(conn);
  conn.on('close', () => connections.delete(conn));
});

// ─── Graceful shutdown ───────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed.');

    await Sentry.close(2000);
    console.log('Sentry flushed.');

    process.exit(0);
  });

  // Destroy idle keep-alive connections
  for (const conn of connections) {
    conn.destroy();
  }

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
