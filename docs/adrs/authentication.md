**Decision Title:** Session-based authentication with httpOnly cookies

**Status:** Accepted

**Date:** 2026-03-10

1. **Context:** The app needs user authentication to associate sightings with their creator and prevent unauthorized access. We needed to choose between JWT tokens, session cookies, or third-party auth (OAuth).

2. **Decision:** Use server-side sessions stored in PostgreSQL, authenticated via httpOnly cookies with bcrypt password hashing.

3. **Rationale:**
   - **httpOnly cookies** prevent JavaScript from accessing the auth token, eliminating XSS token theft entirely. The browser sends the cookie automatically on every request.
   - **Server-side sessions** allow instant revocation (logout deletes the row) unlike JWTs which remain valid until expiry.
   - **bcrypt** is the industry standard for password hashing with automatic salting and configurable work factor.
   - **No third-party dependency** — OAuth would add complexity and require users to have Google/GitHub accounts, which isn't appropriate for wildlife observers in the field.

4. **Consequences and Risks:**
   - **Database lookup on every request** — `hooks.server.ts` queries the sessions table for each incoming request. This is acceptable at our scale and could be optimized with Redis caching if needed.
   - **30-day session expiry** — sessions last 30 days before requiring re-login. This balances security with convenience for field use.
   - **Offline auth** — the layout checks `navigator.onLine` and skips `auth.restore()` when offline to avoid failed API calls. The client-side auth store in localStorage preserves the logged-in state.

5. **Auth Flow:**

```
POST /api/auth/login → validate credentials → create session → set httpOnly cookie
↓
Every request → hooks.server.ts → read cookie → query session → populate locals.user
↓
POST /api/auth/logout → delete session → clear cookie
```
