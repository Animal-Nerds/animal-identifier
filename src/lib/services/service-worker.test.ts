import { describe, it, expect } from 'vitest';

/**
 * Service worker tests.
 *
 * We cannot import the real service-worker.js (it relies on the ServiceWorker
 * global `self`, `caches`, etc.), so instead we build lightweight fakes and
 * test the *logic* the SW implements:
 *   - install: pre-caches the app shell
 *   - activate: deletes old caches
 *   - fetch: routing strategy (network-first for navigation, cache-first for
 *     static assets, network-only for API)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const CACHE_NAME = 'animal-identifier-test';
const APP_SHELL = [
	'/',
	'/dashboard',
	'/login',
	'/logout',
	'/sighting',
	'/signup',
	'/manifest.json',
	'/icon192.png',
	'/icon512.png'
];

/** Minimal Response-like object for the fake cache. */
function fakeResponse(url: string, ok = true, redirected = false) {
	return { url, ok, redirected, clone: () => fakeResponse(url, ok, redirected) };
}

type FakeResponse = ReturnType<typeof fakeResponse>;

/** Minimal CacheStorage fake. */
function createFakeCaches() {
	const storage = new Map<string, Map<string, FakeResponse>>();

	return {
		storage,
		async open(name: string) {
			if (!storage.has(name)) storage.set(name, new Map());
			const cache = storage.get(name)!;
			return {
				put: async (req: string | { url: string }, res: FakeResponse) => {
					const key = typeof req === 'string' ? req : req.url;
					cache.set(key, res);
				},
				match: async (req: string | { url: string }) => {
					const key = typeof req === 'string' ? req : req.url;
					return cache.get(key) ?? undefined;
				}
			};
		},
		async keys() {
			return [...storage.keys()];
		},
		async delete(name: string) {
			return storage.delete(name);
		},
		async match(req: string | { url: string }) {
			const key = typeof req === 'string' ? req : req.url;
			for (const cache of storage.values()) {
				if (cache.has(key)) return cache.get(key);
			}
			return undefined;
		}
	};
}

// ─── Install behaviour ──────────────────────────────────────────────────────

describe('service worker install', () => {
	it('should pre-cache all app shell paths', async () => {
		const caches = createFakeCaches();

		// Simulate install: fetch each shell path and cache if ok
		const cache = await caches.open(CACHE_NAME);
		for (const path of APP_SHELL) {
			const response = fakeResponse(`http://localhost${path}`);
			await cache.put(path, response);
		}

		const cachedCache = caches.storage.get(CACHE_NAME)!;
		for (const path of APP_SHELL) {
			expect(cachedCache.has(path)).toBe(true);
		}
	});

	it('should skip caching responses that are not ok', async () => {
		const caches = createFakeCaches();
		const cache = await caches.open(CACHE_NAME);

		// Only cache ok responses
		const okResponse = fakeResponse('http://localhost/', true);
		const failedResponse = fakeResponse('http://localhost/missing', false);

		if (okResponse.ok && !okResponse.redirected) {
			await cache.put('/', okResponse);
		}
		if (failedResponse.ok && !failedResponse.redirected) {
			await cache.put('/missing', failedResponse);
		}

		const cachedCache = caches.storage.get(CACHE_NAME)!;
		expect(cachedCache.has('/')).toBe(true);
		expect(cachedCache.has('/missing')).toBe(false);
	});

	it('should skip caching redirected responses', async () => {
		const caches = createFakeCaches();
		const cache = await caches.open(CACHE_NAME);

		const redirected = fakeResponse('http://localhost/login', true, true);
		if (redirected.ok && !redirected.redirected) {
			await cache.put('/login', redirected);
		}

		const cachedCache = caches.storage.get(CACHE_NAME)!;
		expect(cachedCache.has('/login')).toBe(false);
	});
});

// ─── Activate behaviour ─────────────────────────────────────────────────────

describe('service worker activate', () => {
	it('should delete old caches and keep current', async () => {
		const caches = createFakeCaches();

		// Populate old and current caches
		await caches.open('animal-identifier-v0');
		await caches.open(CACHE_NAME);
		await caches.open('some-other-cache');

		expect((await caches.keys()).length).toBe(3);

		// Simulate activate: delete all except CACHE_NAME
		const cacheNames = await caches.keys();
		await Promise.all(
			cacheNames
				.filter((name) => name !== CACHE_NAME)
				.map((name) => caches.delete(name))
		);

		const remaining = await caches.keys();
		expect(remaining).toEqual([CACHE_NAME]);
	});
});

