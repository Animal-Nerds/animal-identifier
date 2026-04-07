/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `animal-identifier-${version}`;

// All build output (JS/CSS chunks) + static files (icons, manifest, etc.)
const PRECACHE_ASSETS = [...build, ...files];

const APP_SHELL = [
	'/',
	'/dashboard',
	'/login',
	'/logout',
	'/sighting',
	'/signup'
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);

			// Pre-cache all build assets (JS/CSS chunks) — these are content-hashed and immutable
			await cache.addAll(PRECACHE_ASSETS);

			// Cache app shell pages individually (some may redirect, so fetch manually)
			for (const path of APP_SHELL) {
				try {
					const response = await fetch(path, { cache: 'no-store' });
					if (response.ok && !response.redirected && new URL(response.url).pathname === path) {
						await cache.put(path, response);
					}
				} catch {
					// Skip unavailable shell entries during install
				}
			}
		})()
	);
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name))
			);
		})()
	);
	sw.clients.claim();
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const requestUrl = new URL(event.request.url);
	const isApiRequest = requestUrl.pathname.startsWith('/api/');
	const isNavigationRequest = event.request.mode === 'navigate';
	const isOnline = navigator.onLine;

	// Online navigation: network-first with cache fallback
	if (isNavigationRequest && isOnline) {
		event.respondWith(
			(async () => {
				try {
					const networkResponse = await fetch(event.request);
					if (networkResponse.ok && !networkResponse.redirected) {
						const cache = await caches.open(CACHE_NAME);
						await cache.put(event.request, networkResponse.clone());
					}
					return networkResponse;
				} catch {
					const cachedResponse = await caches.match(event.request);
					if (cachedResponse) return cachedResponse;
					// Try the root shell as a fallback for any page
					const shellResponse = await caches.match('/');
					if (shellResponse) return shellResponse;
					return new Response('Network unavailable', {
						status: 503,
						statusText: 'Service Unavailable'
					});
				}
			})()
		);
		return;
	}

	// Non-API requests (pages, JS/CSS, images): cache-first
	if (!isApiRequest) {
		event.respondWith(
			(async () => {
				const cachedResponse = await caches.match(event.request);
				if (cachedResponse) return cachedResponse;

				// Immutable build assets not in THIS cache belong to a different build version.
				// Don't intercept — let the browser fetch from network directly so it doesn't
				// get a 503 from an old SW that doesn't have chunks from a newer build.
				if (requestUrl.pathname.startsWith('/_app/immutable/')) {
					return fetch(event.request);
				}

				try {
					const networkResponse = await fetch(event.request);
					if (networkResponse.ok && !networkResponse.redirected) {
						const cache = await caches.open(CACHE_NAME);
						await cache.put(event.request, networkResponse.clone());
					}
					return networkResponse;
				} catch {
					// For offline navigation fallback, try serving the cached root shell
					if (event.request.mode === 'navigate') {
						const shellResponse = await caches.match('/');
						if (shellResponse) return shellResponse;
					}
					return new Response('Network unavailable', {
						status: 503,
						statusText: 'Service Unavailable'
					});
				}
			})()
		);
		return;
	}

	// API requests: network-only
	event.respondWith(
		(async () => {
			try {
				return await fetch(event.request);
			} catch {
				return new Response('Network unavailable', {
					status: 503,
					statusText: 'Network Unavailable'
				});
			}
		})()
	);
});
