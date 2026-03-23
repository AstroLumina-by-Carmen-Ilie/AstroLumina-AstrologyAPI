import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { find as timezone } from 'geo-tz';
import { Sentry } from '../instrument.js';
import { env } from '../config/env.js';
import {
  used_elements,
  used_element_symbols,
  used_houses,
  used_aspects,
  used_planets,
  used_astral_points,
  used_asteroids,
  used_stars,
  natal_elements,
  karmic_elements,
} from '../constants.js';
import { validateLanguage, loadTranslations, getLanguage } from '../translations/index.js';
import type { BirthDataResponse } from '../types/astrology.js';

const router = Router();

// ─── Validation ───────────────────────────────────────────────

function validateData(req: Request): number {
  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = req.body as Record<string, unknown>;

  if (
    (longitude === undefined || longitude === null) ||
    (latitude === undefined || latitude === null) ||
    (year === undefined || year === null) ||
    (month === undefined || month === null) ||
    (day === undefined || day === null) ||
    (hour === undefined || hour === null) ||
    (minute === undefined || minute === null) ||
    city === undefined || city === null ||
    nation === undefined || nation === null ||
    name === undefined || name === null
  ) {
    return 21;
  }

  if (
    typeof longitude !== 'number' || longitude < -180 || longitude > 180 ||
    typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
    typeof year !== 'number' || year < 1 || year > 3000 ||
    typeof month !== 'number' || month < 1 || month > 12 ||
    typeof day !== 'number' || day < 1 || day > 31 ||
    typeof hour !== 'number' || hour < 0 || hour > 23 ||
    typeof minute !== 'number' || minute < 0 || minute > 59 ||
    typeof city !== 'string' ||
    typeof nation !== 'string' ||
    typeof name !== 'string'
  ) {
    return 22;
  }

  return 0;
}

