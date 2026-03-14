require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { find: timezone } = require('geo-tz')
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
    'https://develop.astrolumina.pages.dev',

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

const getPointType = (name) => {
  if (used_planets.includes(name)) {
    return 'planet';
  }
  if (used_astral_points.includes(name)) {
    return 'astral_point';
  }
  if (used_asteroids.includes(name)) {
    return 'asteroid';
  }
  if (used_stars.includes(name)) {
    return 'star';
  }
  return 'astrological_point';
};

// Get full astral data from Astrologer
app.post('/api/v2/:lang/birth-data', async (req, res) => {
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

  try {
    const options = {
      method: 'POST',
      url: ASTROLOGER_API_URL + '/api/v5/chart/birth-chart',
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
          zodiac_type: "Tropical",
          perspective_type: "Apparent Geocentric",
          houses_system_identifier: "P"
        },
        active_points: used_elements,
        active_aspects: used_aspects,
        theme: "light"
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

// Get filtered astral data
app.post('/api/v2/:lang/astral-data/:type?', async (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const type = req.params.type?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const translationsPath = path.resolve(__dirname, 'translations', `${lang}.js`);
  const { translations: t } = require(translationsPath);

  try {
    const options = {
      method: 'POST',
      url: `http://localhost:${port}/api/v2/${lang}/birth-data`,
      headers: {
        'Accept-Language': lang
      },
      data: req.body
    };

    const response = await axios.request(options);

    const cosmicElements = response.data.chart_data.subject;
    const cosmicElementsFilteredData = Object.keys(cosmicElements).map((key) => {
      if (
        cosmicElements[key] !== null &&
        typeof cosmicElements[key] === 'object' &&
        used_elements.indexOf(cosmicElements[key].name) > -1
      ) {
        return cosmicElements[key];
      }
      return null;
    })
      .filter(Boolean)
      .sort((a, b) => {
        const indexA = used_elements.indexOf(a.name);
        const indexB = used_elements.indexOf(b.name);
        return indexA - indexB;
      })
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

    const cosmicHousesFilteredData = Object.keys(cosmicElements).map((key) => {
      if (
        cosmicElements[key] !== null &&
        typeof cosmicElements[key] === 'object' &&
        used_houses.indexOf(cosmicElements[key].name) > -1
      ) {
        return cosmicElements[key];
      }
      return null;
    })
      .filter(Boolean)
      .sort((a, b) => {
        const indexA = used_houses.indexOf(a.name);
        const indexB = used_houses.indexOf(b.name);
        return indexA - indexB;
      })
      .map((house) => ({
        ...house,
        name: t.houses[house.name],
        sign: t.signs[house.sign],
        element: t.elements[house.element]
      }));
    
    const cosmicAspects = response.data.chart_data.aspects;
    const cosmicAspectsFilteredData = cosmicAspects.map((a) => ({
      ...a,
      p1_name: t.planets?.[a.p1_name] ?? a.p1_name,
      p2_name: t.planets?.[a.p2_name] ?? a.p2_name,
      aspect: t.aspects?.[a.aspect] ?? a.aspect
    }));


    let allData = {
      "cosmic_elements": cosmicElementsFilteredData,
      "cosmic_houses": cosmicHousesFilteredData,
      "cosmic_aspects": cosmicAspectsFilteredData
    };
    switch (type) {
      case "natal":
        allData = {
          "cosmic_elements": cosmicElementsFilteredData.filter(
            (p) =>
              natal_elements[lang].includes(p.name)
          ),
          "cosmic_houses": cosmicHousesFilteredData,
          "cosmic_aspects": cosmicAspectsFilteredData.filter(
            (a) =>
              natal_elements[lang].includes(a.p1_name) &&
              natal_elements[lang].includes(a.p2_name)
          )
        };
        break;
      case "karmic":
        allData = {
          "cosmic_elements": cosmicElementsFilteredData.filter(
            (p) => karmic_elements[lang].includes(p.name)
          ),
          "cosmic_houses": cosmicHousesFilteredData,
          "cosmic_aspects": cosmicAspectsFilteredData.filter(
            (a) =>
              (karmic_elements[lang].includes(a.p1_name) && (karmic_elements[lang].includes(a.p2_name) || natal_elements[lang].includes(a.p2_name))) ||
              (karmic_elements[lang].includes(a.p2_name) && (karmic_elements[lang].includes(a.p1_name) || natal_elements[lang].includes(a.p1_name)))
          )
        };
        break;
      default:
        break;
    }
    res.json(allData);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Get filtered astral SVG chart
app.post('/api/v2/:lang/astral-chart', async (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = req.body;

  let validation = validateData(req);
  if (validation !== 0) {
    switch (validation) {
      case 21:
        return res.status(400).json({ error: 'Missing required parameters. Please provide: longitude, latitude, year, month, day, hour, minute, city, nation, name' });
      case 22:
        return res.status(400).json({ error: 'Invalid parameter values. Please check the ranges and types of all parameters.' });
    }
  }

  try {
    const options = {
      method: 'POST',
      url: ASTROLOGER_API_URL + '/api/v5/chart/birth-chart',
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
          zodiac_type: "Tropical",
          perspective_type: "Apparent Geocentric",
          houses_system_identifier: "P"
        },
        active_points: [...used_planets, ...used_astral_points],
        active_aspects: used_aspects,
        theme: "light"
      }
    };

    const response = await axios.request(options);
    const allData = response.data.chart;

    res.json(allData);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Get filtered lunar data
app.post('/api/v2/:lang/lunar-data', async (req, res) => {
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
      url: `http://localhost:${port}/api/v2/${lang}/birth-data`,
      headers: {
        'Accept-Language': lang
      },
      data: req.body
    };

    const response = await axios.request(options);
    const filteredData = response.data.chart_data.subject;

    const allData = {
      ...filteredData['lunar_phase'],
      moon_phase_name: t.lunar_phases[filteredData['lunar_phase'].moon_phase_name]
    };

    res.json(allData);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
