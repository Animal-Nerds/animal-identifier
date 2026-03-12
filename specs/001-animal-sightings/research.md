# Phase 0: Research Findings

**Scope**: Resolve technical unknowns for Animal Sightings PWA implementation with SvelteKit, PostgreSQL/Drizzle, and offline capability.

## Research Topics & Decisions

### 1. Image Storage Strategy for PWA

**Question**: How to store and sync images in an offline-first PWA? What's the simplest approach?

**Decision**: Two-tier image storage pattern:
- **Client**: Compress image on upload, store Base64 or Blob in IndexedDB during offline mode
- **Server**: Accept image data in API payload (multipart form-data or Base64) and store as file

**Rationale**: Keeping images small in IndexedDB avoids storage bloat. Base64-encoded images embedded in Drizzle sync payload or separate multipart upload keeps implementation simple without external services (no S3, Cloudinary, etc.). For production, can add file storage layer later.

**Alternatives considered**:
- AWS S3/Cloudinary: More infrastructure, not needed for MVP
- Service worker cache: Possible but doesn't handle offline *creation*, requires post-sync cleanup
- Local filesystem API: Not reliably available, limited by browser sandbox

**Implementation approach**:
1. Client: User picks image → compress with browser (canvas/ImageMagick.wasm) → store Base64 in IndexedDB with sighting
2. Server: Accept `image_data` (Base64) in sighting POST/PUT → decode Base64 → save to `static/sightings/` or disk
3. Sync: During offline-to-online transition, send image as Base64 in request body or separate part

---

### 2. Offline-First Data Sync with Drizzle ORM

**Question**: How to implement conflict-free sync with Drizzle ORM and PostgreSQL?

**Decision**: Event queue + last-write-wins (LWW) conflict resolution:

**Architecture**:
```
Client IndexedDB:
├── sightings (local copy)
├── sync_queue (CREATE, UPDATE, DELETE operations with timestamps)
└── metadata (last_synced_at, server_version)

Server PostgreSQL (Drizzle):
├── sightings (canonical data)
└── sync_log (optional: audit trail for conflicts)
```

**Rationale**: Simple, deterministic conflict resolution. Server timestamp is authoritative. If device A deletes sighting while device B edits it offline, the latest timestamp wins. Users can be warned of conflicts.

**Implementation process**:
1. All mutations (create/update/delete) write to `sync_queue` with `{id, action, data, client_timestamp}`
2. Service worker detects connectivity change → batches queue items → POST to `/api/sync`
3. Server applies changes in order, returns `{success: true, updated_at, conflicts: [...]}` 
4. Client clears synced items, updates `last_synced_at`, re-fetches dashboard if conflicts occurred

**Alternatives considered**:
- CRDT (Conflict-free Replicated Data Types): Overkill for single-user use case, adds complexity
- Client-server consensus commit: Too chatty for mobile networks
- Always server-wins: Poor UX, loses user data

---

### 3. Service Worker & PWA Architecture in SvelteKit

**Question**: How to wire up service worker for offline capability in SvelteKit?

**Decision**: SvelteKit-native `sw.ts` with Workbox for caching:

**Setup**:
```typescript
// src/service-worker.ts
import { build, files, version } from '$service-worker';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache: static assets, routes
precacheAndRoute(build.concat(files).map(f => ({ url: f, revision: version })));

// Network-first for API routes (fetch from server, fallback to cache)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api-cache' })
);

// Cache-first for images
registerRoute(
  ({ url }) => url.pathname.match(/\.(png|jpg|jpeg)$/),
  new CacheFirst({ cacheName: 'images' })
);
```

**Rationale**: Workbox handles cache invalidation and preload. SvelteKit's `$service-worker` module provides file list at build time. Keeps SW logic minimal.

---

### 4. Authentication Pattern in SvelteKit

**Question**: Session-based or token-based auth? How to integrate with PostgreSQL/Drizzle?

**Decision**: Session-based (cookies) for simplicity:

**Why**: 
- SvelteKit has built-in session store (`$app/stores`)
- Cookies are HTTP-only (CSRF protection)
- Simpler than JWT refresh token dance
- Single-user PWA doesn't need distributed auth

