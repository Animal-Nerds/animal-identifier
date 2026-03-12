# Implementation Tasks: Animal Sightings PWA

**Feature Branch**: `001-animal-sightings`  
**Generated**: 2026-03-05  
**Total Tasks**: 56  
**Task Format**: Each task follows `- [ ] [ID] [P]? [Story?] Description with file path`

---

## Overview & Execution Strategy

This tasks document is organized by **user story priority**, enabling a team to work in parallel once foundational tasks are complete. 

### Parallel Execution Strategy

- **Setup & Foundational** (Phase 1-2): Sequential (prerequisite for all stories)
- **User Stories 1 & 2** (Phase 3-4, both P1): Fully parallelizable after foundational tasks complete
  - Different files/endpoints
  - Independent domain logic (auth vs. sightings)
  - Can be developed simultaneously by different team members
- **User Stories 3 & 4** (Phase 5-6, both P2): Parallelizable with P1 stories
  - Story 3 (Dashboard) depends on Story 2 data layer only
  - Story 4 (Edit/Delete) depends on Story 2 data layer only
  - Both can proceed in parallel
- **User Story 5** (Phase 7, P3): Depends on all CRUD operations (must follow P2 stories)
- **Polish & Tests** (Phase 8): Can begin after Phase 2 (foundational) is complete, refined as features ship

### MVP Recommendation

**Scope**: US1 + US2 = Authentication + Sighting Creation
- Users can sign up, log in, and immediately start recording sightings
- Delivers core value
- Estimated effort: Phases 1-4
- Time estimate: ~1 week for team of 3-4 developers

---

## Phase 1: Setup & Environment Configuration

> **Goal**: Initialize project structure, tooling, and environment  
> **Independent Test**: `npm run dev` launches without errors; .env.local configured; PostgeSQL connection verified

- [ ] T001 Create .env.local configuration file with DATABASE_URL and SESSION_SECRET in repo root
- [ ] T002 [P] Create npm scripts in `package.json`: `db:migrate`, `db:seed`, `test`, `test:e2e` (see Quickstart)
- [ ] T004 Verify PostgreSQL is running locally or via Docker; confirm database `animal_sightings_dev` exists

---

## Phase 2: Foundational Infrastructure (Blocking All Stories)

> **Goal**: Establish database, auth middleware, components, and type safety  
> **Independent Test**: Drizzle migration runs without errors; types are strict; layout renders; base routes work

### Database & ORM

- [ ] T005 [P] Create Drizzle schema with all 4 tables (users, sightings, images, sessions) in `src/lib/db/schema.ts`
- [ ] T006 [P] Create database client with connection pool in `src/lib/db/client.ts`
- [ ] T007 [P] Create Drizzle migration files in `src/lib/db/migrations/` and verify `npm run db:migrate` executes
- [ ] T008 [P] Create validation utilities for sightings, users, and images in `src/lib/utils/validation.ts`

### Global Types & Constants

- [ ] T009 [P] Define global types in `src/app.d.ts`: User, Session, Sighting, Image, SyncStatus enums
- [ ] T010 [P] Create constants file `src/lib/utils/constants.ts`: API routes, validation rules, limits (max 500KB image, lat/long ranges)

### Core Components & Layout

- [ ] T011 [P] Create root layout component `src/routes/+layout.svelte`: header, nav, logout button, protected routes guard
- [ ] T012 [P] Create Header component in `src/lib/components/Header.svelte`: branding, user email, nav links
- [ ] T013 [P] Create SyncStatus component in `src/lib/components/SyncStatus.svelte`: displays sync indicator (placeholder for Phase 7)

### Auth Stores & Middleware

- [ ] T014 [P] Create auth Svelte store in `src/lib/stores/auth.ts`: manages user state, login, logout, hydration
- [ ] T015 [P] Create auth middleware in `src/routes/+layout.server.ts`: checks session on app load, returns user to locals
- [ ] T016 [P] Ensure all protected routes check `if (!locals.user)` in +layout.server.ts or +page.server.ts

---

## Phase 3: User Story 1 - User Authentication (P1)

> **Story Goal**: Users can sign up, log in, and manage sessions  
> **Independent Test**: Create account → log out → log in with same credentials → dashboard loads with correct user email  
> **Test Criteria**:
> - Signup form validation works (password strength, email format)
> - Login rejects invalid credentials
> - Session persists after page refresh
> - Logout clears session and redirects to login

### Auth Service & Business Logic

- [ ] T017 [P] [US1] Create auth service in `src/lib/services/auth.ts`: password hashing (bcrypt), session token generation, utilities
- [ ] T018 [P] [US1] Create validation for email format and password strength (≥8 chars, uppercase, lowercase, digit) in `src/lib/utils/validation.ts`

### Pages & UI

