# Quickstart Guide: Animal Sightings PWA

**Target**: Developers implementing the Animal Sightings PWA feature.  
**Scope**: Setup, development environment, key patterns, and first feature implementation.

## Prerequisites

- Node.js 18+ (check: `node --version`)
- npm or pnpm
- PostgreSQL 13+ running locally or via Docker
- Git

---

## 1. Development Environment Setup

### 1.1 Clone & Install Dependencies

```bash
cd ~/projects/animal-identifier
npm install
```

### 1.2 Environment Configuration

Create `.env.local` in repository root:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/animal_sightings_dev

# Auth (session)
SESSION_SECRET=your-super-secret-key-min-32-chars-random

# Optional: Image storage path
IMAGE_STORAGE_PATH=./static/images/sightings
```

### 1.3 Initialize Database

```bash
# Run Drizzle migrations (create schema)
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

### 1.4 Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in browser.

---

## 2. Project Structure Deep Dive

```
src/
├── routes/
│   ├── +layout.svelte                 # Root layout (header, nav)
│   ├── +page.svelte                   # Home/login page
│   ├── auth/
│   │   ├── login/+page.svelte         # Login form
│   │   ├── signup/+page.svelte        # Signup form
│   │   └── logout/+server.ts          # Logout endpoint
│   ├── dashboard/
│   │   └── +page.svelte               # List of user's sightings
│   ├── sighting/
│   │   ├── +page.svelte               # Create new sighting form
│   │   ├── [id]/+page.svelte          # View sighting detail
│   │   ├── [id]/edit/+page.svelte     # Edit sighting
│   │   └── [id]/+server.ts            # Server actions (CRUD)
│   └── api/
│       ├── auth/+server.ts            # Auth endpoints
│       ├── sightings/+server.ts       # Sightings CRUD
│       └── sync/+server.ts            # Offline sync
├── lib/
│   ├── components/
│   │   ├── Header.svelte              # App header
│   │   ├── SightingCard.svelte        # Dashboard card component
│   │   ├── SightingForm.svelte        # Reusable form (create/edit)
│   │   └── SyncStatus.svelte          # Sync status indicator
│   ├── services/
│   │   ├── auth.ts                    # Auth business logic
│   │   ├── sightings.ts               # Sighting CRUD operations
│   │   ├── offline-sync.ts            # Offline queue & sync logic
│   │   └── image-handler.ts           # Image compression & handling
│   ├── db/
│   │   ├── schema.ts                  # Drizzle ORM table definitions
│   │   └── client.ts                  # DB connection pool
│   ├── stores/
│   │   ├── auth.ts                    # Svelte store (user state)
│   │   ├── sightings.ts               # Svelte store (sightings list)
│   │   └── sync.ts                    # Svelte store (sync status)
│   └── utils/
│       ├── gps.ts                     # Geolocation wrapper
│       ├── validation.ts              # Form validation rules
│       └── timestamps.ts              # Date/time utilities
├── service-worker.ts                  # PWA service worker
└── app.d.ts                           # Global type definitions
```

---

## 3. Key Patterns & Implementation Guide

### 3.1 Database Schema (Drizzle ORM)

**File**: `src/lib/db/schema.ts`

```typescript
import { pgTable, uuid, varchar, timestamp, text, real, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const sightings = pgTable('sightings', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  animal_name: varchar('animal_name', { length: 255 }).notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  has_image: boolean('has_image').default(false), // Boolean flag for dashboard queries
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  is_deleted: boolean('is_deleted').default(false),
});

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  sighting_id: uuid('sighting_id')
    .references(() => sightings.id)
    .notNull()
    .unique(), // UNIQUE enforces one-to-one relationship
  image_data: text('image_data').notNull(), // Base64 data URI
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
```

### 3.2 API Endpoint Pattern (SvelteKit Server Routes)

