import { get, writable, type Readable } from 'svelte/store';
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

class SightingsStore implements Readable<SightingsStoreState> {
	private readonly store = writable<SightingsStoreState>({
		sightings: loadFromLocalStorage(),
		loading: false,
		error: null,
		initialized: false
	});

	public subscribe: Readable<SightingsStoreState>['subscribe'] = this.store.subscribe;

	getAllSightings(): Sighting[] {
		return [...get(this.store).sightings];
	}

	async init(): Promise<void> {
		if (!isClient()) return;
		this.store.update((s) => ({ ...s, initialized: true }));
		try {
			await this.load();
		} catch (err) {
			console.error('Auto-load failed:', err);
		}
	}

	async load(): Promise<void> {
		if (!isClient()) return;
		this.store.update((s) => ({ ...s, loading: true, error: null }));
		try {
			const result = await sightingsService.getSightings();
			this.store.update((s) => ({
				...s,
				sightings: result.map((item) => ({
					...item,
					syncStatus: (item.syncStatus || SyncStatus.SYNCED) as SyncStatus
				})),
				error: null
			}));
			this.store.update((s) => {
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to load';
			this.store.update((s) => ({ ...s, error: msg }));
			const cached = loadFromLocalStorage();
			if (cached.length > 0) {
				this.store.update((s) => ({ ...s, sightings: cached }));
			}
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async add(data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<void> {
		if (!isClient()) return;
		let snapshot: SightingsStoreState | null = null;
		this.store.update((s) => {
			snapshot = createSnapshot(s);
			return s;
		});

		const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		this.store.update((s) => {
			const sighting: Sighting = {
				...(data as Sighting),
				id: tempId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				syncStatus: SyncStatus.PENDING
			};
			const newList = [...s.sightings, sighting];
			persistToLocalStorage(newList);
			return { ...s, sightings: newList, error: null };
		});

		try {
			this.store.update((s) => ({ ...s, loading: true }));
			const created = await sightingsService.createSighting(data);
			this.store.update((s) => {
				const idx = findSightingIndex(s.sightings, tempId);
				if (idx > -1) {
					s.sightings[idx] = { ...created, syncStatus: SyncStatus.PENDING };
				}
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to add';
			const rollbackSnapshot = snapshot;
			if (rollbackSnapshot) {
				this.store.set(rollbackSnapshot);
				persistToLocalStorage(get(this.store).sightings);
			}
			this.store.update((s) => ({ ...s, error: msg }));
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async update(id: string, data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
		if (!isClient()) return;
		let snapshot: SightingsStoreState | null = null;
		this.store.update((s) => {
			snapshot = createSnapshot(s);
			return s;
		});

		this.store.update((s) => {
			const idx = findSightingIndex(s.sightings, id);
			if (idx > -1) {
				s.sightings[idx] = {
					...s.sightings[idx],
					...data,
					syncStatus: SyncStatus.PENDING,
					updatedAt: new Date().toISOString()
				};
			}
			persistToLocalStorage(s.sightings);
			return { ...s, error: null };
		});

		try {
			this.store.update((s) => ({ ...s, loading: true }));
			const result = await sightingsService.updateSighting(id, data);
			this.store.update((s) => {
				const idx = findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings[idx] = { ...result, syncStatus: SyncStatus.SYNCED };
				}
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to update';
			const rollbackSnapshot = snapshot;
			if (rollbackSnapshot) {
				this.store.set(rollbackSnapshot);
				persistToLocalStorage(get(this.store).sightings);
			}
			this.store.update((s) => ({ ...s, error: msg }));
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async remove(id: string): Promise<void> {
		if (!isClient()) return;
		let snapshot: SightingsStoreState | null = null;
		this.store.update((s) => {
			snapshot = createSnapshot(s);
			return s;
		});

		this.store.update((s) => {
			const idx = findSightingIndex(s.sightings, id);
			if (idx > -1) {
				s.sightings.splice(idx, 1);
			}
			persistToLocalStorage(s.sightings);
			return { ...s, error: null };
		});

		try {
			this.store.update((s) => ({ ...s, loading: true }));
			await sightingsService.deleteSighting(id);
			this.store.update((s) => {
				persistToLocalStorage(s.sightings);
				return s;
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to remove';
			const rollbackSnapshot = snapshot;
			if (rollbackSnapshot) {
				this.store.set(rollbackSnapshot);
				persistToLocalStorage(get(this.store).sightings);
			}
			this.store.update((s) => ({ ...s, error: msg }));
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}
}

export const sightings = new SightingsStore();

// Auto-initialize
if (isClient()) {
	sightings.init().catch((err) => {
		console.error('Store init failed:', err);
	});
}
