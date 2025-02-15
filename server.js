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
    'http://localhost:5173',
    'https://astrolumina.netlify.app',
    'https://carmenilie.com',
    'https://www.carmenilie.com'
  ]
}));

app.post('/api/v1/:lang/planet-sign-house', async (req, res) => {
  const lang = req.params.lang;
  const validLanguages = ['ro', 'en'];

  console.log('Received request for language:', lang);

  if (!validLanguages.includes(lang)) {
    console.log('Invalid language:', lang);
    return res.status(400).send('Invalid language specified. Use /ro/ or /en/.');
  }

  console.log('Processing request for valid language:', lang);

  try {
    const response = await axios.post(API_URL + '/calc', req.body, {
      headers: {
        'x-api-key': API_KEY,
        'Accept-Language': lang
      },
    });
    console.log('API Response:', response.data);
    res.json({
      dynamicTexts: response.data.dynamicTexts.map((p) => ({
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
