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

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) =>
			Promise.all(
				cacheNames
					.filter((cacheName) => cacheName !== CACHE_NAME)
					.map((cacheName) => caches.delete(cacheName))
			)
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const requestUrl = new URL(event.request.url);

	if (requestUrl.origin !== self.location.origin) return;

	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(async () => {
				const cachedResponse = await caches.match('/');
				return cachedResponse ?? Response.error();
			})
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) return cachedResponse;

			return fetch(event.request).then((networkResponse) => {
				const responseClone = networkResponse.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
				return networkResponse;
			});
		})
	);
});