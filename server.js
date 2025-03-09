require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const interpretationService = require('./services/interpretationService');
const { planetOrder } = require('./constants');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const app = express();
const port = 3031;

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

app.post('/api/v1/:lang/planet-sign-house', async (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const { longitude, latitude, year, month, day, hour, minute } = req.body;

  // Validate required parameters
  if (!longitude && longitude !== 0 || 
      !latitude && latitude !== 0 || 
      !year && year !== 0 || 
      !month && month !== 0 || 
      !day && day !== 0 || 
      !hour && hour !== 0 || 
      !minute && minute !== 0) {
    return res.status(400).json({ 
      error: 'Missing required parameters. Please provide: longitude, latitude, year, month, day, hour, minute',
      received: { longitude, latitude, year, month, day, hour, minute }
    });
  }

  // Validate parameter types and ranges
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180 ||
      typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
      typeof year !== 'number' || year < 1900 || year > 2300 ||
      typeof month !== 'number' || month < 1 || month > 12 ||
      typeof day !== 'number' || day < 1 || day > 31 ||
      typeof hour !== 'number' || hour < 0 || hour > 23 ||
      typeof minute !== 'number' || minute < 0 || minute > 59) {
    return res.status(400).json({ error: 'Invalid parameter values. Please check the ranges and types of all parameters.' });
  }

  const translationsPath = path.resolve(__dirname, 'translations', `${lang}.js`);
  const constantsPath = path.resolve(__dirname, 'constants.js');

  try {
    const { translations: t } = require(translationsPath);
    const response = await axios.post(API_URL + '/calc', req.body, {
      headers: {
        'x-api-key': API_KEY,
        'Accept-Language': lang
      },
    });

    const allData = response.data.data;
    allData.sort((a, b) => {
      const indexA = planetOrder.indexOf(a.planet);
      const indexB = planetOrder.indexOf(b.planet);
      return indexA - indexB;
    });

    const mappedData = allData.map((p) => ({
      planet: t["planets"][p.planet],
      sign: t["signs"][p.sign],
      house: p.house.split(" ").map((word, i) => i == 0 ? t[word] : word).join(" ")
    }));

    res.json({
      data: mappedData
    });
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Error getting data', details: error.message });
  }
});

app.post('/api/v1/:lang/interpretations/:type?', async (req, res) => {
  const type = req.params.type?.toLowerCase();
  const lang = req.params.lang?.toLowerCase();
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
  }

  const { longitude, latitude, year, month, day, hour, minute } = req.body;

  // Validate required parameters
  if (!longitude && longitude !== 0 || 
      !latitude && latitude !== 0 || 
      !year && year !== 0 || 
      !month && month !== 0 || 
      !day && day !== 0 || 
      !hour && hour !== 0 || 
      !minute && minute !== 0) {
    return res.status(400).json({ 
      error: 'Missing required parameters. Please provide: longitude, latitude, year, month, day, hour, minute',
      received: { longitude, latitude, year, month, day, hour, minute }
    });
  }

  // Validate parameter types and ranges
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180 ||
      typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
      typeof year !== 'number' || year < 1900 || year > 2300 ||
      typeof month !== 'number' || month < 1 || month > 12 ||
      typeof day !== 'number' || day < 1 || day > 31 ||
      typeof hour !== 'number' || hour < 0 || hour > 23 ||
      typeof minute !== 'number' || minute < 0 || minute > 59) {
    return res.status(400).json({ error: 'Invalid parameter values. Please check the ranges and types of all parameters.' });
  }

  try {
    const response = await axios.post(
      `http://localhost:${port}/api/v1/${lang}/planet-sign-house`, 
      req.body,
      {
        headers: {
          'Accept-Language': lang
        }
      }
    );

    const interpretationPromises = response.data.data.map(async (p) => {
      try {
        const interpretation = await interpretationService.getInterpretation(lang, p.planet, p.sign, p.house);
        return { 
          planet: p.planet,
          sign: p.sign,
          house: p.house,
          interpretation: interpretation || '...' 
        };
      } catch (error) {
        console.error(
          `Error loading interpretation for ${p.planet} in ${p.sign}, ${p.house}:`, error
        );
        return {
          planet: p.planet,
          sign: p.sign,
          house: p.house,
          interpretation: '...' 
        };
      }
    });

    const interpretedData = await Promise.all(interpretationPromises);

    const constantsPath = path.resolve(__dirname, 'constants.js');
    const { natalElements, karmicElements } = require(constantsPath);
    switch (type) {
      case "natal":
        res.json({
          data: interpretedData.filter((p) => natalElements[lang].includes(p.planet))
        });
        break;
      case "karmic":
        res.json({
          data: interpretedData.filter((p) => karmicElements[lang].includes(p.planet))
        });
        break;
      default:
        res.json({
          data: interpretedData
        });
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
