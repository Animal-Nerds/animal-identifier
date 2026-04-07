**Decision Title:** Select SvelteKit for the full-stack framework

**Status:** Accepted

**Date:** 2026-03-03

1. **Context:** Our team needed a framework for a half-semester project. Bakeoff metrics showed significant differences in LCP, bundle size, and implementation speed across three candidates.

2. **Decision:** We will use SvelteKit 2 with Svelte 5 (runes) as the primary full-stack framework for the project.

3. **Rationale:**
   - SvelteKit is the simplest to develop in (1/5 frustration score).
   - Ecosystem/Community score was 4/5, which is very important as our team comes from differing experience levels. Having rigid structure will help us in the future.
   - JS bundle size doesn't matter as much for our specific project because the files will be cached locally offline via the service worker.
   - Svelte 5 runes (`$state`, `$derived`, `$effect`) provide a cleaner reactivity model than Svelte 4 stores for complex state management like offline sync.

4. **Consequences and Risks:** The biggest risk with this stack is the larger JS bundle size and slower INP. We will mitigate this by optimizing the pages which will be viewed before downloading offline to be a smaller bundle size.

5. **Alternatives Considered:** Solid was not selected because even though it is much faster and smaller than Svelte, our team all knows Svelte. So though it may be slightly slower, our team can better communicate and develop.

6. **Adapter Configuration:** The project uses a dual-adapter setup in `svelte.config.js`:
   - **`adapter-auto`** (default) — for cloud platforms like Render and Vercel
   - **`adapter-node`** — for Docker-based self-hosted deployment on Proxmox (activated via `ADAPTER=node` env var)
