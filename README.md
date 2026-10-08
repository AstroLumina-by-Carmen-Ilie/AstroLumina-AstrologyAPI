# AstroLumina Astrology API

> Production-grade Node.js/TypeScript API server wrapping the Astrologer API (RapidAPI) for natal chart calculations, astrological data filtering, and lunar phase information.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express)](https://expressjs.com/)
![Sentry](https://img.shields.io/badge/Sentry-10.x-362d59?style=flat&logo=sentry)
![Docker](https://img.shields.io/badge/Docker-25.0-2496ed?style=flat&logo=docker)
![CI/CD](https://img.shields.io/badge/GitHub_Actions-2088ff?style=flat&logo=githubactions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- **Automatic timezone detection** — derives timezone from latitude/longitude via `geo-tz`
- **Astrologer API v5** — natal charts, aspects, planetary positions, SVG chart rendering
- **Filtered endpoints** — full, natal (`Sun, Moon, Mars, Venus, Mercury`), or karmic (`outer planets, nodes, Lilith, Chiron, houses`) data subsets
- **Localization** — Romanian (`ro`) and English (`en`) with translated labels
- **Lunar data** — phase name, illumination, zodiac signs, major phases
- **Zod validation** — input validation at every endpoint with type-safe schemas
- **Environment validation** — app fails fast with clear errors if config is invalid

---

## Security

| Feature           | Implementation                                              |
| ----------------- | ----------------------------------------------------------- |
| **HTTP Headers**  | Helmet (CSP, HSTS, X-Frame-Options, etc.)                   |
| **Rate Limiting** | 30 requests/minute per IP                                   |
| **CORS**          | Dynamic whitelist built from `*_SERVER_DC_PORT` / `*_SERVER_DC_DNS` and `*_SERVER_K8S_PORT` / `*_SERVER_K8S_DNS` env vars (Astrology, Booking, Payment, Frontend services) over `http` + `https` on `localhost`, `192.168.122.10-12` and each service DNS + Cloudflare Pages domains (`astrolumina.pages.dev`, `develop.astrolumina.pages.dev`, `astrolumina.com`, `astrolumina.ro`). Override via `CORS_ORIGINS`. |
| **Request Size**  | Max 1MB body (returns `413` if exceeded)                    |
| **PII Scrubbing** | Sentry automatically redacts API keys from error reports    |
| **Input Validation** | Zod schemas on all endpoint inputs                       |
| **Environment Validation** | Zod-validated env.ts — app refuses to start with missing required vars |

---

## Tech Stack

| Category        | Technology                                            |
| --------------- | ----------------------------------------------------- |
| **Runtime**     | Node.js 22.x (LTS)                                    |
| **Language**    | TypeScript (ESM, strict mode)                         |
| **Framework**   | Express 5.x                                           |
| **Validation**  | Zod                                                   |
| **HTTP Client** | Axios                                                 |
| **Middleware**  | Helmet, Compression, Morgan, CORS, express-rate-limit |
| **Monitoring**  | Sentry 10.x (with profiling)                          |
| **Timezone**    | geo-tz                                                |
| **Container**   | Docker, Docker Compose                                |
| **CI/CD**       | GitHub Actions                                        |

---

## Project Structure

```text
.
├── .github/
│   └── workflows/           # CI/CD pipelines
│       └── build-deploy.yml  # Docker image build & push
├── src/
│   ├── server.ts            # Express entry point
│   ├── instrument.ts        # Sentry initialization (imported first)
│   ├── constants.ts         # Astrological constants
│   ├── config/
│   │   └── env.ts           # Zod-based environment validation
│   ├── middleware/
│   │   ├── security.ts      # Helmet, CORS, rate limiter
│   │   └── error-handler.ts # Centralized error handling
│   ├── routes/
│   │   ├── health.ts        # GET /health
│   │   └── astrology.ts     # Astrology API routes
│   ├── translations/
│   │   ├── index.ts         # Translation loader + types
│   │   ├── en.ts            # English translations
│   │   └── ro.ts            # Romanian translations
│   └── types/
│       └── astrology.ts     # TypeScript interfaces
├── dist/                    # Compiled output (gitignored)
├── docker-compose.yml       # Single-service deployment
├── Dockerfile               # Multi-stage build
├── VERSION.json             # Version config
├── .dockerignore
├── .env.example             # Environment variables template (not committed)
├── tsconfig.json
└── package.json
```

---

## Architecture

The AstrologyAPI is a **single-service** deployment that acts as a proxy and transformer for the Astrologer RapidAPI:

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
└────────────────────────┬─────────────────────────────────┘
                         │ POST /api/v2/:lang/*
                         ▼
┌──────────────────────────────────────────────────────────┐
│              AstrologyAPI (1 replica)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │  Security  │→ │  Routes    │→ │  Astrologer API    │ │
│  │  (Helmet,  │  │  (Zod      │  │  (RapidAPI)        │ │
│  │  CORS,     │  │  validate) │  │                     │ │
│  │  Rate Lim) │  └────────────┘  └────────────────────┘ │
│  └────────────┘        │                                │
│                        ▼                                │
│                 Transform + Translate                   │
│                 (en/ro labels, filter subsets)          │
│                                                         │
│  • healthcheck: /health every 30s                      │
│  • resources: 0.125–1 CPU, 128M–1G RAM                 │
│  • Sentry error tracking + profiling                   │
└──────────────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable                        | Required | Default            | Description                                     |
| ------------------------------- | -------- | ------------------ | ----------------------------------------------- |
| `NODE_ENV`                      | Yes      | —                  | Environment mode (`development`, `staging`, `production`) |
| `ASTROLOGER_API_KEY`            | Yes      | —                  | RapidAPI key for Astrologer                     |
| `ASTROLOGER_API_URL`            | Yes      | —                  | Astrologer API base URL                         |
| `ASTROLOGER_API_HOST`           | Yes      | —                  | RapidAPI host header                            |
| `ASTROLOGY_API_SERVER_PORT`     | Yes      | —                  | This server's listen port (local process and inside the container) |
| `ASTROLOGY_API_SERVER_DC_PORT`  | Yes      | —                  | Public port mapped to the app port in Docker Compose |
| `ASTROLOGY_API_SERVER_DC_DNS`   | Yes      | —                  | Astrology service DNS/hostname in Docker Compose |
| `ASTROLOGY_API_SERVER_K8S_PORT` | Yes      | —                  | Public port mapped to the app port in Kubernetes |
| `ASTROLOGY_API_SERVER_K8S_DNS`  | Yes      | —                  | Astrology service DNS/hostname in Kubernetes |
| `BOOKING_API_SERVER_DC_PORT`    | Yes      | —                  | Booking service port in Docker Compose       |
| `BOOKING_API_SERVER_DC_DNS`     | Yes      | —                  | Booking service DNS/hostname in Docker Compose |
| `BOOKING_API_SERVER_K8S_PORT`   | Yes      | —                  | Booking service port in Kubernetes           |
| `BOOKING_API_SERVER_K8S_DNS`    | Yes      | —                  | Booking service DNS/hostname in Kubernetes   |
| `PAYMENT_API_SERVER_DC_PORT`    | Yes      | —                  | Payment service port in Docker Compose       |
| `PAYMENT_API_SERVER_DC_DNS`     | Yes      | —                  | Payment service DNS/hostname in Docker Compose |
| `PAYMENT_API_SERVER_K8S_PORT`   | Yes      | —                  | Payment service port in Kubernetes           |
| `PAYMENT_API_SERVER_K8S_DNS`    | Yes      | —                  | Payment service DNS/hostname in Kubernetes   |
| `FRONTEND_SERVER_DC_PORT`       | Yes      | —                  | Frontend port in Docker Compose               |
| `FRONTEND_SERVER_DC_DNS`        | Yes      | —                  | Frontend DNS/hostname in Docker Compose       |
| `FRONTEND_SERVER_K8S_PORT`      | Yes      | —                  | Frontend port in Kubernetes                   |
| `FRONTEND_SERVER_K8S_DNS`       | Yes      | —                  | Frontend DNS/hostname in Kubernetes           |
| `ASTROLOGY_API_SENTRY_DSN`      | Yes      | —                  | Sentry DSN for error tracking                   |
| `CORS_ORIGINS`                  | No       | _(dynamic defaults)_ | Comma-separated allowed origins; when omitted, defaults are built from the `*_SERVER_DC_PORT` / `*_SERVER_DC_DNS` and `*_SERVER_K8S_PORT` / `*_SERVER_K8S_DNS` variables above plus Cloudflare Pages domains |

---

## Deployment

### Docker Compose

```bash
# Build and start the service
docker compose up -d

# View logs
docker compose logs -f astrology-api

# Stop services
docker compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t astrolumina-api:latest .

# Run container
docker run -p <PORT>:<PORT> --env-file .env astrolumina-api:latest
```

### Render

```text
Build Command:  npm run render-build
Start Command:  npm start
Node Version:    22.x
```

The `render-build` script handles clean install (including devDependencies for TypeScript compilation) and builds the project. At runtime, `NODE_ENV=production` is used automatically by Render.

### Image Registry

Images are automatically built and pushed to GitHub Container Registry:

```
ghcr.io/astrolumina-by-carmen-ilie/astrolumina-astrologyapi:latest
ghcr.io/astrolumina-by-carmen-ilie/astrolumina-astrologyapi:v2.0.0
ghcr.io/astrolumina-by-carmen-ilie/astrolumina-astrologyapi:v2.0
ghcr.io/astrolumina-by-carmen-ilie/astrolumina-astrologyapi:v2
```

### CI/CD Pipeline

Triggered on **PR merge to `main`**:

1. **Auto-version** — Reads `VERSION.json` for major/minor, increments patch, creates and pushes a git tag
2. **Docker build** — Builds image from the new tag and pushes to GitHub Container Registry

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev
```

Server runs at `http://localhost:<PORT>` (configured via `ASTROLOGY_API_SERVER_PORT`)

### Production Build

```bash
# Compile TypeScript
npm run build

# Run compiled server
npm start
```

---

## Endpoints

All endpoints use `POST` with JSON body and accept a `:lang` parameter (`ro` or `en`).

### `GET /health`

Health check endpoint. Returns server status, uptime, memory usage, and Node.js version.

```bash
curl http://localhost:<PORT>/health
```

### `GET /metrics`

Prometheus exposition endpoint (plain text). Serves Node.js default metrics
plus `http_requests_total` and `http_request_duration_seconds`, all labeled
with `service`. Scraped in-cluster via the `ServiceMonitor`s in the
AstroLumina-Monitoring repo; not exposed through Traefik.

```bash
curl http://localhost:<PORT>/metrics
```

### `POST /api/v2/:lang/birth-data`

Returns the complete Astrologer response for a natal chart (data + SVG).

**Request body:**

| Field       | Type   | Range              | Required |
| ----------- | ------ | ------------------ | -------- |
| `longitude` | number | [-180, 180]        | Yes      |
| `latitude`  | number | [-90, 90]          | Yes      |
| `year`      | number | [1, 3000]          | Yes      |
| `month`     | number | [1, 12]            | Yes      |
| `day`       | number | [1, 31]            | Yes      |
| `hour`      | number | [0, 23]            | Yes      |
| `minute`    | number | [0, 59]            | Yes      |
| `city`      | string | —                  | Yes      |
| `nation`    | string | ISO 3166-1 alpha-2 | Yes      |
| `name`      | string | —                  | Yes      |

**Example:**

```bash
curl -sS -X POST "http://localhost:<PORT>/api/v2/ro/birth-data" \
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

Returns filtered astrological data with translated labels.

**Optional `:type` parameter:**

- _(none)_ — all active elements
- `natal` — natal subset (Sun, Moon, Mars, Venus, Mercury)
- `karmic` — karmic subset (outer planets, nodes, Lilith, houses, Chiron)

**Example (all elements):**

```bash
curl -sS -X POST "http://localhost:<PORT>/api/v2/en/astral-data" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

**Example (karmic, Romanian):**

```bash
curl -sS -X POST "http://localhost:<PORT>/api/v2/ro/astral-data/karmic" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

### `POST /api/v2/:lang/astral-chart`

Returns only the SVG chart data from the birth chart calculation.

### `POST /api/v2/:lang/lunar-data`

Returns lunar phase information with phase name, illumination, zodiac signs, and major phase translated to the specified language.

**Request body:**

| Field       | Type   | Range       | Required |
| ----------- | ------ | ----------- | -------- |
| `longitude` | number | [-180, 180] | Yes      |
| `latitude`  | number | [-90, 90]   | Yes      |
| `year`      | number | [1, 3000]   | Yes      |
| `month`     | number | [1, 12]     | Yes      |
| `day`       | number | [1, 31]     | Yes      |
| `hour`      | number | [0, 23]     | Yes      |
| `minute`    | number | [0, 59]     | Yes      |

**Example:**

```bash
curl -sS -X POST "http://localhost:<PORT>/api/v2/en/lunar-data" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30}'
```

### Error Responses

| Status Code | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `400`       | Invalid input (missing or out-of-range parameters, unsupported language) |
| `404`       | Route not found                                                          |
| `413`       | Request payload too large (>1MB)                                         |
| `429`       | Rate limit exceeded                                                      |
| `500`       | Internal server error (upstream API failure, unexpected errors)          |

In non-production modes (`development`, `staging`), error responses include the stack trace for debugging.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
