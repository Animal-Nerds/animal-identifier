<div align="center">

# Animal Identifier

### Track wildlife sightings anywhere — even without internet.

A full-stack Progressive Web App for logging animal sightings with GPS coordinates, photos, and offline support. Built with SvelteKit, PostgreSQL, and a custom sync engine.

[![CI](https://github.com/Animal-Nerds/animal-identifier/actions/workflows/ci.yml/badge.svg)](https://github.com/Animal-Nerds/animal-identifier/actions/workflows/ci.yml)

</div>

---

## Features

- **Offline-First** — Create, edit, and delete sightings without internet. Changes sync automatically when you reconnect.
- **Installable PWA** — Install on any device (phone, tablet, desktop) from the browser. Works like a native app.
- **GPS Location** — Capture exact coordinates with one tap using your device's GPS.
- **Photo Compression** — Snap a photo and it's automatically compressed to under 500KB before upload.
- **Real-Time Sync** — See sync status for every sighting (Synced, Pending, Failed). Never lose data.
- **Secure Auth** — httpOnly cookie sessions with bcrypt password hashing. No tokens in JavaScript.
- **Responsive Design** — Optimized for mobile field use with a desktop-friendly dashboard.
- **Soft Deletes** — Deleted sightings are preserved in the database for data integrity during offline sync.

<!--
## Screenshots

| Dashboard | Create Sighting | Detail View |
|:---------:|:---------------:|:-----------:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Create](docs/screenshots/create.png) | ![Detail](docs/screenshots/detail.png) |

| Mobile View | Offline Mode | Edit Sighting |
|:-----------:|:------------:|:-------------:|
| ![Mobile](docs/screenshots/mobile.png) | ![Offline](docs/screenshots/offline.png) | ![Edit](docs/screenshots/edit.png) |

To add screenshots: save them to docs/screenshots/ and uncomment this section.
-->

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit 2 + Svelte 5 (runes) |
| Backend | SvelteKit API routes (REST) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | httpOnly cookies + bcrypt |
| Offline | IndexedDB + Service Worker |
| Testing | Vitest (unit) + Playwright (E2E) |
| CI/CD | GitHub Actions |
| Deployment | Render (cloud) + Docker/Proxmox (self-hosted) |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://docs.docker.com/get-docker/)

### 1. Clone and install

```bash
git clone https://github.com/Animal-Nerds/animal-identifier.git
cd animal-identifier
npm install
```

### 2. Set up the database

**Mac / Linux:**
```bash
./scripts/setup/setup.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\setup\setup.ps1
```

This creates a `.env` file and starts a PostgreSQL container in Docker.

### 3. Push the database schema

```bash
npx drizzle-kit push --config ./drizzle.config.ts --force
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and create an account to get started.

---

## How It Works

### Offline Sync Engine

The app uses a custom sync engine that ensures your data is never lost:

```
User Action → Local Store (instant UI update) → IndexedDB (persist) → API (sync when online)
```

1. **Create offline** — sighting gets a temporary ID and saves to IndexedDB
2. **Come back online** — the sync engine pushes pending creates/updates/deletes to the server
3. **Server responds** — temporary IDs are replaced with real UUIDs, status changes to "Synced"
4. **Conflict resolution** — local changes always win for unsynced sightings; server data wins for synced ones

### Service Worker

Pre-caches all build assets using SvelteKit's `$service-worker` module. The app shell loads instantly on repeat visits, even offline.

### Image Pipeline

Photos are compressed client-side before storage:

```
Camera/File → Canvas resize (max 800px) → JPEG compress (quality 0.8→0.3) → Base64 data URL (max 500KB)
```

---

## Project Structure

```
src/
├── routes/                    # Pages & API endpoints
│   ├── api/auth/              # Login, signup, logout, session
│   ├── api/sightings/         # CRUD + image endpoints
│   ├── dashboard/             # Sightings list
│   ├── sighting/              # Create, detail, edit pages
│   └── +layout.ts             # Universal load (offline-safe)
├── lib/
│   ├── components/            # Header, SightingCard, SightingForm, SyncStatus
│   ├── stores/                # Auth store + Sightings sync engine
│   ├── services/              # API client + IndexedDB wrapper
│   ├── db/                    # Drizzle schema + PostgreSQL client
│   └── utils/                 # Validation, constants, GPS, image compression
├── service-worker.ts          # PWA service worker (build-aware caching)
└── hooks.server.ts            # Auth middleware
```

> See [docs/architecture.md](docs/architecture.md) for a full technical walkthrough.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Authenticate |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/sightings` | List sightings (paginated) |
| POST | `/api/sightings` | Create sighting |
| GET | `/api/sightings/:id` | Get sighting detail |
| PUT | `/api/sightings/:id` | Update sighting |
| DELETE | `/api/sightings/:id` | Delete sighting |
| GET | `/api/sightings/:id/image` | Get sighting image |
| POST | `/api/sightings/:id/image` | Upload image |
| DELETE | `/api/sightings/:id/image` | Remove image |

> See [docs/api.md](docs/api.md) for full request/response schemas.

---

## Testing

```bash
# Unit tests (119 tests across 9 files)
npm test

# Unit tests in watch mode
npx vitest

# E2E tests (requires running app + database)
npx playwright test

# Type checking
npm run check
```

### Test Coverage

| Area | Tests | What's covered |
|------|-------|----------------|
| Validation | 34 | Email, password, coordinates, schema validation |
| API endpoints | 33 | Auth, CRUD, images, error handling, ownership |
| Sightings store | 11 | Offline add/update/delete, sync, IDB persistence |
| Utilities | 10+ | Timestamps, IDB operations, service worker |
| E2E | 8 | Full signup → create → edit → delete flow, offline sync |

---

## Deployment

### Cloud (Render)

The app auto-deploys from `main` via Render. No configuration needed beyond setting `DATABASE_URL` in Render's environment variables.

### Self-Hosted (Docker + Proxmox)

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Stop
docker compose -f docker-compose.prod.yml down
```

Expose via [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) pointing to `localhost:3000`.

> See [docs/deployment.md](docs/deployment.md) for full deployment instructions.

---

## Database Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start the database |
| `docker compose down` | Stop the database (keeps data) |
| `docker compose down -v` | Stop and delete all data |
| `npx drizzle-kit push --force` | Push schema changes |
| `npx drizzle-kit studio` | Open Drizzle Studio (DB browser) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Guide](docs/architecture.md) | Full technical walkthrough with diagrams |
| [API Reference](docs/api.md) | Endpoint schemas and examples |
| [Deployment Guide](docs/deployment.md) | Production deployment instructions |
| [Getting Started](docs/getting-started.md) | Developer setup walkthrough |
| [ADRs](docs/adrs/) | Architecture Decision Records |

---

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [Framework](docs/adrs/framework.md) | SvelteKit 2 + Svelte 5 for full-stack development |
| [Database](docs/adrs/database.md) | PostgreSQL 16 + Drizzle ORM |
| [Authentication](docs/adrs/authentication.md) | httpOnly cookie sessions with bcrypt |
| [Offline-First](docs/adrs/offline-first.md) | IndexedDB + optimistic sync engine |
| [Service Worker](docs/adrs/service-worker.md) | SvelteKit-integrated build-aware caching |
| [Deployment](docs/adrs/deployment.md) | Dual deploy — Render + Docker/Proxmox |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run tests (`npm test && npm run check`)
4. Push and open a pull request

---

<div align="center">

Built by [Animal Nerds](https://github.com/Animal-Nerds)

</div>
