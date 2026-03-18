import { get, writable, type Readable } from 'svelte/store';
import { sightingsService } from '../services/sightings';

/**
 * Sightings Store
 * Manages client-side sightings state with optimistic mutations and offline-first persistence.
 * Never rolls back local changes on API failures.
 * Syncs pending changes when online, then fetches latest server state.
 * Uses writable() store for TypeScript compatibility
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface SightingsStoreState {
	sightings: Sighting[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}
if (typeof localStorage === 'undefined') {
    // Mock localStorage for server-side rendering
    globalThis.localStorage = (() => {
        let store = {} as Record<string, string>;
        return {
            getItem: (key:string) => store[key] || null, // Returns null for undefined keys, like real localStorage
            setItem: (key: string, value: string) => { store[key] = value.toString(); },
            removeItem: (key: string) => { delete store[key]; },
            clear: () => { store = {}; },
            key: (index: number) => Object.keys(store)[index] || null,
            get length() { return Object.keys(store).length; }
        };
    })();
}

// ─── Internal Utilities ──────────────────────────────────────────────────────

const STORAGE_KEY = 'sightings_cache';
const PENDING_DELETES_KEY = 'sightings_pending_deletes';

function persistToLocalStorage(sightings: Sighting[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(sightings));
	} catch (err) {
		console.warn('Failed to persist sightings:', err);
	}
}

function loadFromLocalStorage(): Sighting[] {
	try {
		const cached = localStorage.getItem(STORAGE_KEY);
		return cached ? JSON.parse(cached) : [];
	} catch (err) {
		console.warn('Failed to load sightings from localStorage:', err);
		return [];
	}
}

function persistPendingDeletes(ids: string[]): void {
	try {
		localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(ids));
	} catch (err) {
		console.warn('Failed to persist pending deletes:', err);
	}
}

function loadPendingDeletes(): string[] {
	try {
		const cached = localStorage.getItem(PENDING_DELETES_KEY);
		return cached ? JSON.parse(cached) : [];
	} catch (err) {
		console.warn('Failed to load pending deletes from localStorage:', err);
		return [];
	}
}

function findSightingIndex(sightings: Sighting[], id: string): number {
	return sightings.findIndex((s) => s.id === id);
}

// ─── Create Store ────────────────────────────────────────────────────────────

class SightingsStore implements Readable<SightingsStoreState> {
	private readonly handleOnline = () => {
		this.syncPendingAndReload().catch((err) => {
			console.error('Online sync failed:', err);
		});
	};
    private sightingsService: typeof sightingsService;

	private readonly store = writable<SightingsStoreState>({
		sightings: loadFromLocalStorage(),
		loading: false,
		error: null,
		initialized: false
	});

	constructor(thisSightingsService: typeof sightingsService = sightingsService) {
		this.sightingsService = thisSightingsService;
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.handleOnline);
        }
	}

	public subscribe: Readable<SightingsStoreState>['subscribe'] = this.store.subscribe;

	getAllSightings(): Sighting[] {
		return [...get(this.store).sightings];
	}

	private persistCurrentSightings(): void {
		persistToLocalStorage(get(this.store).sightings);
	}

	private enqueuePendingDelete(id: string): void {
		const pending = loadPendingDeletes();
		if (!pending.includes(id)) {
			persistPendingDeletes([...pending, id]);
		}
	}

	private dequeuePendingDelete(id: string): void {
		const pending = loadPendingDeletes();
		persistPendingDeletes(pending.filter((value) => value !== id));
	}

	private toCreatePayload(sighting: Sighting): Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> {
		const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, syncStatus: _syncStatus, ...rest } = sighting;
		return rest as Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>;
	}

	private toUpdatePayload(
		sighting: Sighting
	): Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId' | 'syncStatus'>> {
		const {
			id: _id,
			createdAt: _createdAt,
			userId: _userId,
			syncStatus: _syncStatus,
			...rest
		} = sighting;
		return rest as Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId' | 'syncStatus'>>;
	}

	async syncPendingAndReload(): Promise<void> {

		this.store?.update((s) => ({ ...s, loading: true, error: null }));

		let syncError: string | null = null;
		let current = get(this.store);

		const unsyncedSightings = current.sightings.filter((sighting) => sighting.syncStatus !== 'SYNCED' as SyncStatus);

		for (const sighting of unsyncedSightings) {
			try {
				if (sighting.id.startsWith('temp_')) {
					const created = await this.sightingsService.createSighting(this.toCreatePayload(sighting));
					this.store.update((s) => {
						const idx = findSightingIndex(s.sightings, sighting.id);
						if (idx > -1) {
							s.sightings[idx] = { ...created, syncStatus: 'SYNCED' as SyncStatus };
						}
						return s;
					});
				} else {
					const updated = await this.sightingsService.updateSighting(
						sighting.id,
						this.toUpdatePayload(sighting)
					);
					this.store.update((s) => {
						const idx = findSightingIndex(s.sightings, sighting.id);
						if (idx > -1) {
							s.sightings[idx] = {
								...s.sightings[idx],
								...updated,
								syncStatus: 'SYNCED' as SyncStatus
							};
						}
						return s;
					});
				}
			} catch (err) {
				syncError = err instanceof Error ? err.message : 'Failed to sync pending sightings';
				this.store.update((s) => {
					const idx = findSightingIndex(s.sightings, sighting.id);
					if (idx > -1) {
						s.sightings[idx] = { ...s.sightings[idx], syncStatus: 'FAILED' as SyncStatus };
					}
					return s;
				});
			}

			this.persistCurrentSightings();
			current = get(this.store);
		}

		const pendingDeletes = loadPendingDeletes();
		for (const id of pendingDeletes) {
			try {
				await this.sightingsService.deleteSighting(id);
				this.dequeuePendingDelete(id);
			} catch (err) {
				syncError = err instanceof Error ? err.message : 'Failed to sync pending deletes';
			}
		}

		try {
			const serverSightings = await this.sightingsService.getSightings();
			const localUnsynced = get(this.store).sightings.filter(
				(sighting) => sighting.syncStatus !== 'SYNCED' as SyncStatus
			);

			const merged = [...serverSightings.map((item) => ({ ...item, syncStatus: 'SYNCED' as SyncStatus }))];
			for (const localSighting of localUnsynced) {
				const idx = findSightingIndex(merged, localSighting.id);
				if (idx > -1) {
					merged[idx] = localSighting;
				} else {
					merged.push(localSighting);
				}
			}

			this.store.update((s) => ({
				...s,
				sightings: merged,
				error: syncError
			}));
			this.persistCurrentSightings();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to load latest sightings';
			this.store.update((s) => ({
				...s,
				error: syncError ?? msg
			}));
		}

		this.store.update((s) => ({ ...s, loading: false }));
	}

	async init(): Promise<void> {
		this.store.update((s) => ({ ...s, initialized: true }));
		try {
			await this.syncPendingAndReload();
		} catch (err) {
			console.error('Auto-load failed:', err);
		}
	}

	async load(): Promise<void> {
		await this.syncPendingAndReload();
	}

	async add(data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<void> {
		const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		this.store.update((s) => {
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
			this.store.update((s) => ({ ...s, loading: true }));
			const created = await this.sightingsService.createSighting(data);
			this.store.update((s) => {
				const idx = findSightingIndex(s.sightings, tempId);
				if (idx > -1) {
					s.sightings[idx] = { ...created, syncStatus: 'SYNCED' as SyncStatus };
				}
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to add';
			this.store.update((s) => {
				const idx = findSightingIndex(s.sightings, tempId);
				if (idx > -1) {
					s.sightings[idx] = { ...s.sightings[idx], syncStatus: 'FAILED' as SyncStatus };
				}
				persistToLocalStorage(s.sightings);
				return { ...s, error: msg };
			});
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async update(id: string, data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
		this.store.update((s) => {
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
			this.store.update((s) => ({ ...s, loading: true }));
			const result = await this.sightingsService.updateSighting(id, data);
			this.store.update((s) => {
				const idx = findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings[idx] = { ...result, syncStatus: 'SYNCED' as SyncStatus };
				}
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to update';
			this.store.update((s) => {
				const idx = findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings[idx] = { ...s.sightings[idx], syncStatus: 'FAILED' as SyncStatus };
				}
				persistToLocalStorage(s.sightings);
				return { ...s, error: msg };
			});
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async remove(id: string): Promise<void> {
		this.store.update((s) => {
			const idx = findSightingIndex(s.sightings, id);
			if (idx > -1) {
				s.sightings.splice(idx, 1);
			}
			persistToLocalStorage(s.sightings);
			return { ...s, error: null };
		});

		// Deletions are persisted immediately; queue for background sync.
		if (!id.startsWith('temp_')) {
			this.enqueuePendingDelete(id);
		}

		try {
			this.store.update((s) => ({ ...s, loading: true }));
			if (!id.startsWith('temp_')) {
				await this.sightingsService.deleteSighting(id);
				this.dequeuePendingDelete(id);
			}
			this.store.update((s) => {
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to remove';
			this.store.update((s) => ({ ...s, error: msg }));
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}
}

export const sightings = new SightingsStore();

export const SightingsStoreClass = SightingsStore;

// Auto-initialize
sightings.init().catch((err) => {
    console.error('Store init failed:', err);
});