function getValidationError(code: number): string {
  switch (code) {
    case 21:
      return 'Missing required parameters. Please provide: longitude, latitude, year, month, day, hour, minute, city, nation, name';
    case 22:
      return 'Invalid parameter values. Check ranges: longitude [-180,180], latitude [-90,90], year [1,3000], month [1,12], day [1,31], hour [0,23], minute [0,59].';
    default:
      return 'Validation error';
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function getPointType(name: string): string {
  if (used_planets.includes(name)) return 'planet';
  if (used_astral_points.includes(name)) return 'astral_point';
  if (used_asteroids.includes(name)) return 'asteroid';
  if (used_stars.includes(name)) return 'star';
  return 'astrological_point';
}

function buildOptions(body: Record<string, unknown>) {
  const { longitude, latitude, year, month, day, hour, minute, city, nation, name } = body;
  const tz = timezone(latitude as number, longitude as number)[0];

  return {
    method: 'POST' as const,
    url: `${env.ASTROLOGER_API_URL}/api/v5/chart/birth-chart`,
    headers: {
      'x-rapidapi-key': env.ASTROLOGER_API_KEY,
      'x-rapidapi-host': env.ASTROLOGER_API_HOST,
      'Content-Type': 'application/json',
    },
    data: {
      subject: {
        name,
        year,
        month,
        day,
        hour,
        minute,
        longitude,
        latitude,
        city,
        nation,
        timezone: tz,
        zodiac_type: 'Tropical',
        perspective_type: 'Apparent Geocentric',
        houses_system_identifier: 'P',
      },
      active_points: used_elements,
      active_aspects: used_aspects,
      theme: 'light',
      style: 'modern',
    },
  };
}

async function fetchBirthData(body: Record<string, unknown>): Promise<BirthDataResponse> {
  const { city, nation, year } = body;

  return Sentry.startSpan(
    { op: 'http.client', name: 'POST Astrologer API /birth-chart' },
    async (span) => {
      span?.setAttribute('astro.city', city as string);
      span?.setAttribute('astro.nation', nation as string);
      span?.setAttribute('astro.year', year as number);

      const options = buildOptions(body);
      const response = await axios.request<BirthDataResponse>(options);
      return response.data;
    },
  );
}

function requireLanguage(req: Request, res: Response): string | null {
  const lang = getLanguage(req);
  if (!validateLanguage(lang)) {
    res.status(400).json({ error: 'Invalid language specified. Use ro or en.' });
    return null;
  }
  return lang;
}

function requireValidBody(req: Request, res: Response): boolean {
  const validation = validateData(req);
  if (validation !== 0) {
    res.status(400).json({ error: getValidationError(validation) });
    return false;
  }
  return true;
}

// ─── Routes ───────────────────────────────────────────────────

// Get full astral data from Astrologer
router.post('/api/v2/:lang/birth-data', async (req: Request, res: Response, next: NextFunction) => {
  const lang = requireLanguage(req, res);
  if (!lang) return;

  Sentry.setContext('request', { endpoint: 'birth-data', language: lang });

  if (!requireValidBody(req, res)) return;

  try {
    const allData = await fetchBirthData(req.body);
    res.json(allData);
  } catch (error) {
    console.error('Error fetching birth data:', (error as Error).message);
    Sentry.captureException(error, { tags: { endpoint: 'birth-data', language: lang } });
    next(error);
  }
});

// Get filtered astral data — shared handler
async function handleAstralData(
  type: string,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const lang = requireLanguage(req, res);
  if (!lang) return;

  Sentry.setContext('request', {
    endpoint: 'astral-data',
    language: lang,
    type: type || 'full',
  });

  if (!requireValidBody(req, res)) return;

  const t = loadTranslations(lang);

  try {
    const birthData = await Sentry.startSpan(
      { op: 'astro.filter', name: `astral-data/${type || 'full'}` },
      async () => fetchBirthData(req.body),
    );

    const cosmicElements = birthData.chart_data.subject;

    const cosmicElementsFilteredData = Object.keys(cosmicElements)
      .filter((key) => {
        const el = cosmicElements[key];
        return el !== null && typeof el === 'object' && used_elements.includes(el.name);
      })
      .map((key) => cosmicElements[key]!)
      .sort((a, b) => used_elements.indexOf(a!.name) - used_elements.indexOf(b!.name))
      .map((planet) => {
        const pointType = getPointType(planet!.name);
        return {
          ...planet,
          point_type: t.types[pointType] ?? pointType,
          name: t.planets[planet!.name] ?? planet!.name,
          house: t.houses[planet!.house ?? ''] ?? planet!.house,
          sign: t.signs[planet!.sign] ?? planet!.sign,
          symbol: used_element_symbols[planet!.name] ?? '',
          element: t.elements[planet!.element ?? ''] ?? planet!.element,
        };
      });

    const cosmicHousesFilteredData = Object.keys(cosmicElements)
      .filter((key) => {
        const el = cosmicElements[key];
        return el !== null && typeof el === 'object' && used_houses.includes(el.name);
      })
      .map((key) => cosmicElements[key]!)
      .sort((a, b) => used_houses.indexOf(a!.name) - used_houses.indexOf(b!.name))
      .map((house) => ({
        ...house,
        name: t.houses[house!.name] ?? house!.name,
        sign: t.signs[house!.sign] ?? house!.sign,
        element: t.elements[house!.element ?? ''] ?? house!.element,
      }));

    const cosmicAspectsFilteredData = birthData.chart_data.aspects.map((a) => ({
      ...a,
      p1_name: t.planets[a.p1_name] ?? a.p1_name,
      p2_name: t.planets[a.p2_name] ?? a.p2_name,
      aspect: t.aspects[a.aspect] ?? a.aspect,
    }));

    let allData: {
      cosmic_elements: typeof cosmicElementsFilteredData;
      cosmic_houses: typeof cosmicHousesFilteredData;
      cosmic_aspects: typeof cosmicAspectsFilteredData;
    } = {
      cosmic_elements: cosmicElementsFilteredData,
      cosmic_houses: cosmicHousesFilteredData,
      cosmic_aspects: cosmicAspectsFilteredData,
    };

    switch (type) {
      case 'natal':
        allData = {
          cosmic_elements: cosmicElementsFilteredData.filter(
            (p) => natal_elements[lang]!.includes(p.name),
          ),
          cosmic_houses: cosmicHousesFilteredData,
          cosmic_aspects: cosmicAspectsFilteredData.filter(
            (a) =>
              natal_elements[lang]!.includes(a.p1_name) &&
              natal_elements[lang]!.includes(a.p2_name),
          ),
        };
        break;
      case 'karmic':
        allData = {
          cosmic_elements: cosmicElementsFilteredData.filter(
            (p) => karmic_elements[lang]!.includes(p.name),
          ),
          cosmic_houses: cosmicHousesFilteredData,
          cosmic_aspects: cosmicAspectsFilteredData.filter(
            (a) =>
              (karmic_elements[lang]!.includes(a.p1_name) &&
                (karmic_elements[lang]!.includes(a.p2_name) || natal_elements[lang]!.includes(a.p2_name))) ||
              (karmic_elements[lang]!.includes(a.p2_name) &&
                (karmic_elements[lang]!.includes(a.p1_name) || natal_elements[lang]!.includes(a.p1_name))),
          ),
        };
        break;
      default:
        break;
    }

    res.json(allData);
  } catch (error) {
    console.error('Error fetching astral data:', (error as Error).message);
    Sentry.captureException(error, { tags: { endpoint: 'astral-data', language: lang, type: type || 'full' } });
    next(error);
  }
}

// Express 5 doesn't support :type? — register two routes
router.post('/api/v2/:lang/astral-data', (req: Request, res: Response, next: NextFunction) => {
  handleAstralData('', req, res, next);
});

router.post('/api/v2/:lang/astral-data/:type', (req: Request, res: Response, next: NextFunction) => {
  const type = String(req.params['type'] ?? '').toLowerCase();
  handleAstralData(type, req, res, next);
});

// Get filtered astral SVG chart
router.post('/api/v2/:lang/astral-chart', async (req: Request, res: Response, next: NextFunction) => {
  const lang = requireLanguage(req, res);
  if (!lang) return;

  Sentry.setContext('request', { endpoint: 'astral-chart', language: lang });

  if (!requireValidBody(req, res)) return;

  try {
    const birthData = await fetchBirthData(req.body);
    res.json(birthData.chart);
  } catch (error) {
    console.error('Error fetching astral chart:', (error as Error).message);
    Sentry.captureException(error, { tags: { endpoint: 'astral-chart', language: lang } });
    next(error);
  }
});

// Get filtered lunar data
router.post('/api/v2/:lang/lunar-data', async (req: Request, res: Response, next: NextFunction) => {
  const lang = requireLanguage(req, res);
  if (!lang) return;

  Sentry.setContext('request', { endpoint: 'lunar-data', language: lang });

  if (!requireValidBody(req, res)) return;

  const t = loadTranslations(lang);

  try {
    const birthData = await fetchBirthData(req.body);
    const lunarPhase = birthData.chart_data.lunar_phase as Record<string, unknown>;

    const allData = {
      ...lunarPhase,
      moon_phase_name: t.lunar_phases?.[lunarPhase['moon_phase_name'] as string] ?? lunarPhase['moon_phase_name'],
    };

    res.json(allData);
  } catch (error) {
    console.error('Error fetching lunar data:', (error as Error).message);
    Sentry.captureException(error, { tags: { endpoint: 'lunar-data', language: lang } });
    next(error);
  }
});

export default router;
