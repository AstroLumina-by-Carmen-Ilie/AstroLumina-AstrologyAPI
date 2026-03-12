# AstroLumina Astrology API

API Node.js (Express) pentru AstroLumina: un wrapper peste API-ul **Astrologer** (RapidAPI) care generează date astrologice pe baza informațiilor de naștere (data/ora/loc).

## Ce face

- **Calculează automat timezone-ul** din lat/long (folosind `geo-tz`)
- **Apelează Astrologer** pentru harta natală (`birth-chart`)
- **Normalizează / filtrează răspunsurile** pentru consum ușor în frontend
- **Localizare**: `ro` / `en` (planete, zodii, case, elemente, faze lunare)
- **Protecție basic**: rate-limit global (20 req/min/IP) + CORS whitelist

## Cerințe

- **Node.js**: recomandat LTS (18+ / 20+)
- **Chei RapidAPI** pentru Astrologer (vezi secțiunea “Configurare”)

## Instalare

```bash
npm install
```

## Configurare (.env)

Creează un fișier `.env` în rădăcina proiectului:

```bash
ASTROLOGER_API_KEY="..."
ASTROLOGER_API_URL="https://astrologer.p.rapidapi.com"
ASTROLOGER_API_HOST="astrologer.p.rapidapi.com"
```

Note:
- `ASTROLOGER_API_URL` este baza (fără trailing slash). Serverul apelează `.../api/v5/chart/birth-chart`.
- Portul serverului este **hardcodat** la `3031` în `server.js`.

## Rulare locală (dev)

Proiectul pornește cu `nodemon`:

```bash
npm run start
```

Serverul va fi disponibil la `http://localhost:3031`.

## Endpoint-uri

Toate endpoint-urile acceptă `:lang` ∈ `{ro,en}`.

### `POST /api/v2/:lang/birth-data`

Returnează răspunsul complet de la Astrologer pentru harta natală (plus chart).

**Body (JSON):**

- **longitude**: number \([-180, 180]\)
- **latitude**: number \([-90, 90]\)
- **year**: number \([1900, 2300]\)
- **month**: number \([1, 12]\)
- **day**: number \([1, 31]\)
- **hour**: number \([0, 23]\)
- **minute**: number \([0, 59]\)
- **city**: string
- **nation**: string
- **name**: string

Exemplu:

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

### `POST /api/v2/:lang/astral-data`

Returnează o listă filtrată cu punctele/planetele “active” (din `constants.js`), **traduse** pentru `name`, `house`, `sign`, `element`.

Exemplu:

```bash
curl -sS -X POST "http://localhost:3031/api/v2/en/astral-data" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

### `POST /api/v2/:lang/astral-chart`

Returnează partea de `chart` (utilă pentru redare/diagramă). Intern, endpoint-ul reapelază `birth-data`.

### `POST /api/v2/:lang/lunar-data`

Returnează datele de fază lunară (cu `moon_phase_name` tradus).

### `POST /api/v1/:lang/astral-interpretations/:type?`

Returnează date astrale filtrate pe tip:

- **(fără type)**: returnează toate elementele
- **type = `natal`**: returnează subsetul “natal” (ex. Soare/Lună etc.)
- **type = `karmic`**: returnează subsetul “karmic” (noduri lunare, Lilith etc.)

Notă: în codul curent, acest endpoint face un apel intern către `http://localhost:3031/api/v1/:lang/astral-data`, însă în repo nu există un endpoint definit la acel path (există `/api/v2/:lang/astral-data`). Dacă primești `404`, acesta e motivul.

Exemplu:

```bash
curl -sS -X POST "http://localhost:3031/api/v1/ro/astral-interpretations/natal" \
  -H "Content-Type: application/json" \
  -d '{"longitude":26.1025,"latitude":44.4268,"year":1994,"month":7,"day":16,"hour":10,"minute":30,"city":"Bucharest","nation":"RO","name":"Demo"}'
```

## Rate limiting

- **Limită**: 20 request-uri / minut / IP (global, pe toate rutele)
- La depășire: răspuns `429` cu mesaj “Too many requests...”

## CORS

Serverul permite explicit o listă de origini (local + domenii AstroLumina). Dacă rulezi frontend-ul de pe alt domeniu/port, va trebui ajustată lista din `server.js`.

## Observații DevOps / deployment

- **Prod**: pentru un process manager, recomand `pm2` sau `systemd` și rulare cu `node server.js` (în loc de `nodemon`).
- **Reverse proxy**: tipic Nginx/Caddy în față (TLS, compresie, logs).
- **Env vars**: injectează `ASTROLOGER_API_*` în runtime (secrete), nu în repo.
- **Port**: momentan este fix `3031`; pentru hosting pe PaaS unde portul vine din env, va fi nevoie de o mică ajustare în cod.

## Troubleshooting

- **401/403 de la RapidAPI**: verifică `ASTROLOGER_API_KEY` și `ASTROLOGER_API_HOST`.
- **500 “Error getting data”**: serverul nu poate apela Astrologer (chei greșite, URL greșit, rate limit RapidAPI, sau rețea).
- **Timezone greșit**: verifică `latitude/longitude` (în grade zecimale, semn corect).