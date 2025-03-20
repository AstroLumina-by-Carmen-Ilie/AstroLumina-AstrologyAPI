require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { find: timezone } = require('geo-tz')
const { used_planets, used_aspects, natal_elements, karmic_elements, sign_order } = require('./constants');
const interpretationService = require('./services/interpretationService');

const ASTROLOGER_API_KEY = process.env.ASTROLOGER_API_KEY;
const ASTROLOGER_API_URL = process.env.ASTROLOGER_API_URL;
const ASTROLOGER_API_HOST = process.env.ASTROLOGER_API_HOST;

const app = express();
const port = 3031;

// Configure rate limiter: maximum of 20 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after a minute'
});

// Apply the rate limiter to all routes
app.use(limiter);
app.use(express.json());
app.use(cors({
  origin: [
    // Local development
    'http://localhost:3031',
    'http://localhost:5173',

    // Cloudflare
    'https://astrolumina.pages.dev',
    'https://development.astrolumina.pages.dev',

    // Live
    'https://carmenilie.com',
    'https://www.carmenilie.com',

    // Live
    'https://carmenilieastrolog.com',
    'https://www.carmenilieastrolog.com',

    // Live
    'https://astrolumina.com',
    'https://www.astrolumina.com'
  ]
}));

const validateData = (req) => {
  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = req.body;

  // Validate required parameters
  if (!longitude && longitude !== 0 ||
    !latitude && latitude !== 0 ||
    !year && year !== 0 ||
    !month && month !== 0 ||
    !day && day !== 0 ||
    !hour && hour !== 0 ||
    !minute && minute !== 0 ||
    !city && city !== "" ||
    !nation && nation !== "" ||
    !name && name !== "") {
    return 21;
  }

  // Validate parameter types and ranges
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180 ||
    typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
    typeof year !== 'number' || year < 1900 || year > 2300 ||
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
}

// Route to get natal data
app.post('/api/v1/:lang/birth-data', async (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = req.body;

  validation = validateData(req);
  if (validation !== 0) {
    switch (validation) {
      case 21:
        return res.status(400).json({ error: 'Missing required parameters. Please provide: longitude, latitude, year, month, day, hour, minute, city, nation, name' });
      case 22:
        return res.status(400).json({ error: 'Invalid parameter values. Please check the ranges and types of all parameters.' });
    }
  }

  const translationsPath = path.resolve(__dirname, 'translations', `${lang}.js`);

  try {
    const { translations: t } = require(translationsPath);
    const options = {
      method: 'POST',
      url: ASTROLOGER_API_URL + '/api/v4/natal-aspects-data',
      headers: {
        'x-rapidapi-key': ASTROLOGER_API_KEY,
        'x-rapidapi-host': ASTROLOGER_API_HOST,
        'Content-Type': 'application/json'
      },
      data: {
        subject: {
          name: name,
          year: year,
          month: month,
          day: day,
          hour: hour,
          minute: minute,
          longitude: longitude,
          latitude: latitude,
          city: city,
          nation: nation,
          timezone: timezone(latitude, longitude)[0],
          zodiac_type: "Tropic",
          sidereal_mode: null,
          perspective_type: "Apparent Geocentric",
          houses_system_identifier: "P"
        },
        active_points: used_planets,
        active_aspects: used_aspects
      }
    };

    const response = await axios.request(options);

    const allData = response.data;
    res.json(allData);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Route to get birth data
app.post('/api/v1/:lang/astral-data', async (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const translationsPath = path.resolve(__dirname, 'translations', `${lang}.js`);
  const { translations: t } = require(translationsPath);

  try {
    const options = {
      method: 'POST',
      url: `http://localhost:${port}/api/v1/${lang}/birth-data`,
      headers: {
        'Accept-Language': lang
      },
      data: req.body
    };

    const response = await axios.request(options);

    const allData = Object.keys(response.data.data.subject).map((key) => {
      if (
        response.data.data.subject[key] !== null &&
        typeof response.data.data.subject[key] === 'object' &&
        used_planets.indexOf(response.data.data.subject[key].name) > -1
      ) {
        return response.data.data.subject[key];
      }
      return null;
    })
      .filter(Boolean)
      .sort((a, b) => {
        const indexA = used_planets.indexOf(a.name);
        const indexB = used_planets.indexOf(b.name);
        return indexA - indexB;
      })
      .map((planet) => ({
        ...planet,
        name: t.planets[planet.name],
        house: t.houses[planet.house],
        sign: t.signs[planet.sign],
        element: t.elements[planet.element]
      }));

    res.json(allData);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Route to get lunar data
app.post('/api/v1/:lang/lunar-data', async (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const translationsPath = path.resolve(__dirname, 'translations', `${lang}.js`);
  const { translations: t } = require(translationsPath);

  try {
    const options = {
      method: 'POST',
      url: `http://localhost:${port}/api/v1/${lang}/birth-data`,
      headers: {
        'Accept-Language': lang
      },
      data: req.body
    };

    const response = await axios.request(options);

    const allData = {
      ...response.data.data.subject['lunar_phase'],
      moon_phase_name: t.lunar_phases[response.data.data.subject['lunar_phase'].moon_phase_name]
    };

    res.json(allData);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Route to get interpretations for a specific type
app.post('/api/v1/:lang/astral-interpretations/:type?', async (req, res) => {
  const type = req.params.type?.toLowerCase();
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  try {
    const options = {
      method: 'POST',
      url: `http://localhost:${port}/api/v1/${lang}/astral-data`,
      headers: {
        'Accept-Language': lang
      },
      data: req.body
    };

    const response = await axios.request(options);

    const interpretationPromises = response.data.map(async (p) => {
      try {
        const interpretation = await interpretationService.getInterpretation(
          lang, p.name, p.sign, p.house
        );
        return {
          ...p,
          interpretation: interpretation || '...'
        };
      } catch (error) {
        console.error(
          `Error loading interpretation for ${p.planet} in ${p.sign}, ${p.house}:`, error
        );
        return {
          ...p,
          interpretation: '...'
        };
      }
    });

    const interpretedData = await Promise.all(interpretationPromises);

    switch (type) {
      case "natal":
        res.json(interpretedData.filter((p) => natal_elements[lang].includes(p.name)));
        break;
      case "karmic":
        res.json(interpretedData.filter((p) => karmic_elements[lang].includes(p.name)));
        break;
      default:
        res.json(interpretedData);
        break;
    }
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  const pidPath = path.resolve(__dirname, 'server.pid');
  fs.writeFileSync(pidPath, process.pid.toString());
});
