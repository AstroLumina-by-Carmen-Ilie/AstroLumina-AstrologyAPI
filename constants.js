const used_planets = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Ascendant",
  "Descendant",
  "True_Node",
  "True_South_Node",
  "Chiron",
  "Mean_Lilith",
  "Medium_Coeli",
  "Imum_Coeli"
];
const unused_planets = [
  "Mean_Node",
  "Mean_South_Node"
]

const used_aspects = [
  { "name": "conjunction", "orb": 8 },
  { "name": "semi-sextile", "orb": 2 },
  { "name": "semi-square", "orb": 2 },
  { "name": "sextile", "orb": 6 },
  { "name": "square", "orb": 8 },
  { "name": "trine", "orb": 8 },
  { "name": "opposition", "orb": 8 }
];
const unused_aspects = [
  { "name": "biquintile", "orb": 2 },
  { "name": "quintile", "orb": 2 },
  { "name": "sesquiquadrate", "orb": 2 },
  { "name": "quincunx", "orb": 4 }
];

const zodiacOrder = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];

const planetOrder = [
  "Sun",
  "Moon",
  "Mars",
  "Venus",
  "Mercury",
  "Saturn",
  "Jupiter",
  "Uranus",
  "Neptune",
  "Pluto",
  "Ascendant",
  "Descendant",
  "Lilith",
  "Chiron",
  "North Node",
  "South Node",
  "Medium Coeli",
  "Imum Coeli"
];

const natalElements = {
  "ro": ["Soare", "Luna", "Marte", "Venus", "Mercur"],
  "en": ["Sun", "Moon", "Mars", "Venus", "Mercury"]
}
const karmicElements = {
  "ro": ["Jupiter", "Saturn", "Uranus", "Neptun", "Pluto", "Ascendent", "Nodul Nord", "Nodul Sud", "Chiron", "Lilith"],
  "en": ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ascendant", "North Node", "South Node", "Chiron", "Lilith"]
}

module.exports = {
  used_planets,
  unused_planets,
  used_aspects,
  unused_aspects,
  planetOrder,
  zodiacOrder,
  natalElements,
  karmicElements
}