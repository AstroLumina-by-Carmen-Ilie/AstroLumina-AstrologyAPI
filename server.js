require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const app = express();
const port = 3031;

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3031',
    'http://localhost:5173',
    'https://astrolumina.netlify.app',
    'https://carmenilie.com',
    'https://www.carmenilie.com'
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
  const utilitiesPath = path.resolve(__dirname, 'utilities.js');
  const constantsPath = path.resolve(__dirname, 'constants.js');

  try {
    const { translations: t } = require(translationsPath);
    const { calculateSouthNode } = require(utilitiesPath);
    const { planetOrder } = require(constantsPath);
    const response = await axios.post(API_URL + '/calc', req.body, {
      headers: {
        'x-api-key': API_KEY,
        'Accept-Language': lang
      },
    });

    const northNodeData = response.data.dynamicTexts.find(p => p.planet === 'Nodul Nord');
    let southNodeData;
    if (northNodeData) {
      southNodeData = calculateSouthNode(northNodeData.sign, northNodeData.house);
    }

    let allData = [...response.data.dynamicTexts];
    if (southNodeData) {
      allData.push({
        planet: "Nodul Sud",
        sign: southNodeData.sign,
        house: southNodeData.house
      });
    }

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

app.post('/api/v1/:lang/interpretations', async (req, res) => {
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

    const interpretedData = response.data.data.map((p) => {
      try {
        const interpretationPath = path.resolve(
          __dirname,
          'interpretations',
          lang,
          p.planet,
          p.sign,
          `${p.house}.js`
        );
        const interpretation = require(interpretationPath);
        return { 
          planet: p.planet,
          sign: p.sign,
          house: p.house,
          interpretation: interpretation.interpretation 
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

    res.json({
      data: interpretedData
    });
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
