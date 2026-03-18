import { writable, type Readable } from 'svelte/store';
import * as sightingsService from '../services/sightings';

/**
 * Sightings Store
 * Manages client-side sightings state with optimistic mutations, rollback, and localStorage persistence
 * Uses writable() store for TypeScript compatibility
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface SightingsStoreState {
	sightings: Sighting[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

// ─── Internal Utilities ──────────────────────────────────────────────────────

const STORAGE_KEY = 'sightings_cache';

function isClient(): boolean {
	return typeof window !== 'undefined';
}

function createSnapshot(state: SightingsStoreState): SightingsStoreState {
	return {
		sightings: JSON.parse(JSON.stringify(state.sightings)),
		loading: state.loading,
		error: state.error,
		initialized: state.initialized
	};
}

function persistToLocalStorage(sightings: Sighting[]): void {
	if (!isClient()) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(sightings));
	} catch (err) {
		console.warn('Failed to persist sightings:', err);
	}
}

function loadFromLocalStorage(): Sighting[] {
	if (!isClient()) return [];
	try {
		const cached = localStorage.getItem(STORAGE_KEY);
		return cached ? JSON.parse(cached) : [];
	} catch (err) {
		console.warn('Failed to load sightings from localStorage:', err);
		return [];
	}
}

function findSightingIndex(sightings: Sighting[], id: string): number {
	return sightings.findIndex((s) => s.id === id);
}

// ─── Create Store ────────────────────────────────────────────────────────────

function createSightingsStore() {
	const initialState: SightingsStoreState = {
		sightings: loadFromLocalStorage(),
		loading: false,
		error: null,
		initialized: false
	};

	const { subscribe, set, update } = writable<SightingsStoreState>(initialState);

	// Load function
	const load = async () => {
		if (!isClient()) return;
		update((s) => ({ ...s, loading: true, error: null }));
		try {
			const result = await sightingsService.getSightings();
			update((s) => ({
				...s,
				sightings: result.map((item) => ({
					...item,
					syncStatus: (item.syncStatus || 'SYNCED') as SyncStatus
				})),
				error: null
			}));
			update((s) => {
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to load';
			update((s) => ({ ...s, error: msg }));
			const cached = loadFromLocalStorage();
			if (cached.length > 0) {
				update((s) => ({ ...s, sightings: cached }));
			}
		} finally {
			update((s) => ({ ...s, loading: false }));
		}
	};

	return {
		subscribe,

		init: async () => {
			if (!isClient()) return;
			update((s) => ({ ...s, initialized: true }));
			try {
				await load();
			} catch (err) {
				console.error('Auto-load failed:', err);
			}
		},

		load,

		add: async (data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
			if (!isClient()) return;
			let snapshot: SightingsStoreState | null = null;
			update((s) => {
				snapshot = createSnapshot(s);
				return s;
			});

			const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			update((s) => {
				const sighting: Sighting = {
					...(data as Sighting),
					id: tempId,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					syncStatus: 'PENDING' as SyncStatus
				};
				const newList = [...s.sightings, sighting];
				persistToLocalStorage(newList);
				return { ...s, sightings: newList, error: null };
			});

			try {
				update((s) => ({ ...s, loading: true }));
				const created = await sightingsService.createSighting(data);
				update((s) => {
					const idx = findSightingIndex(s.sightings, tempId);
					if (idx > -1) {
						s.sightings[idx] = { ...created, syncStatus: 'SYNCED' as SyncStatus };
					}
					persistToLocalStorage(s.sightings);
					return s;
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Failed to add';
				if (snapshot !== null) {
					set(snapshot);
					persistToLocalStorage((snapshot as SightingsStoreState).sightings);
				}
				update((s) => ({ ...s, error: msg }));
			} finally {
				update((s) => ({ ...s, loading: false }));
			}
		},

		update: async (id: string, data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId'>>) => {
			if (!isClient()) return;
			let snapshot: SightingsStoreState | null = null;
			update((s) => {
				snapshot = createSnapshot(s);
				return s;
			});

			update((s) => {
				const idx = findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings[idx] = {
						...s.sightings[idx],
						...data,
						syncStatus: 'PENDING' as SyncStatus,
						updatedAt: new Date().toISOString()
					};
				}
				persistToLocalStorage(s.sightings);
				return { ...s, error: null };
			});

			try {
				update((s) => ({ ...s, loading: true }));
				const result = await sightingsService.updateSighting(id, data);
				update((s) => {
					const idx = findSightingIndex(s.sightings, id);
					if (idx > -1) {
						s.sightings[idx] = { ...result, syncStatus: 'SYNCED' as SyncStatus };
					}
					persistToLocalStorage(s.sightings);
					return s;
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Failed to update';
				if (snapshot !== null) {
					set(snapshot);
					persistToLocalStorage((snapshot as SightingsStoreState).sightings);
				}
				update((s) => ({ ...s, error: msg }));
			} finally {
				update((s) => ({ ...s, loading: false }));
			}
		},

		remove: async (id: string) => {
			if (!isClient()) return;
			let snapshot: SightingsStoreState | null = null;
			update((s) => {
				snapshot = createSnapshot(s);
				return s;
			});

			update((s) => {
				const idx = findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings.splice(idx, 1);
				}
				persistToLocalStorage(s.sightings);
				return { ...s, error: null };
			});

			try {
				update((s) => ({ ...s, loading: true }));
				await sightingsService.deleteSighting(id);
				update((s) => {
					persistToLocalStorage(s.sightings);
					return s;
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Failed to remove';
				if (snapshot !== null) {
					set(snapshot);
					persistToLocalStorage((snapshot as SightingsStoreState).sightings);
				}
				update((s) => ({ ...s, error: msg }));
			} finally {
				update((s) => ({ ...s, loading: false }));
			}
		}
	};
}

export const sightings = createSightingsStore();

// Auto-initialize
if (isClient()) {
	sightings.init().catch((err) => {
		console.error('Store init failed:', err);
	});
}
