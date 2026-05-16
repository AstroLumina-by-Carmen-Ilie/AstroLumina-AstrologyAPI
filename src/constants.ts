export const used_planets: string[] = [
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
];

export const used_astral_points: string[] = [
  "Ascendant",
  "Descendant",
  "True_North_Lunar_Node",
  "True_South_Lunar_Node",
  "Mean_Lilith",
  "Medium_Coeli",
  "Imum_Coeli",
];

export const used_asteroids: string[] = [
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
  "Quaoar",
];

export const used_stars: string[] = ["Regulus", "Spica"];

export const used_element_symbols: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  Ascendant: "↑",
  Descendant: "↓",
  Mean_Lilith: "⚸",
  True_North_Lunar_Node: "☊",
  True_South_Lunar_Node: "☋",
  Medium_Coeli: "MC",
  Imum_Coeli: "IC",
  Chiron: "⚷",
  Ceres: "⚳",
  Pallas: "⚴",
  Juno: "⚵",
  Vesta: "⚶",
  Pholus: "⯛",
  Eris: "⯰",
  Sedna: "⯲",
  Haumea: "🝻",
  Makemake: "🝼",
  Ixion: "Ix",
  Orcus: "🝿",
  Quaoar: "🝾",
  Regulus: "🜲",
  Spica: "★",
};

export const used_elements: string[] = [
  ...used_planets,
  ...used_astral_points,
  ...used_asteroids,
  ...used_stars,
];

export const unused_elements: string[] = [
  "Mean_North_Lunar_Node",
  "Mean_South_Lunar_Node",
  "True_Lilith",
  "Earth",
  "Pars_Fortunae",
  "Pars_Spiritus",
  "Pars_Amoris",
  "Pars_Fidei",
  "Vertex",
  "Anti_Vertex",
];

export const used_houses: string[] = [
  "First_House",
  "Second_House",
  "Third_House",
  "Fourth_House",
  "Fifth_House",
  "Sixth_House",
  "Seventh_House",
  "Eighth_House",
  "Ninth_House",
  "Tenth_House",
  "Eleventh_House",
  "Twelfth_House",
];

export const unused_houses: string[] = [];

export interface AspectConfig {
  name: string;
  orb: number;
}

export const used_aspects: AspectConfig[] = [
  { name: "conjunction", orb: 8 },
  { name: "semi-sextile", orb: 8 },
  { name: "sextile", orb: 8 },
  { name: "square", orb: 8 },
  { name: "trine", orb: 8 },
  { name: "opposition", orb: 8 },
];

export const unused_aspects: AspectConfig[] = [
  { name: "semi-square", orb: 2 },
  { name: "biquintile", orb: 2 },
  { name: "quintile", orb: 2 },
  { name: "sesquiquadrate", orb: 2 },
  { name: "quincunx", orb: 4 },
];

export const sign_order: string[] = [
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
  "Pisces",
];

export const sign_emojis: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export const natal_elements: Record<string, string[]> = {
  ro: ["Soare", "Luna", "Marte", "Venus", "Mercur"],
  en: ["Sun", "Moon", "Mars", "Venus", "Mercury"],
};

export const karmic_elements: Record<string, string[]> = {
  ro: [
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
    "Chiron",
  ],
  en: [
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
    "Chiron",
  ],
};
