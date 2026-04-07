# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Browser (PWA)                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │  Svelte  │  │ Sightings│  │  Service Worker   │ │
│  │  Pages   │──│  Store   │  │  (Cache + Offline) │ │
│  └──────────┘  └────┬─────┘  └───────────────────┘ │
│                     │                               │
│              ┌──────┴──────┐                        │
│              │  IndexedDB  │                        │
│              │  (IDB)      │                        │
│              └─────────────┘                        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP (REST)
┌─────────────────────┴───────────────────────────────┐
│                  SvelteKit Server                    │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Auth    │  │ Sightings│  │   Session Mgmt   │  │
│  │  Routes  │  │  Routes  │  │   (httpOnly      │  │
│  │ /api/auth│  │/api/sight│  │    cookies)       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                     │                               │
│              ┌──────┴──────┐                        │
│              │  Drizzle    │                        │
│              │  ORM        │                        │
│              └──────┬──────┘                        │
└─────────────────────┬───────────────────────────────┘
                      │ SQL
               ┌──────┴──────┐
               │ PostgreSQL  │
               │  (Docker)   │
               └─────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | SvelteKit + Svelte 5 | SPA with SSR, runes reactivity |
| Styling | Scoped CSS + Tailwind | Component-scoped styles with utility classes |
| State | Custom store (writable) | Offline-first sightings store with sync |
| Offline | Service Worker + IndexedDB | Cache app shell, persist data locally |
| Backend | SvelteKit API routes | REST endpoints in the same project |
| ORM | Drizzle | Type-safe SQL queries |
| Database | PostgreSQL 16 | Relational data store |
| Auth | Session cookies (httpOnly) | Secure, server-validated sessions |
| Testing | Vitest + Playwright | Unit/integration + E2E |
| CI/CD | GitHub Actions | Automated test, typecheck, build, E2E |

## Key Architectural Decisions

### Offline-First PWA

The app is designed to work without a network connection:

1. **Service Worker** (`static/service-worker.js`) caches the app shell on install. Navigation requests use network-first (with cache fallback). Static assets use cache-first. API requests are network-only.

2. **IndexedDB** (`src/lib/services/idb.ts`) persists sightings locally. On every `init()`, the store loads from IDB first (instant UI), then syncs with the server in the background.

3. **Sightings Store** (`src/lib/stores/sightings.ts`) manages optimistic mutations:
   - **Add**: Creates a temp ID locally, attempts API call, replaces temp with server ID on success
   - **Update**: Applies changes locally, marks as PENDING, syncs to server
   - **Delete**: Removes from store/IDB immediately, queues a pending delete in localStorage for server sync
   - **Sync**: On reconnect (`online` event), syncs all pending operations then fetches latest server state

### Authentication

- Sessions are stored in PostgreSQL with a 30-day expiry
- The `auth_token` cookie is httpOnly, secure, sameSite=strict
- A SvelteKit hook (`hooks.server.ts`) validates the token on every request and populates `locals.user`
- The layout's `$effect` redirects unauthenticated users away from protected routes

### Data Flow

```
User Action → Store (optimistic update) → IDB (persist) → API (sync)
                                                            ↓
                                                     PostgreSQL
```

On failure, the store marks the sighting as `FAILED` but never rolls back. The user's data is always preserved locally.

## Directory Structure

```
src/
├── app.d.ts              # Global type declarations
├── app.html              # HTML shell
├── app.css               # Tailwind + base styles
├── lib/
│   ├── components/       # Reusable Svelte components
│   ├── db/               # Drizzle schema + client
│   ├── server/           # Server-only auth utilities
│   ├── services/         # API service layer + IDB wrapper
│   ├── stores/           # Svelte stores (sightings, auth)
│   └── utils/            # Shared utilities (validation, constants, etc.)
├── routes/
│   ├── api/              # REST API endpoints
│   │   ├── auth/         # signup, login, logout, me
│   │   └── sightings/    # CRUD + image endpoints
│   ├── dashboard/        # Main sightings list
│   ├── sighting/         # Create, detail, edit pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── logout/           # Logout confirmation
e2e/                      # Playwright E2E tests
static/
├── service-worker.js     # PWA service worker
├── manifest.json         # PWA manifest
docs/
├── adrs/                 # Architecture Decision Records
├── api.md                # API documentation
├── architecture.md       # This file
├── deployment.md         # Deployment instructions
└── getting-started.md    # Developer setup guide
```