- [ ] T019 [P] [US1] Create signup page `src/routes/auth/signup/+page.svelte`: form with email, password, submit, link to login
- [ ] T020 [P] [US1] Create login page `src/routes/auth/login/+page.svelte`: form with email, password, submit, link to signup
- [ ] T021 [US1] Create landing/home page `src/routes/+page.svelte`: auth check (redirect to dashboard if logged in, else show login/signup buttons)

### API Endpoints (Authentication)

- [ ] T022 [P] [US1] Create POST `/api/auth/signup` endpoint in `src/routes/api/auth/+server.ts`: validate email/password, hash password, create user, create session, set cookie
- [ ] T023 [P] [US1] Create POST `/api/auth/login` endpoint in `src/routes/api/auth/+server.ts`: validate credentials, create session, set cookie, return user
- [ ] T024 [P] [US1] Create POST `/api/auth/logout` endpoint in `src/routes/api/auth/+server.ts`: clear session from DB and cookies
- [ ] T025 [P] [US1] Create GET `/api/auth/me` endpoint in `src/routes/api/auth/+server.ts`: validate session, return current user
- [ ] T026 [US1] Create protected dashboard placeholder page at `src/routes/dashboard/+page.svelte` (will populate in US3)

---

## Phase 4: User Story 2 - Create Sightings with Auto-Captured Location (P1)

> **Story Goal**: Authenticated users can record animal sightings with auto-GPS and optional image  
> **Independent Test**: Create sighting with auto-GPS → verify data in DB; create sighting with manual lat/long → verify; add image → verify `has_image = true`  
> **Test Criteria**:
> - GPS geolocation is auto-filled when available
> - Timestamp auto-fills on page load
> - Manual override of lat/long works
> - Image compression reduces file size <500KB
> - Sighting saved in DB with all required fields
> - Image optional; sighting works without image

### Utilities & Support Services

- [ ] T027 [P] [US2] Create GPS utility wrapper in `src/lib/utils/gps.ts`: navigator.geolocation wrapper with error handling, returns {latitude, longitude} or null
- [ ] T028 [P] [US2] Create timestamp utility in `src/lib/utils/timestamps.ts`: toISO(), fromISO(), formatForDisplay()
- [ ] T029 [P] [US2] Create image handler in `src/lib/services/image-handler.ts`: compress image (canvas or ImageMagick.wasm), convert to Base64 data URI, validate size/format

### Sighting Service & Store

- [ ] T030 [P] [US2] Create sightings service in `src/lib/services/sightings.ts`: createSighting(), updateSighting(), deleteSighting(), getSighting(), getSightings() (calls API)
- [ ] T031 [P] [US2] Create sightings Svelte store in `src/lib/stores/sightings.ts`: manages sightings list state, hydration, mutations

### Form Components & Pages

- [ ] T032 [P] [US2] Create reusable SightingForm component in `src/lib/components/SightingForm.svelte`: fields for animal_name, location, latitude, longitude, timestamp, image picker; pre-fills GPS + timestamp on load
- [ ] T033 [P] [US2] Create create sighting page `src/routes/sighting/+page.svelte`: integrates SightingForm, calls service on submit, redirects to dashboard on success

### API Endpoints (Sightings CRUD)

- [ ] T034 [P] [US2] Create POST `/api/sightings` endpoint in `src/routes/api/sightings/+server.ts`: validate sighting, insert into DB, return created sighting with ID
- [ ] T035 [P] [US2] Create GET `/api/sightings/:id` endpoint in `src/routes/sighting/[id]/+server.ts`: fetch single sighting, check ownership, return data
- [ ] T036 [P] [US2] Create POST `/api/sightings/:id/image` endpoint in `src/routes/api/sightings/[id]/image/+server.ts`: accept Base64 image, insert/update in images table, set `has_image = true` on sighting

---

## Phase 5: User Story 3 - View Sighting Dashboard (P2)

> **Story Goal**: Users see dashboard listing all their sightings with image icons and click to detail view  
> **Independent Test**: Create 3+ sightings (some with images) → navigate to dashboard → all appear in list with correct image icons → click one → detail page loads with full data  
> **Test Criteria**:
> - Dashboard loads sightings from API
> - Image icons display only when `has_image = true`
> - Sightings list paginated or scrollable for many items
> - Empty state message displays when no sightings
> - Click sighting navigates to detail page
> - Detail page shows all sighting information including image

### Components

- [ ] T037 [P] [US3] Create SightingCard component in `src/lib/components/SightingCard.svelte`: displays animal_name, date, location, image icon (if has_image), click navigates to detail
- [ ] T038 [P] [US3] Update dashboard page `src/routes/dashboard/+page.svelte`: fetch sightings, render list with SightingCard, show empty state

### API Endpoints

