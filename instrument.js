// instrument.js — must be loaded before all other modules
require('dotenv').config();

const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

if (process.env.SENTRY_DSN) {
  const isProduction = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,

    // ========== ERROR TRACKING ==========
    // Capture 100% of errors
    sampleRate: 1.0,

    // Include local variables in stack traces
    includeLocalVariables: true,

    // Attach source code context to stack frames
    // (ContextLines integration is enabled by default)

    // Max breadcrumbs to keep in memory
    maxBreadcrumbs: 100,

    // ========== PERFORMANCE / TRACING ==========
    // Dynamic sampling: capture less in production, more in dev
    tracesSampler: (samplingContext) => {
      // Always sample health checks at low rate
      if (samplingContext?.transactionContext?.name?.includes('/health')) {
        return 0.01;
      }
      // Always sample API routes fully
      if (samplingContext?.transactionContext?.name?.includes('/api/')) {
        return isProduction ? 0.2 : 1.0;
      }
      return isProduction ? 0.1 : 1.0;
    },

    // Propagate trace headers to external API calls (RapidAPI)
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/astrologer\.rapidapi\.com/,
      /^https:\/\/astrolumina\.pages\.dev/,
      /^https:\/\/.*\.carmenilie\.com/,
      /^https:\/\/.*\.astrolumina\.com/,
    ],

    // ========== PROFILING ==========
    integrations: [
      nodeProfilingIntegration(),
      // Capture console.log/warn/error as breadcrumbs
      Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
      // Application Not Responding detection (blocks event loop)
      Sentry.anrIntegration({ captureStackTrace: true }),
    ],
    profileSessionSampleRate: isProduction ? 0.1 : 1.0,
    profileLifecycle: 'trace',

    // ========== SESSION TRACKING ==========
    // Track crash-free rate
    autoSessionTracking: true,

    // ========== PII / SENSITIVE DATA ==========
    sendDefaultPii: true,

    // ========== BEFORE SEND HOOKS ==========
    // Sanitize events before sending
    beforeSend: (event, hint) => {
      // Remove API keys from error messages
      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          if (exception.value) {
            exception.value = exception.value
              .replace(/x-rapidapi-key['":\s]*['"]?[\w-]+['"]?/gi, 'x-rapidapi-key=[REDACTED]')
              .replace(/ASTROLOGER_API_KEY['":\s]*['"]?[\w-]+['"]?/gi, 'ASTROLOGER_API_KEY=[REDACTED]');
          }
        }
      }
      // Remove API keys from request data
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data;
        if (data['x-rapidapi-key']) data['x-rapidapi-key'] = '[REDACTED]';
      }
      return event;
    },

    // Add custom attributes to all spans
    beforeSendSpan: (span) => {
      // Add service identifier to all spans
      span.data = {
        ...span.data,
        'service.name': 'astrolumina-api',
      };
      return span;
    },

    // ========== CUSTOM TAGS ==========
    initialScope: {
      tags: {
        service: 'astrolumina-api',
        runtime: 'node.js',
        framework: 'express',
      },
    },

    // ========== LOGGING ==========
    enableLogs: true,

    // ========== GRACEFUL SHUTDOWN ==========
    // closeTimeout is handled manually in server.js
  });
}
