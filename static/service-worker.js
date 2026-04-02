const CACHE_NAME = 'animal-identifier-v1';
const APP_SHELL = [
	'/',
	'/dashboard',
	'/login',
	'/logout',
	'/sighting',
	'/signout',
	'/signup',
	'/manifest.json',
	'/icon192.png',
	'/icon512.png'
];

const APP_SHELL_PATHS = new Set(APP_SHELL);

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			for (const path of APP_SHELL) {
				try {
					const response = await fetch(path, { cache: 'no-store' });
					if (response.ok && !response.redirected && new URL(response.url).pathname === path) {
						await cache.put(path, response);
					}
				} catch {
					// Skip unavailable shell entries during install; they can be retried later.
				}
			}
		})()
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((cacheName) => cacheName !== CACHE_NAME)
					.map((cacheName) => caches.delete(cacheName))
			);
		})()
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const requestUrl = new URL(event.request.url);
	const isAppShellRequest = requestUrl.origin === self.location.origin && APP_SHELL_PATHS.has(requestUrl.pathname);
	const isExternalRequest = requestUrl.origin !== self.location.origin;

	if (isAppShellRequest || isExternalRequest) {
		event.respondWith((async () => {
			const cachedResponse = await caches.match(event.request);
			if (cachedResponse) return cachedResponse;

			try {
				const networkResponse = await fetch(event.request);
				if (networkResponse.ok && !networkResponse.redirected) {
					const cache = await caches.open(CACHE_NAME);
					await cache.put(event.request, networkResponse.clone());
				}
				return networkResponse;
			} catch {
				return new Response('Network unavailable', {
					status: 503,
					statusText: 'Service Unavailable'
				});
			}
		})());
		return;
	}

	// Everything else is network-only and never cached.
	event.respondWith(fetch(event.request));
});