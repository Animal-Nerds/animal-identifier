**Decision Title:** Select Database

**Status:** Accepted

**Date:** 2026-03-05

1. **Context:** We have setup a repo with SvelteKit. We need a way to store the animal sightings and user information. We are deciding between relational or non-relational. We are also deciding between using an ORM or not, and the provider.

2. **Decision:** We have decided to use PostgreSQL 16 as the relational database with Drizzle ORM for type-safe schema management.

3. **Rationale:** Building an app where multiple users report animal sightings at specific locations, and the core feature is aggregating those reports to show likelihood of seeing a given animal in an area. That's a textbook relational use case — you have Users, Sightings, Animals, and Locations that all relate to each other with clear foreign keys, and your most important queries are COUNT and GROUP BY operations across those relationships. A document database like MongoDB could technically do this, but you'd be fighting the tool the whole way; Postgres with Drizzle is purpose-built for exactly this kind of structured, interconnected, aggregated data.

4. **Consequences and Risks:** The primary risks of choosing a relational database are that schema design must be done correctly upfront — a poorly planned ERD mid-semester means painful Drizzle migrations that can break the app — and that offline sync is significantly more complex than with a document store, since you'll need UUID primary keys to avoid conflicts when reconciling offline sightings back to the server.

5. **Current Schema:**

| Table | Purpose |
|-------|---------|
| `users` | User accounts with bcrypt password hashes |
| `sessions` | Auth sessions with 30-day expiry, httpOnly token |
| `sightings` | Animal sightings with species, GPS coords, soft-delete flag |
| `images` | Base64 image data linked to sightings with ordering |

Key design choices:
- **UUID primary keys** — enables offline-first sighting creation without ID conflicts
- **Soft deletes** (`is_deleted` flag) on sightings — preserves data integrity during offline sync
- **Cascade deletes** — deleting a user removes all their sightings and images automatically
- **`image_url` column on sightings** — legacy inline image storage alongside the dedicated `images` table
- **Schema push via `drizzle-kit push`** — used instead of migrations for simplicity; runs on every Docker container start
