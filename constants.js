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
  "Pluto"
];
const used_astral_points = [
  "Ascendant",
  "Descendant",
  "True_North_Lunar_Node",
  "True_South_Lunar_Node",
  "Mean_Lilith",
  "Medium_Coeli",
  "Imum_Coeli"
];
const used_asteroids = [
  "Chiron",
  "Juno",
  "Pholus",
  "Ceres",
  "Pallas",
  "Vesta",
  "Eris",
  "Sedna",
  "Haumea",
  "Makemake",
  "Ixion",
  "Orcus",
  "Quaoar"
];
const used_stars = [
  "Regulus",
  "Spica"
];
const used_elements = [
  ...used_planets,
  ...used_astral_points,
  ...used_asteroids,
  ...used_stars
];

const unused_planets = [];
const unused_astral_points = [
  "Mean_North_Lunar_Node",
  "Mean_South_Lunar_Node",
  "True_Lilith",
  "Earth",
  "Pars_Fortunae",
  "Pars_Spiritus",
  "Pars_Amoris",
  "Pars_Fidei",
  "Vertex",
  "Anti_Vertex"
];
const unused_asteroids = [];
const unused_stars = [];
const unused_elements = [
  ...unused_planets,
  ...unused_astral_points,
  ...unused_asteroids,
  ...unused_stars
];

const used_aspects = [
  { "name": "conjunction", "orb": 8 },
  { "name": "semi-sextile", "orb": 8 },
  { "name": "sextile", "orb": 8 },
  { "name": "square", "orb": 8 },
  { "name": "trine", "orb": 8 },
  { "name": "opposition", "orb": 8 }
];
const unused_aspects = [
  { "name": "semi-square", "orb": 2 },
  { "name": "biquintile", "orb": 2 },
  { "name": "quintile", "orb": 2 },
  { "name": "sesquiquadrate", "orb": 2 },
  { "name": "quincunx", "orb": 4 }
];

const planet_symbols = {
  ro: {
    // Planete
    'Soare': '☉',
    'Luna': '☽',
    'Mercur': '☿',
    'Venus': '♀',
    'Marte': '♂',
    'Jupiter': '♃',
    'Saturn': '♄',
    'Uranus': '♅',
    'Neptun': '♆',
    'Pluto': '♇',

    // Puncte
    'Ascendent': '↑',
    'Descendent': '↓',
    'Lilith': '⚸',
    'Nodul Nord': '☊',
    'Nodul Sud': '☋',
    'Mijlocul Cerului': 'MC',
    'Fundul Cerului': 'IC',

    // Asteroizi / alte puncte
    'Chiron': '⚷',
    'Ceres': '⚳',
    'Pallas': '⚴',
    'Juno': '⚵',
    'Vesta': '⚶',

    'Pholus': '⯛',
    'Eris': '⯰',
    'Sedna': '⯲',

    'Haumea': '🝻',
    'Makemake': '🝼',
    'Ixion': null,
    'Orcus': '🝿',
    'Quaoar': '🝾',

    // Stele fixe
    'Regulus': 'Reg',
    'Spica': 'Sp'
  },

  en: {
    // Planets
    'Sun': '☉',
    'Moon': '☽',
    'Mercury': '☿',
    'Venus': '♀',
    'Mars': '♂',
    'Jupiter': '♃',
    'Saturn': '♄',
    'Uranus': '♅',
    'Neptune': '♆',
    'Pluto': '♇',

    // Points
    'Ascendant': '↑',
    'Descendant': '↓',
    'Lilith': '⚸',
    'North Node': '☊',
    'South Node': '☋',
    'Medium Coeli': 'MC',
    'Imum Coeli': 'IC',

    // Asteroids / other points
    'Chiron': '⚷',
    'Ceres': '⚳',
    'Pallas': '⚴',
    'Juno': '⚵',
    'Vesta': '⚶',

    'Pholus': '⯛',
    'Eris': '⯰',
    'Sedna': '⯲',

    'Haumea': '🝻',
    'Makemake': '🝼',
    'Ixion': null,
    'Orcus': '🝿',
    'Quaoar': '🝾',

    // Fixed stars
    'Regulus': 'Reg',
    'Spica': 'Sp'
  }
};

const sign_order = [
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

const natal_elements = {
  "ro": [
    "Soare",
    "Luna",
    "Marte",
    "Venus",
    "Mercur"
  ],
  "en": [
    "Sun",
    "Moon",
    "Mars",
    "Venus",
    "Mercury"
  ]
}
const karmic_elements = {
  "ro": [
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptun",
    "Pluto",
    "Ascendent",
    "Descendent",
    "Nodul Nord",
    "Nodul Sud",
    "Lilith",
    "Mijlocul Cerului",
    "Fundul Cerului",
    "Chiron"
  ],
  "en": [
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
    "Ascendant",
    "Descendant",
    "North Node",
    "South Node",
    "Lilith",
    "Medium Coeli",
    "Imum Coeli",
    "Chiron"
  ]
}

module.exports = {
  used_planets,
  used_astral_points,
  used_asteroids,
  used_stars,
  used_elements,
  unused_elements,
  used_aspects,
  unused_aspects,
   planet_symbols,
  sign_order,
  natal_elements,
  karmic_elements
}