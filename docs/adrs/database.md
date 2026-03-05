**Decision Title:** Select Database

**Status:** Accepted

**Date:** 2026-03-05

1. **Context:** We have setup a repo with SvelteKit. We need a way to store the animal sightings and user information. We are deciding between relational or non-relational. We are also deciding between using an ORM or not, and the provider.

2. **Decision:** We have decided to use a relational database with Drizzle as the ORM.

3. **Rationale:** Building an app where multiple users report animal sightings at specific locations, and the core feature is aggregating those reports to show likelihood of seeing a given animal in an area. That's a textbook relational use case — you have Users, Sightings, Animals, and Locations that all relate to each other with clear foreign keys, and your most important queries are COUNT and GROUP BY operations across those relationships. A document database like MongoDB could technically do this, but you'd be fighting the tool the whole way; Postgres with Drizzle is purpose-built for exactly this kind of structured, interconnected, aggregated data.

4. **Consequences and Risks:** The primary risks of choosing a relational database are that schema design must be done correctly upfront — a poorly planned ERD mid-semester means painful Drizzle migrations that can break the app — and that offline sync is significantly more complex than with a document store, since you'll need UUID primary keys to avoid conflicts when reconciling offline sightings back to the server. Additionally, your distance-based likelihood queries will require the PostGIS extension on Postgres.
