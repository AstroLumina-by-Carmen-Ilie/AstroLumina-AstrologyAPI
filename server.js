// instrument.js must be loaded before all other modules
require('./instrument');

const Sentry = require('@sentry/node');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const { find: timezone } = require('geo-tz');
const {
  used_planets,
  used_astral_points,
  used_asteroids,
  used_stars,
  used_element_symbols,
  used_elements,
  used_houses,
  used_aspects,
  natal_elements,
  karmic_elements
} = require('./constants');

const ASTROLOGER_API_KEY = process.env.ASTROLOGER_API_KEY;
const ASTROLOGER_API_URL = process.env.ASTROLOGER_API_URL;
const ASTROLOGER_API_HOST = process.env.ASTROLOGER_API_HOST;

const app = express();
const port = process.env.PORT || 3031;
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Rate limiter: maximum of 20 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after a minute' }
});

app.use(limiter);

// Body parser with meaningful error for oversized payloads
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));

// CORS — support CORS_ORIGINS env var (comma-separated) or fallback to defaults
const defaultCorsOrigins = [
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
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : defaultCorsOrigins;
app.use(cors({ origin: corsOrigins }));

const VALID_LANGUAGES = ['ro', 'en'];

const validateData = (req) => {
  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = req.body;

  if ((!longitude && longitude !== 0) ||
    (!latitude && latitude !== 0) ||
    (!year && year !== 0) ||
    (!month && month !== 0) ||
    (!day && day !== 0) ||
    (!hour && hour !== 0) ||
    (!minute && minute !== 0) ||
    (city !== '' && !city) ||
    (nation !== '' && !nation) ||
    (name !== '' && !name)) {
    return 21;
  }

  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180 ||
    typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
    typeof year !== 'number' || year < 1 || year > 3000 ||
    typeof month !== 'number' || month < 1 || month > 12 ||
    typeof day !== 'number' || day < 1 || day > 31 ||
    typeof hour !== 'number' || hour < 0 || hour > 23 ||
    typeof minute !== 'number' || minute < 0 || minute > 59 ||
    typeof city !== 'string' ||
    typeof nation !== 'string' ||
    typeof name !== 'string') {
    return 22;
  }

  return 0;
};

const validateLanguage = (lang) => VALID_LANGUAGES.includes(lang);

const getValidationError = (code) => {
  switch (code) {
    case 21:
      return 'Missing required parameters. Please provide: longitude, latitude, year, month, day, hour, minute, city, nation, name';
    case 22:
      return 'Invalid parameter values. Check ranges: longitude [-180,180], latitude [-90,90], year [1,3000], month [1,12], day [1,31], hour [0,23], minute [0,59].';
    default:
      return 'Validation error';
  }
};

const getPointType = (name) => {
  if (used_planets.includes(name)) return 'planet';
  if (used_astral_points.includes(name)) return 'astral_point';
  if (used_asteroids.includes(name)) return 'asteroid';
  if (used_stars.includes(name)) return 'star';
  return 'astrological_point';
};

const loadTranslations = (lang) => {
  const translationsPath = path.resolve(__dirname, 'translations', `${lang}.js`);
  const { translations } = require(translationsPath);
  return translations;
};

const fetchBirthData = async (req) => {
  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = req.body;

  return Sentry.startSpan(
    { op: 'http.client', name: 'POST Astrologer API /birth-chart' },
    async (span) => {
      span?.setAttribute('astro.city', city);
      span?.setAttribute('astro.nation', nation);
      span?.setAttribute('astro.year', year);

      const options = {
        method: 'POST',
        url: `${ASTROLOGER_API_URL}/api/v5/chart/birth-chart`,
        headers: {
          'x-rapidapi-key': ASTROLOGER_API_KEY,
          'x-rapidapi-host': ASTROLOGER_API_HOST,
          'Content-Type': 'application/json'
        },
        data: {
          subject: {
            name,
            year,
            month,
            day,
            hour,
            minute,
            longitude,
            latitude,
            city,
            nation,
            timezone: timezone(latitude, longitude)[0],
            zodiac_type: 'Tropical',
            perspective_type: 'Apparent Geocentric',
            houses_system_identifier: 'P'
          },
          active_points: used_elements,
          active_aspects: used_aspects,
          theme: 'light'
        }
      };

      const response = await axios.request(options);
      return response.data;
    }
  );
};

