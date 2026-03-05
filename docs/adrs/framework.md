**Decision Title:** Select SvelteKit for the full-stack framework

**Status:** Accepted

**Date:** 2026-03-03

1. **Context:** Describe the problem and constraints that required a decision.
Our team needed a framework for a half-semester project. Bakeoff metrics showed significant differences in LCP, bundle size, and implementation speed across three candidates.

2. **Decision:** State the architectural decision clearly in one sentence.
We will use SvelteKit as the primary full-stack framework for the project.

3. **Rationale:** (Data-Based) Cite 3 specific metrics from your scorecard that justify this decision.
SvelteKit is the simplest to develop in (1/5 frustration).
Ecosystem/Community score was 4/5, which is very important as our team comes from differing experience levels. Having rigid structure will help us in the future.
JS bundle size doesn’t matter as much for our specific project because the files will be cached locally offline.

4. **Consequences and Risks:** Identify trade-offs, known risks, and how your team will mitigate them.
The biggest risk with this stack is the larger JS bundle size and slower INP. We will mitigate this by optimizing the pages which will be viewed before downloading offline to be a smaller bundle size.

5. **Alternatives Considered:** Briefly explain why the 2nd place stack was not selected.
Solid was not selected because even though it is much faster and smaller than Svelte, our team all knows Svelte. So though it may be slightly slower, our team can better communicate and develop.