- [ ] T039 [P] [US3] Create GET `/api/sightings` endpoint in `src/routes/api/sightings/+server.ts`: return paginated list of user's sightings (exclude soft-deleted), ordered by created_at desc

### Detail Page & Image Display

- [ ] T040 [P] [US3] Create detail page `src/routes/sighting/[id]/+page.svelte`: fetch sighting, display full info, fetch and display image (if has_image)
- [ ] T041 [US3] Create GET `/api/sightings/:id/image` endpoint in `src/routes/api/sightings/[id]/image/+server.ts`: return Base64 image_data or 404 if not found

---

## Phase 6: User Story 4 - Edit and Delete Sightings (P2)

> **Story Goal**: Users can modify sightings and remove incorrect entries  
> **Independent Test**: Edit sighting field → verify change persists; delete sighting → verify removed from dashboard; add image to existing → replace with new image  
> **Test Criteria**:
> - Edit form pre-fills with current sighting data
> - Edit submission validates and updates DB
> - Changes visible immediately in dashboard
> - Delete shows confirmation dialog
> - Delete removes sighting from list
> - Image replacement works (old deleted, new added)

### Edit Pages & Components

- [ ] T042 [P] [US4] Create edit sighting page `src/routes/sighting/[id]/edit/+page.svelte`: fetch sighting, render SightingForm pre-filled, handle update submit
- [ ] T043 [P] [US4] Update detail page to include edit and delete buttons linking to edit page and delete endpoint

### API Endpoints (Update/Delete)

- [ ] T044 [P] [US4] Create PUT `/api/sightings/:id` endpoint in `src/routes/api/sightings/[id]/+server.ts`: validate ownership, update fields, return updated sighting with new updated_at
- [ ] T045 [P] [US4] Create DELETE `/api/sightings/:id` endpoint in `src/routes/api/sightings/[id]/+server.ts`: soft delete (set is_deleted = true), return success
- [ ] T046 [P] [US4] Create DELETE `/api/sightings/:id/image` endpoint in `src/routes/api/sightings/[id]/image/+server.ts`: delete image record, set has_image = false on sighting

---

## Phase 7: User Story 5 - Offline Capability & Sync (P3)

> **Story Goal**: App works offline; pending changes auto-sync when online  
> **Independent Test**: Go offline → create/edit sightings → page shows "Offline" indicator → go online → changes appear in DB and on dashboard with "Synced" indicator  
> **Test Criteria**:
> - All CRUD ops work offline (stored in IndexedDB)
> - Sync status indicator shows "Offline", "Syncing", "Synced"
> - Auto-sync triggers on connectivity change with no user action
> - Dashboard reflects server state after sync
> - Soft deletes queue and sync correctly
> - Conflict handling graceful (warn user if sighting changed on server)

### Offline Storage & Sync Service

- [ ] T047 [P] [US5] Create IndexedDB schema in `src/lib/services/offline-sync.ts`: tables for sightings (local copy), sync_queue (operations), metadata (last_synced_at)
- [ ] T048 [P] [US5] Create offline sync service: queue operations, detect online/offline, batch and retry sync
- [ ] T049 [P] [US5] Create sync Svelte store in `src/lib/stores/sync.ts`: manages sync status (pending, syncing, synced, error), conflict warnings
- [ ] T050 [P] [US5] Implement connectivity detection: listen to online/offline events, trigger sync on reconnect

### Service Worker Setup

- [ ] T051 [P] [US5] Create/update service worker `src/service-worker.ts`: import Workbox, precache app shell, define caching strategies (NetworkFirst for API, CacheFirst for static assets)
- [ ] T052 [P] [US5] Configure service worker in `svelte.config.js`: enable service worker build output, register in app

### Sync API Endpoint

- [ ] T053 [P] [US5] Create POST `/api/sync` endpoint in `src/routes/api/sync/+server.ts`: accept sync_queue batch, apply changes in order, detect conflicts, return {success, updated_at, conflicts}
- [ ] T054 [US5] Test offline → online workflow: disable network, create/edit/delete, re-enable, verify sync completes and dashboard reflects changes

### UI Integration

- [ ] T055 [US5] Update SyncStatus component to display current sync status from store, show error/conflict warnings

---

## Phase 8: Polish & Cross-Cutting Concerns

> **Goal**: Error handling, loading/empty states, accessibility, performance, tests  
> **Independent Test**: All Lighthouse audits >90; WCAG 2.1 AA passes; E2E tests pass; no console errors

### Error Handling & Validation

- [ ] T056 [P] Create comprehensive error handling: API error responses with status codes and user-friendly messages, form validation feedback in UI, network timeout messages
- [ ] T057 [P] Implement loading, empty, and error states: LoadingSpinner component, EmptyState component, ErrorAlert component for all pages
- [ ] T058 [P] Add try-catch and error boundaries: all API calls wrapped, store subscriptions handle errors

