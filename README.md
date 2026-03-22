# AstroLumina Astrology API

TypeScript/Node.js (Express 5.x) API server that wraps the [Astrologer](https://rapidapi.com) astrological engine (RapidAPI). Generates natal chart data, filtered astral elements, SVG charts, and lunar phase information from birth data.

## Features

- **Automatic timezone detection** from latitude/longitude via `geo-tz`
- **Astrologer API integration** — birth chart, aspects, planetary positions
- **Filtered data endpoints** — full, natal, karmic subsets
- **Localization** — Romanian (`ro`) and English (`en`)
- **SVG chart rendering** — astrological wheel diagrams
- **Lunar phase data** — phase name, illumination, upcoming phases
- **Production observability** — Sentry error tracking, performance profiling, ANR detection
- **Security** — Helmet, CORS whitelist, rate limiting (20 req/min/IP)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22.x (LTS) |
| Framework | Express 5.x |
| Language | TypeScript (ESM) |
| Monitoring | Sentry 10.x (with profiling) |
| HTTP Client | Axios |
| Middleware | Helmet, Compression, Morgan, CORS, Rate Limit |
| Validation | Zod |

## Project Structure

```
.
├── src/
│   ├── server.ts              # Main Express entry point
│   ├── instrument.ts          # Sentry initialization (imported first)
│   ├── constants.ts           # Astrological constants (planets, houses, aspects)
│   ├── config/
│   │   └── env.ts             # Environment variable validation (zod)
│   ├── middleware/
│   │   ├── security.ts        # Helmet, CORS, rate limiter
│   │   └── error-handler.ts   # Error handling middleware
│   ├── routes/
│   │   ├── health.ts          # GET /health
│   │   └── astrology.ts       # Astrology API routes
│   ├── translations/
│   │   ├── index.ts           # Translation loader + types
│   │   ├── en.ts              # English translations
│   │   └── ro.ts              # Romanian translations
│   └── types/
│       └── astrology.ts       # TypeScript interfaces
├── dist/                      # Compiled output (gitignored)
├── tsconfig.json
├── package.json
└── .env                       # Environment variables (not committed)
```

## Prerequisites

- **Node.js** 22.x (LTS)
- **RapidAPI** subscription for [Astrologer API](https://rapidapi.com)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```bash
# Required — Astrologer API credentials
ASTROLOGER_API_KEY="your-rapidapi-key"
ASTROLOGER_API_URL="https://astrologer.p.rapidapi.com"
ASTROLOGER_API_HOST="astrologer.p.rapidapi.com"

# Optional — Server
PORT=3031                          # Default: 3031
NODE_ENV=development               # development | production

# Optional — CORS (comma-separated origins)
CORS_ORIGINS="https://example.com,https://app.example.com"

# Optional — Sentry error tracking
SENTRY_DSN="your-sentry-dsn"
SENTRY_RELEASE="v1.0.0"
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASTROLOGER_API_KEY` | Yes | — | RapidAPI key for Astrologer |
| `ASTROLOGER_API_URL` | Yes | — | Astrologer API base URL |
| `ASTROLOGER_API_HOST` | Yes | — | RapidAPI host header |
| `PORT` | No | `3031` | Server listen port |
| `NODE_ENV` | No | `development` | Environment mode |
| `CORS_ORIGINS` | No | *(hardcoded list)* | Comma-separated allowed origins |
| `SENTRY_DSN` | No | — | Sentry DSN for error tracking |
| `SENTRY_RELEASE` | No | — | Sentry release identifier |

## Usage

### Development

```bash
npm run dev    # Runs with tsx watch (auto-reload)
```

### Build

```bash
npm run build  # Compiles TypeScript to dist/
```

### Production

```bash
npm run build
npm start      # Runs compiled dist/server.js
```

Server starts at `http://localhost:3031`.

## Deployment (Render)

- **Build Command:** `npm run render-build`
- **Start Command:** `npm start`
- **Node Version:** 22.x (set via `engines` in package.json)

The `render-build` script handles clean install (including devDependencies for TypeScript compilation) and builds the project. At runtime, `NODE_ENV=production` is used automatically by Render.

## API Endpoints

All endpoints use `POST` with JSON body and accept a `:lang` parameter (`ro` or `en`).

### `GET /health`

Health check endpoint. Returns server status, uptime, memory usage, and Node.js version.

```bash
curl http://localhost:3031/health
```

### `POST /api/v2/:lang/birth-data`

Returns the complete Astrologer response for a natal chart (data + SVG).

**Request body:**

| Field | Type | Range | Required |
|-------|------|-------|----------|
| `longitude` | number | [-180, 180] | Yes |
| `latitude` | number | [-90, 90] | Yes |
| `year` | number | [1, 3000] | Yes |
| `month` | number | [1, 12] | Yes |
| `day` | number | [1, 31] | Yes |
| `hour` | number | [0, 23] | Yes |
| `minute` | number | [0, 59] | Yes |
| `city` | string | — | Yes |
| `nation` | string | ISO 3166-1 alpha-2 | Yes |
| `name` | string | — | Yes |

**Example:**

```bash
curl -sS -X POST "http://localhost:3031/api/v2/ro/birth-data" \
  -H "Content-Type: application/json" \
  -d '{
    "longitude": 26.1025,
    "latitude": 44.4268,
    "year": 1994,
    "month": 7,
    "day": 16,
    "hour": 10,
    "minute": 30,
    "city": "Bucharest",
    "nation": "RO",
    "name": "Demo"
  }'
```

### `POST /api/v2/:lang/astral-data/:type?`

Returns filtered astrological data (planets, houses, aspects) with translated labels.

Optional `:type` parameter:
- *(none)* — all active elements
- `natal` — natal subset (Sun, Moon, Mars, Venus, Mercury)
- `karmic` — karmic subset (outer planets, nodes, Lilith, houses, Chiron)

**Example (all elements):**

```bash
curl -sS -X POST "http://localhost:3031/api/v2/en/astral-data" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

**Example (karmic elements, Romanian):**

```bash
curl -sS -X POST "http://localhost:3031/api/v2/ro/astral-data/karmic" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

### `POST /api/v2/:lang/astral-chart`

Returns only the SVG chart data from the birth chart calculation.

### `POST /api/v2/:lang/lunar-data`

Returns lunar phase information with the phase name translated to the specified language.

## Security

- **Helmet** — secure HTTP headers
- **Rate limiting** — 20 requests per minute per IP
- **CORS** — explicit origin whitelist (configurable via `CORS_ORIGINS`)
- **Request size limit** — 1MB max body; returns `413` if exceeded
- **Sentry PII scrubbing** — API keys redacted from error reports

## Error Handling

| Status | Meaning |
|--------|---------|
| `400` | Invalid input (missing or out-of-range parameters, unsupported language) |
| `404` | Route not found |
| `413` | Request payload too large (>1MB) |
| `429` | Rate limit exceeded |
| `500` | Internal server error (upstream API failure, unexpected errors) |

In development mode, error responses include the stack trace for debugging.

## Troubleshooting

| Symptom | Cause |
|---------|-------|
| `401/403` from RapidAPI | Wrong `ASTROLOGER_API_KEY` or `ASTROLOGER_API_HOST` |
| `500` "Error getting data" | Invalid API keys, wrong URL, RapidAPI rate limit, or network issue |
| Wrong timezone | Check `latitude`/`longitude` are decimal degrees with correct signs |
| `413` payload error | Request body exceeds 1MB limit |
| `429` too many requests | Client exceeded 20 req/min rate limit |
