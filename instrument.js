// instrument.js — must be loaded before all other modules
require('dotenv').config();

const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,

    sendDefaultPii: true,
    includeLocalVariables: true,
    enableLogs: true,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