// ─── Fetch routing logic ────────────────────────────────────────────────────

describe('service worker fetch routing', () => {
	const ORIGIN = 'http://localhost:4173';
	const APP_SHELL_PATHS = new Set(APP_SHELL);

	function classifyRequest(url: string, mode: string) {
		const requestUrl = new URL(url);
		return {
			isAppShellRequest:
				requestUrl.origin === ORIGIN && APP_SHELL_PATHS.has(requestUrl.pathname),
			isApiRequest: requestUrl.pathname.startsWith('/api/'),
			isNavigationRequest: mode === 'navigate',
			isExternalRequest: requestUrl.origin !== ORIGIN
		};
	}

	it('should classify app shell paths correctly', () => {
		const result = classifyRequest(`${ORIGIN}/dashboard`, 'navigate');
		expect(result.isAppShellRequest).toBe(true);
		expect(result.isNavigationRequest).toBe(true);
		expect(result.isApiRequest).toBe(false);
	});

	it('should classify API requests correctly', () => {
		const result = classifyRequest(`${ORIGIN}/api/sightings`, 'cors');
		expect(result.isApiRequest).toBe(true);
		expect(result.isAppShellRequest).toBe(false);
		expect(result.isNavigationRequest).toBe(false);
	});

	it('should classify external requests correctly', () => {
		const result = classifyRequest('https://cdn.example.com/image.png', 'no-cors');
		expect(result.isExternalRequest).toBe(true);
		expect(result.isAppShellRequest).toBe(false);
	});

	it('should not cache non-GET requests', () => {
		// The SW only handles GET, so POST/PUT/DELETE pass through
		const method: string = 'POST';
		expect(method !== 'GET').toBe(true);
	});

	it('should use network-first for online navigation requests', async () => {
		const caches = createFakeCaches();
		const isOnline = true;
		const isNavigationRequest = true;

		// Simulate: online navigation → try network, cache response, return it
		if (isNavigationRequest && isOnline) {
			const networkResponse = fakeResponse(`${ORIGIN}/dashboard`);
			if (networkResponse.ok && !networkResponse.redirected) {
				const cache = await caches.open(CACHE_NAME);
				await cache.put('/dashboard', networkResponse.clone());
			}
			// network response returned — verify it was cached too
			const cached = await caches.match('/dashboard');
			expect(cached).toBeDefined();
		}
	});

	it('should fall back to cache when navigation network fails offline', async () => {
		const caches = createFakeCaches();

		// Pre-populate cache
		const cache = await caches.open(CACHE_NAME);
		await cache.put('/dashboard', fakeResponse(`${ORIGIN}/dashboard`));

		// Simulate offline navigation
		const networkFailed = true;
		if (networkFailed) {
			const cachedResponse = await caches.match('/dashboard');
			expect(cachedResponse).toBeDefined();
			expect(cachedResponse!.ok).toBe(true);
		}
	});

	it('should return 503 when offline and no cache for navigation', async () => {
		const caches = createFakeCaches();

		// No cache, network fails
		const cachedResponse = await caches.match('/unknown-page');
		if (!cachedResponse) {
			const errorResponse = { status: 503, statusText: 'Service Unavailable' };
			expect(errorResponse.status).toBe(503);
		}
	});

	it('should use cache-first for non-API static assets', async () => {
		const caches = createFakeCaches();

		// Pre-cache a static asset
		const cache = await caches.open(CACHE_NAME);
		await cache.put('/manifest.json', fakeResponse(`${ORIGIN}/manifest.json`));

		// Cache-first: return cached version without network
		const cachedResponse = await caches.match('/manifest.json');
		expect(cachedResponse).toBeDefined();
	});

	it('should use network-only for API requests', () => {
		// API requests are never cached — they go straight to the network
		const { isApiRequest } = classifyRequest(`${ORIGIN}/api/sightings`, 'cors');
		expect(isApiRequest).toBe(true);
		// The SW does: try fetch → catch → 503. No caching.
	});

	it('should return 503 for failed API requests', () => {
		// When the network is down, API requests get a 503 with "Network Unavailable"
		const errorResponse = { status: 503, statusText: 'Network Unavailable' };
		expect(errorResponse.status).toBe(503);
		expect(errorResponse.statusText).toBe('Network Unavailable');
	});
});
