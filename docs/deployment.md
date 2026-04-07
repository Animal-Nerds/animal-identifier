# Deployment

How to deploy Animal Identifier to a production environment.

## Prerequisites

- Node.js 22+
- A PostgreSQL 16 database (managed service recommended: Neon, Supabase, Railway, etc.)
- A hosting platform that supports Node.js (Vercel, Railway, Fly.io, etc.)

## Environment Variables

Set these in your hosting platform's dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/animal_identifier` |
| `NODE_ENV` | Environment mode | `production` |

## Build

```sh
npm ci
npm run build
```

This outputs a production build to the `build/` directory.

## Database Setup

Push the Drizzle schema to your production database:

```sh
npm run db:production:push-schema
```

This uses `production.drizzle.config.ts`, which reads `DATABASE_URL` from the environment.

## Run

After building, start the server:

```sh
node build
```

The server listens on port 3000 by default. Set the `PORT` environment variable to change it.

## Platform-Specific Guides

### Vercel

1. Connect your GitHub repository in the Vercel dashboard
2. Set `DATABASE_URL` in project settings → Environment Variables
3. Vercel auto-detects SvelteKit and uses `@sveltejs/adapter-auto`
4. Push to `main` to trigger a deploy

### Railway

1. Create a new project and connect your GitHub repository
2. Add a PostgreSQL plugin (or use an external database)
3. Set `DATABASE_URL` in the service variables
4. Railway auto-detects the build command (`npm run build`) and start command (`node build`)

### Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` from the project root
3. Set secrets:
   ```sh
   fly secrets set DATABASE_URL="postgresql://..."
   ```
4. Deploy: `fly deploy`

## CI/CD

GitHub Actions runs on every push to `main` and on pull requests. The pipeline:

1. Installs dependencies (`npm ci`)
2. Runs unit tests (`npm test -- --run`)
3. Type-checks (`npm run check`)
4. Builds (`npm run build`)
5. Pushes DB schema to CI Postgres
6. Runs E2E tests (`npx playwright test`)

See `.github/workflows/ci.yml` for the full configuration.

## PWA / Service Worker

The production build includes a service worker (`static/service-worker.js`) that:

- Pre-caches the app shell on install
- Serves static assets cache-first
- Uses network-first for navigation (falls back to cache offline)
- Keeps API requests network-only

The service worker activates automatically when users visit the deployed app. No extra configuration is needed.

## Monitoring

After deploying, verify:

1. The app loads at your domain
2. Sign up / login works (session cookies are set correctly)
3. Creating, editing, and deleting sightings works
4. The PWA installs on mobile (check the manifest at `/manifest.json`)
5. Run a Lighthouse audit in Chrome DevTools — aim for scores above 90
