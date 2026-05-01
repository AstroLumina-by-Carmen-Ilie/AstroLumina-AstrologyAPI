# AstroLumina Astrology API

> Production-grade Node.js/TypeScript API server wrapping the Astrologer API (RapidAPI) for natal chart calculations, astrological data filtering, and lunar phase information.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express)](https://expressjs.com/)
[![Sentry](https://img.shields.io/badge/Sentry-10.x-362d59?style=flat&logo=sentry)
![Docker](https://img.shields.io/badge/Docker-25.0-2496ed?style=flat&logo=docker)
![CI/CD](https://img.shields.io/badge/GitHub_Actions-2088ff?style=flat&logo=githubactions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🌐 **Automatic timezone detection** — derives timezone from latitude/longitude via `geo-tz`
- 🪐 **Astrologer API v5** — natal charts, aspects, planetary positions, SVG chart rendering
- 🎯 **Filtered endpoints** — full, natal (`Sun, Moon, Mars, Venus, Mercury`), or karmic (`outer planets, nodes, Lilith, Chiron, houses`) data subsets
- 🌍 **Localization** — Romanian (`ro`) and English (`en`) with translated labels
- 🌙 **Lunar data** — phase name, illumination, zodiac signs, major phases
- 🔒 **Security** — Helmet headers, CORS whitelist, rate limiting (20 req/min/IP), request size limit (1MB)
- 📊 **Observability** — Sentry error tracking + profiling, health endpoint with uptime metrics

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 22.x (LTS) |
| **Language** | TypeScript (ESM, strict mode) |
| **Framework** | Express 5.x |
| **Validation** | Zod |
| **HTTP Client** | Axios |
| **Middleware** | Helmet, Compression, Morgan, CORS, express-rate-limit |
| **Monitoring** | Sentry 10.x (with profiling) |
| **Timezone** | geo-tz |
| **Container** | Docker, Docker Compose, Traefik |
| **CI/CD** | GitHub Actions |

---

## 📁 Project Structure

```text
.
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── docker.yml        # Docker image build & push
│       └── auto-version.yml  # Auto-versioning on PR merge
├── src/
│   ├── server.ts            # Express entry point
│   ├── instrument.ts        # Sentry initialization (imported first)
│   ├── constants.ts         # Astrological constants
│   ├── config/
│   │   └── env.ts           # Zod-based environment validation
│   ├── middleware/
│   │   ├── security.ts     # Helmet, CORS, rate limiter
│   │   └── error-handler.ts # Centralized error handling
│   ├── routes/
│   │   ├── health.ts       # GET /health
│   │   └── astrology.ts    # Astrology API routes
│   ├── translations/
│   │   ├── index.ts        # Translation loader + types
│   │   ├── en.ts           # English translations
│   │   └── ro.ts           # Romanian translations
│   └── types/
│       └── astrology.ts     # TypeScript interfaces
├── dist/                    # Compiled output (gitignored)
├── docker-compose.yml      # Blue/Green deployment with Traefik
├── Dockerfile              # Multi-stage build
├── traefik.yml             # Traefik configuration
├── VERSION.json            # Version config for auto-bumping
├── .dockerignore
├── .env                    # Environment variables (not committed)
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.x (LTS)
- **Docker** & **Docker Compose** (optional, for containerized deployment)
- **RapidAPI** subscription for [Astrologer API](https://rapidapi.com/astrology-api)

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev
```

Server runs at `http://localhost:3031`

### Production Build

```bash
# Compile TypeScript
npm run build

# Run compiled server
npm start
```

---

## ⚙️ Configuration

Create a `.env` file in the project root:

```bash
# =============================================================================
# Required — Astrologer API (RapidAPI)
# =============================================================================
ASTROLOGER_API_KEY="your-rapidapi-key"
ASTROLOGER_API_URL="https://astrologer.p.rapidapi.com"
ASTROLOGER_API_HOST="astrologer.p.rapidapi.com"

# =============================================================================
# Optional — Server
# =============================================================================
PORT=3031                          # Default: 3031
NODE_ENV=development               # development | production

# =============================================================================
# Optional — CORS (comma-separated origins)
# =============================================================================
CORS_ORIGINS="https://example.com,https://app.example.com"

# =============================================================================
# Optional — Sentry (error tracking & profiling)
# =============================================================================
SENTRY_DSN="your-sentry-dsn"
SENTRY_RELEASE="v1.0.0"
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASTROLOGER_API_KEY` | ✅ | — | RapidAPI key for Astrologer |
| `ASTROLOGER_API_URL` | ✅ | — | Astrologer API base URL |
| `ASTROLOGER_API_HOST` | ✅ | — | RapidAPI host header |
| `PORT` | ❌ | `3031` | Server listen port |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `CORS_ORIGINS` | ❌ | *(hardcoded list)* | Allowed origins |
| `SENTRY_DSN` | ❌ | — | Sentry DSN for error tracking |
| `SENTRY_RELEASE` | ❌ | — | Sentry release identifier |

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f astrology-api-blue

# Stop services
docker compose down
```

### Architecture

The `docker-compose.yml` sets up a **blue-green deployment** pattern with Traefik reverse proxy:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Traefik (v3.1)                         │
│                     (ports: 80, 443, 8080)                     │
└─────────────┬───────────────────────┬─────────────────────────┘
              │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │   Blue Cluster    │   │  Green Cluster    │
    │  (3 replicas)     │   │  (3 replicas)      │
    │  • astrology-api- │   │  • astrology-api-  │
    │    blue (x3)      │   │    green (x3)      │
    └───────────────────┘   └───────────────────┘
```

- **Blue/Green** — Two identical production stacks for zero-downtime deployments
- **Health checks** — Each container exposes `/health` for orchestration
- **Resource limits** — 1 CPU / 1GB RAM max per container, 0.125 CPU / 128MB reserved

### Manual Docker Build

```bash
# Build image
docker build -t astrolumina-api:latest .

# Run container
docker run -p 3031:3031 --env-file .env astrolumina-api:latest
```

### Image Registry

Images are automatically built and pushed to GitHub Container Registry:

```
ghcr.io/astrolumina/astrolumina-astrology-api:latest
ghcr.io/astrolumina/astrolumina-astrology-api:v2.0.0
ghcr.io/astrolumina/astrolumina-astrology-api:v2.0
ghcr.io/astrolumina/astrolumina-astrology-api:v2
ghcr.io/astrolumina/astrolumina-astrology-api:v2.0
```

---

## 🌐 Deployment (Render)

```text
Build Command:  npm run render-build
Start Command:  npm start
Node Version:    22.x
```

The `render-build` script handles clean install (including devDependencies for TypeScript compilation) and builds the project. At runtime, `NODE_ENV=production` is used automatically by Render.

---

## 🔌 API Endpoints

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
| `longitude` | number | [-180, 180] | ✅ |
| `latitude` | number | [-90, 90] | ✅ |
| `year` | number | [1, 3000] | ✅ |
| `month` | number | [1, 12] | ✅ |
| `day` | number | [1, 31] | ✅ |
| `hour` | number | [0, 23] | ✅ |
| `minute` | number | [0, 59] | ✅ |
| `city` | string | — | ✅ |
| `nation` | string | ISO 3166-1 alpha-2 | ✅ |
| `name` | string | — | ✅ |

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

Returns filtered astrological data with translated labels.

**Optional `:type` parameter:**
- *(none)* — all active elements
- `natal` — natal subset (Sun, Moon, Mars, Venus, Mercury)
- `karmic` — karmic subset (outer planets, nodes, Lilith, houses, Chiron)

**Example (all elements):**

```bash
curl -sS -X POST "http://localhost:3031/api/v2/en/astral-data" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

**Example (karmic, Romanian):**

```bash
curl -sS -X POST "http://localhost:3031/api/v2/ro/astral-data/karmic" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

### `POST /api/v2/:lang/astral-chart`

Returns only the SVG chart data from the birth chart calculation.

### `POST /api/v2/:lang/lunar-data`

Returns lunar phase information with phase name, illumination, zodiac signs, and major phase translated to the specified language.

**Request body:**

| Field | Type | Range | Required |
|-------|------|-------|----------|
| `longitude` | number | [-180, 180] | ✅ |
| `latitude` | number | [-90, 90] | ✅ |
| `year` | number | [1, 3000] | ✅ |
| `month` | number | [1, 12] | ✅ |
| `day` | number | [1, 31] | ✅ |
| `hour` | number | [0, 23] | ✅ |
| `minute` | number | [0, 59] | ✅ |

**Example:**

```bash
curl -sS -X POST "http://localhost:3031/api/v2/en/lunar-data" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30}'
```

---

## 🔐 Security

| Feature | Implementation |
|---------|----------------|
| **HTTP Headers** | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| **Rate Limiting** | 20 requests/minute per IP |
| **CORS** | Explicit origin whitelist (configurable via `CORS_ORIGINS`) |
| **Request Size** | Max 1MB body (returns `413` if exceeded) |
| **PII Scrubbing** | Sentry automatically redacts API keys from error reports |

---

## ⚠️ Error Handling

| Status Code | Meaning |
|-------------|---------|
| `400` | Invalid input (missing or out-of-range parameters, unsupported language) |
| `404` | Route not found |
| `413` | Request payload too large (>1MB) |
| `429` | Rate limit exceeded |
| `500` | Internal server error (upstream API failure, unexpected errors) |

In development mode, error responses include the stack trace for debugging.

---

## 🔧 Troubleshooting

| Symptom | Solution |
|---------|----------|
| `401/403` from RapidAPI | Verify `ASTROLOGER_API_KEY` and `ASTROLOGER_API_HOST` are correct |
| `500` "Error getting data" | Check API keys, URL, RapidAPI rate limits, or network connectivity |
| Wrong timezone | Ensure `latitude`/`longitude` are decimal degrees with correct signs |
| `413` payload error | Request body exceeds 1MB limit — reduce payload size |
| `429` too many requests | Client exceeded 20 req/min rate limit — implement retry with backoff |

---

## 📈 CI/CD Pipeline

### Docker Build (on push to `main` or tag `v*.*.*`)

```yaml
# Triggers: push to main, version tags
# Outputs: ghcr.io/astrolumina/astrolumina-astrology-api:latest + versioned tags
```

### Auto-Version (on PR merge to `main`)

When a PR is merged to `main`, the pipeline automatically:
1. Reads `VERSION.json` for major/minor version
2. Increments the patch version
3. Creates and pushes a new git tag

```json
// VERSION.json
{
  "major": 2,
  "minor": 0
}
```

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**AstroLumina** — [GitHub](https://github.com/AstroLumina/AstroLumina-AstrologyAPI)