// Health check endpoint
app.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node: process.version,
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// Get full astral data from Astrologer
app.post('/api/v2/:lang/birth-data', async (req, res, next) => {
  const lang = req.params.lang?.toLowerCase();

  Sentry.setContext('request', {
    endpoint: 'birth-data',
    language: lang,
  });

  if (!validateLanguage(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const validation = validateData(req);
  if (validation !== 0) {
    return res.status(400).json({ error: getValidationError(validation) });
  }

  try {
    const allData = await fetchBirthData(req);
    res.json(allData);
  } catch (error) {
    console.error('Error fetching birth data:', error.message);
    Sentry.captureException(error, { tags: { endpoint: 'birth-data', language: lang } });
    next(error);
  }
});

// Get filtered astral data
app.post('/api/v2/:lang/astral-data/:type?', async (req, res, next) => {
  const lang = req.params.lang?.toLowerCase();
  const type = req.params.type?.toLowerCase();

  Sentry.setContext('request', {
    endpoint: 'astral-data',
    language: lang,
    type: type || 'full',
  });

  if (!validateLanguage(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const validation = validateData(req);
  if (validation !== 0) {
    return res.status(400).json({ error: getValidationError(validation) });
  }

  const t = loadTranslations(lang);

  try {
    const birthData = await Sentry.startSpan(
      { op: 'astro.filter', name: `astral-data/${type || 'full'}` },
      async () => fetchBirthData(req)
    );

    const cosmicElements = birthData.chart_data.subject;
    const cosmicElementsFilteredData = Object.keys(cosmicElements)
      .filter((key) => {
        const el = cosmicElements[key];
        return el !== null && typeof el === 'object' && used_elements.includes(el.name);
      })
      .map((key) => cosmicElements[key])
      .sort((a, b) => used_elements.indexOf(a.name) - used_elements.indexOf(b.name))
      .map((planet) => {
        const pointType = getPointType(planet.name);
        return {
          ...planet,
          point_type: t.types?.[pointType] ?? pointType,
          name: t.planets[planet.name],
          house: t.houses[planet.house],
          sign: t.signs[planet.sign],
          symbol: used_element_symbols[planet.name],
          element: t.elements[planet.element]
        };
      });

    const cosmicHousesFilteredData = Object.keys(cosmicElements)
      .filter((key) => {
        const el = cosmicElements[key];
        return el !== null && typeof el === 'object' && used_houses.includes(el.name);
      })
      .map((key) => cosmicElements[key])
      .sort((a, b) => used_houses.indexOf(a.name) - used_houses.indexOf(b.name))
      .map((house) => ({
        ...house,
        name: t.houses[house.name],
        sign: t.signs[house.sign],
        element: t.elements[house.element]
      }));

    const cosmicAspectsFilteredData = birthData.chart_data.aspects.map((a) => ({
      ...a,
      p1_name: t.planets?.[a.p1_name] ?? a.p1_name,
      p2_name: t.planets?.[a.p2_name] ?? a.p2_name,
      aspect: t.aspects?.[a.aspect] ?? a.aspect
    }));

    let allData = {
      cosmic_elements: cosmicElementsFilteredData,
      cosmic_houses: cosmicHousesFilteredData,
      cosmic_aspects: cosmicAspectsFilteredData
    };

    switch (type) {
      case 'natal':
        allData = {
          cosmic_elements: cosmicElementsFilteredData.filter(
            (p) => natal_elements[lang].includes(p.name)
          ),
          cosmic_houses: cosmicHousesFilteredData,
          cosmic_aspects: cosmicAspectsFilteredData.filter(
            (a) =>
              natal_elements[lang].includes(a.p1_name) &&
              natal_elements[lang].includes(a.p2_name)
          )
        };
        break;
      case 'karmic':
        allData = {
          cosmic_elements: cosmicElementsFilteredData.filter(
            (p) => karmic_elements[lang].includes(p.name)
          ),
          cosmic_houses: cosmicHousesFilteredData,
          cosmic_aspects: cosmicAspectsFilteredData.filter(
            (a) =>
              (karmic_elements[lang].includes(a.p1_name) &&
                (karmic_elements[lang].includes(a.p2_name) || natal_elements[lang].includes(a.p2_name))) ||
              (karmic_elements[lang].includes(a.p2_name) &&
                (karmic_elements[lang].includes(a.p1_name) || natal_elements[lang].includes(a.p1_name)))
          )
        };
        break;
      default:
        break;
    }

    res.json(allData);
  } catch (error) {
    console.error('Error fetching astral data:', error.message);
    Sentry.captureException(error, { tags: { endpoint: 'astral-data', language: lang, type: type || 'full' } });
    next(error);
  }
});

// Get filtered astral SVG chart
app.post('/api/v2/:lang/astral-chart', async (req, res, next) => {
  const lang = req.params.lang?.toLowerCase();

  Sentry.setContext('request', { endpoint: 'astral-chart', language: lang });

  if (!validateLanguage(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const validation = validateData(req);
  if (validation !== 0) {
    return res.status(400).json({ error: getValidationError(validation) });
  }

  try {
    const birthData = await fetchBirthData(req);
    res.json(birthData.chart);
  } catch (error) {
    console.error('Error fetching astral chart:', error.message);
    Sentry.captureException(error, { tags: { endpoint: 'astral-chart', language: lang } });
    next(error);
  }
});

// Get filtered lunar data
app.post('/api/v2/:lang/lunar-data', async (req, res, next) => {
  const lang = req.params.lang?.toLowerCase();

  Sentry.setContext('request', { endpoint: 'lunar-data', language: lang });

  if (!validateLanguage(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const validation = validateData(req);
  if (validation !== 0) {
    return res.status(400).json({ error: getValidationError(validation) });
  }

  const t = loadTranslations(lang);

  try {
    const birthData = await fetchBirthData(req);
    const lunarPhase = birthData.chart_data.subject.lunar_phase;

    const allData = {
      ...lunarPhase,
      moon_phase_name: t.lunar_phases[lunarPhase.moon_phase_name]
    };

    res.json(allData);
  } catch (error) {
    console.error('Error fetching lunar data:', error.message);
    Sentry.captureException(error, { tags: { endpoint: 'lunar-data', language: lang } });
    next(error);
  }
});

// Payload too large handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large. Maximum size is 1MB.' });
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Sentry Express error handler — must be registered AFTER all routes
Sentry.setupExpressErrorHandler(app);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const response = {
    error: isProduction ? 'Internal server error' : err.message
  };

  if (!isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Track open connections for graceful shutdown
let connections = [];
server.on('connection', (conn) => {
  connections.push(conn);
  conn.on('close', () => {
    connections = connections.filter((c) => c !== conn);
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed.');
    await Sentry.close(2000);
    process.exit(0);
  });

  // Destroy idle keep-alive connections
  connections.forEach((conn) => conn.destroy());

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