**Schema** (Drizzle):
```typescript
// User table
users: {
  id: string (UUID),
  email: string (unique),
  password_hash: string,
  created_at: timestamp
}

// Session table
sessions: {
  id: string,
  user_id: string (FK),
  token: string,
  expires_at: timestamp
}
```

**Flow**:
1. POST `/api/auth/signup` → hash password, create user, set session cookie
2. POST `/api/auth/login` → verify password, create session, set cookie
3. GET `/api/auth/me` → validate session, return user (for client hydration)
4. POST `/api/auth/logout` → clear session

---

### 5. Offline Storage: IndexedDB vs LocalStorage

**Question**: Which API to use for offline sighting + sync queue data?

**Decision**: IndexedDB for main data, localStorage for metadata:

**IndexedDB**:
- Sightings (full object with image Base64 if offline)
- sync_queue (operation log with timestamps)
- Better performance for querying/indexing by ID

**localStorage**:
- `last_synced_at` timestamp
- `user_id` (read on startup)
- Sync status flag

**Rationale**: IndexedDB supports indices and transactions. localStorage is simple for small metadata. Browser quota is ~50MB, sufficient for ~100 sightings + queued ops.

---

### 6. Image Optimization (Mobile Networks)

**Question**: How to prevent massive images blocking sync?

**Decision**: Client-side compression before upload:

**Implementation**:
```typescript
// lib/services/image-handler.ts
export async function compressImage(file: File, maxWidth = 800, maxHeight = 800): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const img = new Image();
  const url = URL.createObjectURL(file);
  
  await new Promise(resolve => { img.onload = resolve; img.src = url; });
  
  const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
}
```

**Targets**: ≤500KB per image (typical phone photo), <10s upload on 4G.

---

### 7. Conflict Resolution Strategy

**Question**: How to handle simultaneous edits on different devices?

**Decision**: Last-write-wins with user notification:

**Scenario**: Device A edits sighting offline, Device B deletes it. A syncs before B.
- Server accepts A's edit (creates new version)
- B's delete syncs next → succeeds (removes the newer version)
- User warned: "Sighting was deleted by another device"

**Implementation**:
- Each sighting has `updated_at` timestamp (client-side)
- Sync compares local `updated_at` vs server `updated_at`
- If server is newer → fetch from server, prompt user to re-edit
- If local is same or newer → apply change

---

### 8. Drizzle ORM Schema Design

**Question**: How to structure Drizzle schema for sightings with images and timestamps?

**Decision**: Normalized schema with user-sighting-image relationships:

```typescript
// lib/db/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const sightings = pgTable('sightings', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  animal_name: varchar('animal_name', { length: 255 }).notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  has_image: boolean('has_image').default(false), // Boolean flag for dashboard queries
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  is_deleted: boolean('is_deleted').default(false), // Soft delete for sync
});

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  sighting_id: uuid('sighting_id').references(() => sightings.id).notNull().unique(), // UNIQUE enforces 1:1
  image_data: text('image_data').notNull(), // Base64 data URI
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
```

**Rationale**: 
- Images in separate table → cleaner queries (can fetch sightings without image data)
- `has_image` boolean on sighting → fast dashboard list filtering without joins
- `UNIQUE sighting_id` in images → enforces one-to-one relationship
- `is_deleted` flag instead of hard delete → easier to sync deletions
- `updated_at` for conflict detection
- Foreign keys ensure data integrity

---

## Summary

All critical unknowns resolved:
- ✅ Image storage: Separate images table with Base64 data URI, `has_image` flag on sightings, UNIQUE sighting_id
- ✅ Sync pattern: Event queue + LWW conflict resolution
- ✅ Service worker: SvelteKit native + Workbox
- ✅ Auth: Session-based with cookies
- ✅ Offline storage: IndexedDB + localStorage
- ✅ Image optimization: Canvas compression to <500KB
- ✅ Conflict resolution: Last-write-wins with notification
- ✅ ORM schema: Normalized with separate images table, soft deletes, timestamps

Ready for Phase 1 (Design: data-model.md, contracts, quickstart.md).