**File**: `src/routes/api/sightings/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/client';
import { sightings } from '$lib/db/schema';
import { validateSighting } from '$lib/utils/validation';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const userSightings = await db.query.sightings.findMany({
    where: (t) => eq(t.user_id, locals.user.id) && eq(t.is_deleted, false),
    orderBy: (t) => [desc(t.created_at)],
  });

  return json({ sightings: userSightings });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const data = await request.json();
  const validation = validateSighting(data);
  if (!validation.valid) throw error(400, validation.errors[0]);

  const [sighting] = await db
    .insert(sightings)
    .values({
      user_id: locals.user.id,
      animal_name: data.animal_name,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      has_image: false, // Set to true only if image is attached via POST /sightings/:id/image
    })
    .returning();

  return json(sighting, { status: 201 });
};
```

**Note**: Images are created/updated separately via `POST /sightings/:id/image`, not in the sighting endpoint.
```

### 3.3 Component Pattern (Svelte)

**File**: `src/lib/components/SightingForm.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocation } from '$lib/utils/gps';
  import { compressImage } from '$lib/services/image-handler';

  let animal_name = '';
  let location = '';
  let latitude: number | null = null;
  let longitude: number | null = null;
  let image_file: File | null = null;
  let sighting_id: string | null = null;
  let error: string | null = null;

  onMount(async () => {
    // Auto-capture GPS location
    try {
      const pos = await getLocation();
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch (e) {
      console.warn('GPS unavailable:', e);
    }
  });

  function handleImageSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) image_file = file;
  }

  async function handleSubmit() {
    // Validate required fields
    if (!animal_name) { error = 'Animal name required'; return; }
    if (!location) { error = 'Location description required'; return; }
    if (latitude === null || latitude === undefined) { error = 'Latitude required'; return; }
    if (longitude === null || longitude === undefined) { error = 'Longitude required'; return; }

    // Step 1: Create sighting (without image)
    const sightingResponse = await fetch('/api/sightings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animal_name,
        location,
        latitude,
        longitude,
      }),
    });

    if (!sightingResponse.ok) {
      alert('Failed to create sighting');
      return;
    }

    const sighting = await sightingResponse.json();
    sighting_id = sighting.id;

    // Step 2: Upload image if selected
    if (image_file) {
      const compressed = await compressImage(image_file);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUri = e.target?.result as string;
        await fetch(`/api/sightings/${sighting_id}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: imageDataUri }),
        });
      };
      reader.readAsDataURL(compressed);
    }

    alert('Sighting recorded!');
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={animal_name} placeholder="Animal name" required />
  <input bind:value={location} placeholder="Location" required />

  <input
    type="number"
    bind:value={latitude}
    placeholder="Latitude (required)"
    min="-90"
    max="90"
    required
  />

  <input
    type="number"
    bind:value={longitude}
    placeholder="Longitude (required)"
    min="-180"
    max="180"
    required
  />

  <input
    type="file"
    accept="image/*"
    on:change={handleImageSelect}
  />

  <button type="submit">Save Sighting</button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 600px;
  }
</style>
```

**Note**: Latitude and longitude are **always required** (either auto-captured via GPS or manually entered by user). Images are uploaded in a separate step after sighting creation via `/api/sightings/:id/image` endpoints. Error state shown above tracks validation failures.

### 3.4 Offline Sync Service

**File**: `src/lib/services/offline-sync.ts`

```typescript
import { db } from '$lib/db/client';

export async function queueOfflineOperation(
  id: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any
) {
  // Store in IndexedDB
  const dbRequest = indexedDB.open('animal-sightings', 1);
  dbRequest.onsuccess = () => {
    const db = dbRequest.result;
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').add({
      id,
      action,
      data,
      client_timestamp: new Date().toISOString(),
      synced: false,
    });
  };
}

export async function syncPendingOperations() {
  const dbRequest = indexedDB.open('animal-sightings', 1);
  dbRequest.onsuccess = () => {
    const db = dbRequest.result;
    const tx = db.transaction('sync_queue', 'readonly');
    const unsynced = tx.objectStore('sync_queue').getAll();

    unsynced.onsuccess = async () => {
      const queue = unsynced.result.filter((op) => !op.synced);
      if (queue.length === 0) return;

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_queue: queue }),
      });

      if (response.ok) {
        // Mark operations as synced
        const result = await response.json();
        // Update IndexedDB: remove synced operations
      }
    };
  };
}
```

### 3.5 Svelte Store (Reactive State)

**File**: `src/lib/stores/auth.ts`

```typescript
import { writable } from 'svelte/store';

export interface User {
  id: string;
  email: string;
}

function createAuthStore() {
  const { subscribe, set } = writable<User | null>(null);

  return {
    subscribe,
    login: async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      set(data.user);
    },
    logout: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      set(null);
    },
  };
}

export const auth = createAuthStore();
```

---

## 4. Development Workflow

### 4.1 Running Tests

```bash
# Unit tests
npm run test

# E2E tests (with Playwright)
npm run test:e2e

# Watch mode
npm run test:watch
```

### 4.2 Building for Production

```bash
npm run build
npm run preview  # Test production build locally
```

### 4.3 Debugging

**Browser DevTools**:
- Open browser dev console (F12)
- Check Application → Storage → IndexedDB for offline data
- Check Application → Service Workers for SW status

**Server Logs**:
- `npm run dev` logs requests/responses

---

## 5. Common Tasks

### Add a New API Endpoint

1. Create file `src/routes/api/[resource]/+server.ts`
2. Implement `GET`, `POST`, `PUT`, `DELETE` handlers as needed
3. Use `locals.user` for authentication (set in hooks)
4. Define types in `src/app.d.ts` (e.g., `declare namespace App { interface Locals { user: User } }`)

### Add a New Svelte Page

1. Create file `src/routes/[path]/+page.svelte`
2. Optional: Create `src/routes/[path]/+page.server.ts` for server-side logic
3. Use `<script>` tags for interactivity, Svelte directives for reactivity

### Add Image Support

1. Call `compressImage()` from `image-handler.ts`
2. Encode as Base64 data URL
3. Store in database or IndexedDB as string
4. Display with `<img src={image_data} />`

---

## 6. Testing Offline Functionality

### Simulate Offline Mode (Chrome DevTools)

1. Open DevTools → Network tab
2. Toggle offline mode from DevTools
3. App should:
   - Continue reading cached data
   - Queue new sightings in IndexedDB
   - Show "Offline" status indicator

### Test Service Worker

1. DevTools → Application → Service Workers
2. Verify SW is registered and active
3. Check cached assets under Cache Storage

### Test Sync

1. Go offline, create/edit sightings
2. Go online → sync should trigger automatically
3. Check `/api/sync` response in Network tab

---

## 7. Performance & Accessibility Checklist

- [ ] Run Lighthouse (DevTools → Lighthouse)
  - Performance >90
  - Accessibility >90
  - PWA checks passing
- [ ] Test with keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test images load quickly (Network > Slow 4G)
- [ ] Test on mobile (DevTools → Device modes)

---

## 8. Deployment (Coming Later)

Once feature is ready:
- Push feature branch to GitHub
- Open PR with description
- Run CI/CD checks (tests, Lighthouse)
- Merge to main → deploy

---

## Resources

- **SvelteKit Docs**: https://kit.svelte.dev/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **Workbox**: https://developers.google.com/web/tools/workbox
- **PWA**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

---

**Next Steps**:
1. Run `npm install` and `.env` setup
2. Run `npm run db:migrate` to initialize DB
3. Run `npm run dev` and navigate to http://localhost:5173
4. Start with User Story 1 (authentication) → build login/signup pages
5. Follow spec.md for acceptance criteria
