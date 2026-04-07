**Decision Title:** Offline-first PWA architecture with optimistic sync

**Status:** Accepted

**Date:** 2026-03-15

1. **Context:** The app targets wildlife observers who are often in areas with poor or no connectivity. Users need to create, edit, and delete sightings regardless of network status, and have their changes sync when they reconnect.

2. **Decision:** Implement an offline-first architecture using IndexedDB for local persistence, a custom sync engine in the sightings store, and a SvelteKit-integrated service worker for asset caching.

3. **Rationale:**
   - **IndexedDB** provides structured, async storage that persists across sessions — unlike localStorage, it can store complex objects and large datasets without blocking the main thread.
   - **Optimistic updates** give users instant feedback. Every add/update/delete applies to the local store and IDB immediately before attempting the API call.
   - **Temporary IDs** (`temp_` prefix) for offline-created sightings avoid UUID collisions. When synced, the temp ID is replaced with the server-generated UUID.
   - **Pending deletes in localStorage** ensure delete operations survive page refreshes and are retried on reconnect.
   - **Never roll back** — if an API call fails, the sighting stays in the UI with `FAILED` status. The user's data is never lost.

4. **Consequences and Risks:**
   - **Merge conflicts** — if two devices edit the same sighting offline, the last sync wins. We accept this trade-off for simplicity.
   - **Stale data** — IDB may show outdated sightings until the next sync. The "Updating from server..." indicator helps users understand this.
   - **Storage limits** — base64 images in IDB can grow large. Image compression (max 500KB) mitigates this.
   - **Sync ordering** — creates must sync before updates to the same sighting. The sync engine handles this by processing temp IDs first.

5. **Key Components:**

| Component | File | Role |
|-----------|------|------|
| Sightings Store | `src/lib/stores/sightings.ts` | Sync engine, optimistic mutations, IDB persistence |
| IDB Service | `src/lib/services/idb.ts` | Generic IndexedDB wrapper |
| Service Worker | `src/service-worker.ts` | Asset pre-caching, offline navigation |
| SyncStatus | `src/lib/components/SyncStatus.svelte` | Visual online/offline indicator |
