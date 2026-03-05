# Implementation Plan: Animal Sightings PWA

**Branch**: `001-animal-sightings` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-animal-sightings/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a Progressive Web App (PWA) for recording animal sightings with offline-first capability. Core features: user authentication, GPS auto-capture with manual override, image attachment (max 1 per sighting), dashboard listing, edit/delete operations, and automatic sync when online. Tech stack: SvelteKit full-stack, PostgreSQL with Drizzle ORM backend, browser-based offline storage with service worker, simple file-based or cloud image storage.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5+ (SvelteKit)  
**Primary Dependencies**: SvelteKit, Drizzle ORM, PostgreSQL driver, service worker for offline  
**Storage**: PostgreSQL (backend) + IndexedDB/LocalStorage (offline-first client-side)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web (Progressive Web App, mobile & desktop browsers)
**Project Type**: Full-stack web application (SvelteKit monorepo)  
**Performance Goals**: Dashboard load <2s (cached), sighting creation <1min, image upload <10s on 4G  
**Constraints**: Offline-capable, max 1 image/sighting, <100MB client storage for sync queue  
**Scale/Scope**: Single user context, <100 pending sync changes, mobile-first UI (Svelte components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Reliability: No impacted user flow introduces broken links or unhandled 500-path behavior. **PASS**: API spec (contracts/api.md) documents all error paths and status codes. Server-side validation with clear error messages.
- [x] Edge-state handling: Loading, empty, and error states are defined for each impacted user journey. **PASS**: Spec defines "empty sightings list", "loading sightings", image upload failure, network timeout cases.
- [x] Type safety: Strict TypeScript remains enabled; no `any` introduced without documented boundary exception. **PASS**: Quickstart shows TypeScript strict mode. Drizzle ORM provides type-safe DB queries.
- [x] Frontend modularity: UI and domain logic changes follow reusable component/module boundaries. **PASS**: Structure separates routes (pages), lib/components (reusable), lib/services (business logic), lib/stores (state).
- [x] Quality budgets: Accessibility and performance validation plan targets Lighthouse >90 and WCAG 2.1 AA. **PASS**: Quickstart §7 documents Lighthouse checks and a11y testing procedure.
- [x] Delivery automation: CI/CD updates include unit tests and critical Playwright/Cypress E2E flows. **PASS**: Quickstart §4 references `npm run test` and `npm run test:e2e` (Playwright).

**Result**: ✅ **PASSED** — All Constitution requirements satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── routes/                          # SvelteKit pages & API routes
│   ├── +layout.svelte               # Root layout
│   ├── +page.svelte                 # Home/login page
│   ├── auth/                        # Authentication flow
│   │   ├── login/+page.svelte
│   │   ├── signup/+page.svelte
│   │   └── logout/+server.ts
│   ├── dashboard/
│   │   └── +page.svelte             # Sightings list
│   ├── sighting/
│   │   ├── +page.svelte             # Create sighting
│   │   ├── [id]/+page.svelte        # View sighting detail
│   │   ├── [id]/edit/+page.svelte   # Edit sighting
│   │   └── [id]/+server.ts          # API for sighting CRUD
│   └── api/                         # API routes
│       ├── auth/+server.ts
│       ├── sightings/+server.ts
│       └── sync/+server.ts          # Sync endpoint
├── lib/
│   ├── components/                  # Reusable Svelte components
│   │   ├── Header.svelte
│   │   ├── SightingCard.svelte
│   │   ├── SightingForm.svelte
│   │   └── SyncStatus.svelte
│   ├── services/                    # Business logic
│   │   ├── auth.ts
│   │   ├── sightings.ts
│   │   ├── offline-sync.ts          # Offline/sync logic
│   │   └── image-handler.ts
│   ├── db/                          # Database & ORM
│   │   ├── schema.ts                # Drizzle schema
│   │   └── client.ts                # DB connection
│   ├── stores/                      # Svelte stores (reactive state)
│   │   ├── auth.ts
│   │   ├── sightings.ts
│   │   └── sync.ts
│   ├── utils/
│   │   ├── gps.ts                   # GPS utilities
│   │   ├── validation.ts
│   │   └── timestamps.ts
│   └── service-worker.ts            # SW for offline & caching
├── app.html                         # HTML shell
└── app.d.ts                         # Type definitions

tests/
├── unit/                            # Vitest unit tests
│   ├── services/
│   ├── utils/
│   └── components/
└── e2e/                             # Playwright tests
    ├── auth.spec.ts
    ├── sighting.spec.ts
    └── offline-sync.spec.ts

static/
├── robots.txt
└── icons/                           # PWA manifest icons
```

**Structure Decision**: SvelteKit monorepo structure (single src/ tree) with clear separation: routes for UI/API, lib/components for reusable Svelte components, lib/services for business logic (auth, sightings, offline-sync), lib/db for Drizzle schema and PG client. This maintains modularity while staying simple for a single feature.

## Complexity Tracking

No violations to Constitution Check identified. Design stays within expected complexity:
- Single SvelteKit monorepo (not multiple projects)
- Straightforward Drizzle ORM schema (5 core tables: users, sightings, sessions)
- Standard offline-first pattern (IndexedDB + sync queue)
- No advanced patterns (CRDT, multi-device conflict resolution) beyond last-write-wins

All requirements satisfied without introducing unnecessary complexity.
