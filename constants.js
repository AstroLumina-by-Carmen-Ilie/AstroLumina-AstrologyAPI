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
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Ascendant",
  "Lilith",
  "Chiron",
  "Nodul Nord",
  "Nodul Sud"
];

const natalElements = {
  "ro": ["Soare", "Luna", "Marte", "Venus", "Mercur"],
  "en": ["Sun", "Moon", "Mars", "Venus", "Mercury"]
}
const karmicElements = {
  "ro": ["Jupiter", "Saturn", "Uranus", "Neptun", "Pluto", "Ascendent", "Nodul Nord", "Nodul Sud", "Chiron", "Lilith", "Juno"],
  "en": ["Jupiter","Saturn", "Uranus", "Neptune", "Pluto", "Ascendant", "North Node", "South Node", "Kiron", "Lilith", "Juno"]
}

module.exports = {
  planetOrder,
  zodiacOrder,
  natalElements,
  karmicElements
}