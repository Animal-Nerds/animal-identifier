**Decision Title:** Dual deployment — Render (cloud) + Proxmox (self-hosted)

**Status:** Accepted

**Date:** 2026-04-05

1. **Context:** The app was initially deployed to Render using SvelteKit's `adapter-auto`. A backup deployment on a self-hosted Proxmox server was needed for redundancy and to support Cloudflare Tunnels for custom domain routing.

2. **Decision:** Support dual deployment targets — Render (cloud) and Proxmox (self-hosted via Docker) — using a conditional adapter in `svelte.config.js` and separate GitHub Actions workflows.

3. **Rationale:**
   - **Render** provides zero-config cloud hosting with automatic deployments from `main`.
   - **Proxmox** provides a self-hosted backup at home with full control, accessible via Cloudflare Tunnels.
   - The `ADAPTER` env var switches between `adapter-auto` (Render) and `adapter-node` (Docker) without any code changes.
   - Separate CI workflows ensure each deployment path is independent — a Proxmox failure doesn't block the Render deploy.

4. **Consequences and Risks:**
   - **Two deployments to maintain** — schema changes must work on both environments.
   - **Self-hosted runner dependency** — the Proxmox deploy requires a GitHub Actions self-hosted runner to be online.
   - **Env var management** — Render uses its dashboard for env vars; Proxmox uses GitHub Secrets injected into `.env` at deploy time.
   - **Docker image size** — the multi-stage build keeps the production image lean (~200MB) by only copying `build/`, `node_modules/`, and schema files.

5. **Infrastructure:**

| Component | Render | Proxmox |
|-----------|--------|---------|
| Adapter | `adapter-auto` | `adapter-node` |
| Database | Render Postgres | Docker Compose `postgres:16` |
| CI Trigger | Push/PR to `main` | Every push (all branches) |
| Runner | GitHub-hosted | Self-hosted |
| Domain | Render subdomain | Cloudflare Tunnel → `localhost:3000` |
| Schema Push | CI step | `docker-entrypoint.sh` on container start |