### Accessibility & Performance

- [ ] T059 [P] Audit and fix accessibility: semantic HTML, ARIA labels, keyboard navigation, color contrast, test with axe DevTools
- [ ] T060 [P] Performance optimization: image lazy loading, code splitting, bundle analysis with `npm run build --analyze` (or vite plugin)
- [ ] T061 [P] Run Lighthouse audit in CI/CD, target Performance >90, Accessibility >90

### Unit & E2E Tests

- [ ] T062 [P] Create unit tests with Vitest: `src/lib/services/*.test.ts`, `src/lib/utils/*.test.ts`, focus on auth, validation, sync logic
- [ ] T063 [P] Create E2E tests with Playwright: `tests/e2e/auth.spec.ts`, `tests/e2e/sighting.spec.ts`, `tests/e2e/offline-sync.spec.ts`
- [ ] T064 [P] Configure CI/CD: GitHub Actions runs `npm run test` and `npm run test:e2e` on PR and main branch

### Documentation & Deployment

- [ ] T065 [P] Write developer onboarding guide: setup instructions, architecture overview, common tasks (adding a field, creating new endpoint)
- [ ] T066 Create PWA manifest (`public/manifest.json`): app name, icons, theme colors, start_url
- [ ] T067 Add PWA install prompt on first visit; test on mobile via `npm run build && npm run preview`

---

## Dependency Graph: Task Completion Order

```
PHASE 1 (Setup)
T001, T002, T003, T004
     │
     ├────────────────────────────────────────┐
     │                                        │
     v                                        v
PHASE 2 (Foundational - Blocks All)           │
T005-T016 (all can run in parallel)           │
     │                                        │
     ├─────────────────┬──────────────┬───────┤
     │                 │              │       │
     v                 v              v       │
PHASE 3 (US1)    PHASE 4 (US2)   PHASE 5 & 6  │
T017-T026        T027-T041       (US3, US4)   │
  │ (P1)           │ (P1)          │ (P2)     │
  │                │               │          │
  └────────────────┴───────────────┘          │
           │                                  │
           v                                  v
      PHASE 7 (US5)                   PHASE 8 (Polish)
       T047-T055                       T056-T067
       (P3) - requires                 (can run in parallel
       all CRUD ops first)             with later phases)
```

**Parallel Opportunities**:
- **Phase 1**: All tasks sequential (environment setup)
- **Phase 2**: T005-T016 fully parallelizable (different files, no dependencies)
- **Phase 3 & 4**: T017-T041 fully parallelizable after Phase 2 (auth vs. sightings are independent domains)
- **Phase 5 & 6**: T037-T046 parallelizable with Phase 4 (dashboard and edit both depend on sightings CRUD from Phase 4)
- **Phase 7**: T047-T055 must follow Phase 6 (requires all CRUD endpoints to exist)
- **Phase 8**: T056-T067 can begin after Phase 2, refined throughout

---

## Task Summary for Team Planning

| Phase | Story | Task Count | Parallelizable | Est. Effort | Priority |
|-------|-------|-----------|----------------|-------------|----------|
| 1 | Setup | 4 | No (sequential) | 1 day | P0 |
| 2 | Foundation | 12 | Yes (all) | 2-3 days | P0 |
| 3 | US1 Auth | 10 | Yes (after Ph2) | 2-3 days | P1 |
| 4 | US2 Create | 15 | Yes (after Ph2) | 3-4 days | P1 |
| 5 | US3 Dashboard | 5 | Yes (after Ph4) | 1-2 days | P2 |
| 6 | US4 Edit/Del | 5 | Yes (after Ph4) | 1-2 days | P2 |
| 7 | US5 Offline | 9 | Yes (after Ph6) | 2-3 days | P3 |
| 8 | Polish | 11 | Yes (ongoing) | 2-3 days | P4 |
| | **TOTAL** | **67 tasks** | | **~2-3 weeks** | |

**MVP Scope** (Phases 1-4): 41 tasks, ~1 week, delivers core sighting recording feature
**Full Feature** (Phases 1-7 + critical polish tasks): 55 tasks, ~2-3 weeks

---

## Notes for Team Execution

1. **Environment**: Complete Phase 1 & 2 before splitting team (blocking prerequisites)
2. **Branching**: Each team member takes one user story (US1, US2, US3, etc.) once Phase 2 is done
3. **Testing**: Create unit tests alongside implementation, not after (T062-T063 can begin after Phase 2)
4. **Code Review**: PR reviews on API endpoints (T022-T025, T034-T036, T044-T046, T053) to ensure error handling consistency
5. **Database Migrations**: T007 must pass before any DB schema changes; keep migrations clean and reversible
6. **Lighthouse**: Start automation in Phase 8 (T061) but monitor bundle size throughout
