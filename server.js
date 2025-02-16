require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://astrolumina.netlify.app',
    'https://carmenilie.com',
    'https://www.carmenilie.com'
  ]
}));

require('./utilities.js');

app.get('/test', async (req, res) => {
  try {
    const testPayload = {
      "longitude": 23.06339,
      "latitude": 46.27406,
      "year": 2025,
      "month": 1,
      "day": 27,
      "hour": 12,
      "minute": 0
    };
    const lang = 'ro';
    const response = await axios.post(
      `http://localhost:3000/api/v1/${lang}/interpretations`, 
      testPayload,
      {
        headers: {
          'Accept-Language': lang
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/v1/:lang/interpretations', async (req, res) => {
  const lang = req.params.lang;
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).send('Invalid language specified. Use /ro/ or /en/.');
  }

  try {
    const response = await axios.post(API_URL + '/calc', req.body, {
      headers: {
        'x-api-key': API_KEY,
        'Accept-Language': lang
      },
    });
    res.json({
      data: response.data.dynamicTexts.map((p) => {
        try {
          const interpretation = require(
            `./interpretations/${req.params.lang}/${p.planet}/${p.sign}/${p.house}.js`
          );
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
            interpretation: 'Interpretation not found' 
          };
        }
      })
    });
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).send('Error getting data');
  }
});

app.post('/api/v1/:lang/planet-sign-house', async (req, res) => {
  const lang = req.params.lang;
  const validLanguages = ['ro', 'en'];

  if (!validLanguages.includes(lang)) {
    return res.status(400).send('Invalid language specified. Use /ro/ or /en/.');
  }

  try {
    const response = await axios.post(API_URL + '/calc', req.body, {
      headers: {
        'x-api-key': API_KEY,
        'Accept-Language': lang
      },
    });
    console.log('API Response:', response.data);
    res.json({
      data: response.data.dynamicTexts.map((p) => ({
        planet: p.planet,
        sign: p.sign,
        house: p.house
      }))
    });
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).send('Error getting data');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  fs.writeFileSync('server.pid', process.pid.toString());
});
