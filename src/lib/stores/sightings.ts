import { get, writable, type Readable } from 'svelte/store';
import { sightingsService } from '../services/sightings';
import { IDB } from '../services/idb';

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

// ─── Internal Utilities ──────────────────────────────────────────────────────

const STORAGE_KEY = 'sightings_cache';
const PENDING_DELETES_KEY = 'sightings_pending_deletes';

type IDBConstructor = new (
	indexedDBFactory: IDBFactory,
	dbName: string,
	version: number,
	schema: { tableName: string; keyPath: string }[]
) => IDB;

// ─── Create Store ────────────────────────────────────────────────────────────

class SightingsStore implements Readable<SightingsStoreState> {
	private sightingsService: typeof sightingsService;
	private idb: IDB | null;
	private pendingDeletesStorage: Pick<Storage, 'getItem' | 'setItem'> | null;
	private dbReady: Promise<void> | null = null;
	private syncInFlight: Promise<void> | null = null;

	private readonly store = writable<SightingsStoreState>({
		sightings: [],
		loading: false,
		error: null,
		initialized: false
	});

	private loadPendingDeletes(): string[] {
		if (!this.pendingDeletesStorage) return [];
		try {
			const cached = this.pendingDeletesStorage.getItem(PENDING_DELETES_KEY);
			return cached ? (JSON.parse(cached) as string[]) : [];
		} catch (err) {
			console.warn('Failed to load pending deletes from localStorage:', err);
			return [];
		}
	}

	private persistPendingDeletes(ids: string[]): void {
		if (!this.pendingDeletesStorage) return;
		try {
			this.pendingDeletesStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(ids));
		} catch (err) {
			console.warn('Failed to persist pending deletes:', err);
		}
	}

	private enqueuePendingDelete(id: string): void {
		const pending = this.loadPendingDeletes();
		if (!pending.includes(id)) {
			this.persistPendingDeletes([...pending, id]);
		}
	}

	private dequeuePendingDelete(id: string): void {
		const pending = this.loadPendingDeletes();
		this.persistPendingDeletes(pending.filter((value) => value !== id));
	}

	private findSightingIndex(sightings: Sighting[], id: string): number {
		return sightings.findIndex((s) => s.id === id);
	}

	private async ensureDBReady(): Promise<void> {
		if (!this.idb) return;
		if (!this.dbReady) {
			this.dbReady = this.idb.open();
		}
		await this.dbReady;
	}

	private async loadFromIDB(): Promise<Sighting[]> {
		if (!this.idb) return [];
		await this.ensureDBReady();
		const result = await this.idb.getAll(STORAGE_KEY);
		if (result.error) {
			console.warn('Failed to load sightings from IDB:', result.error);
			return [];
		}

		return result.records as Sighting[];
	}

	private async upsertSightingInIDB(sighting: Sighting): Promise<void> {
		if (!this.idb) return;
		await this.ensureDBReady();

		const addResult = await this.idb.add(STORAGE_KEY, sighting);
		if (!addResult.error) return;

		const updateResult = await this.idb.update(STORAGE_KEY, sighting.id, sighting);
		if (updateResult.error) {
			console.warn('Failed to upsert sighting in IDB:', updateResult.error);
		}
	}

	private async deleteSightingFromIDB(id: string): Promise<void> {
		if (!this.idb) return;
		await this.ensureDBReady();
		const result = await this.idb.delete(STORAGE_KEY, id);
		if (result.error) {
			console.warn('Failed to delete sighting from IDB:', result.error);
		}
	}

	private async reconcileIDBWithSightings(sightings: Sighting[]): Promise<void> {
		if (!this.idb) return;
		await this.ensureDBReady();

		const existingResult = await this.idb.getAll(STORAGE_KEY);
		if (existingResult.error) {
			console.warn('Failed to reconcile sightings from IDB:', existingResult.error);
			return;
		}

		const existing = existingResult.records as Sighting[];
		const incomingIds = new Set(sightings.map((sighting) => sighting.id));
		for (const record of existing) {
			if (!incomingIds.has(record.id)) {
				await this.deleteSightingFromIDB(record.id);
			}
		}

		for (const sighting of sightings) {
			await this.upsertSightingInIDB(sighting);
		}
	}

	private async updateSightingStatusInIDB(id: string, syncStatus: SyncStatus): Promise<void> {
		const sighting = get(this.store).sightings.find((item) => item.id === id);
		if (!sighting) {
			return;
		}
		await this.upsertSightingInIDB({ ...sighting, syncStatus });
	}
	private readonly handleOnline = () => {
		this.syncPendingAndReload().catch((err) => {
			console.error('Online sync failed:', err);
		});
	};

	constructor(
		thisSightingsService: typeof sightingsService = sightingsService,
		thisIDB: IDBConstructor = IDB,
		pendingDeletesStorage: Pick<Storage, 'getItem' | 'setItem'> | null =
			typeof localStorage === 'undefined' ? null : localStorage
	) {
		this.sightingsService = thisSightingsService;
		this.pendingDeletesStorage = pendingDeletesStorage;
		this.idb =
			typeof indexedDB === 'undefined'
				? null
				: new thisIDB(indexedDB, 'sightings', 1, [
						{
							tableName: STORAGE_KEY,
							keyPath: 'id'
						}
					]);

		if (typeof window !== 'undefined') {
			window.addEventListener('online', this.handleOnline);
		}
	}

	public subscribe: Readable<SightingsStoreState>['subscribe'] = this.store.subscribe;

	getAllSightings(): Sighting[] {
		return [...get(this.store).sightings];
	}

	private toCreatePayload(
		sighting: Sighting
	): Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'userId'> {
		const {
			id: _id,
			createdAt: _createdAt,
			updatedAt: _updatedAt,
			syncStatus: _syncStatus,
			userId: _userId,
			...rest
		} = sighting;
		return rest as Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'userId'>;
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

	private async runSyncPendingAndReload(): Promise<void> {
		await this.ensureDBReady();
		this.store.update((s) => ({ ...s, loading: true, error: null }));

		let syncError: string | null = null;
		const current = get(this.store);

		const unsyncedSightings = current.sightings.filter((sighting) => sighting.syncStatus !== 'SYNCED');

		for (const sighting of unsyncedSightings) {
			try {
				if (sighting.id.startsWith('temp_')) {
					const created = await this.sightingsService.createSighting(this.toCreatePayload(sighting));
					const syncedSighting = { ...created, syncStatus: 'SYNCED' as SyncStatus };
					this.store.update((s) => {
						const idx = this.findSightingIndex(s.sightings, sighting.id);
						if (idx > -1) {
							s.sightings[idx] = syncedSighting;
						}
						return s;
					});
					await this.deleteSightingFromIDB(sighting.id);
					await this.upsertSightingInIDB(syncedSighting);
				} else {
					const updated = await this.sightingsService.updateSighting(
						sighting.id,
						this.toUpdatePayload(sighting)
					);
					this.store.update((s) => {
						const idx = this.findSightingIndex(s.sightings, sighting.id);
						if (idx > -1) {
							s.sightings[idx] = {
								...s.sightings[idx],
								...updated,
								syncStatus: 'SYNCED' as SyncStatus
							};
						}
						return s;
					});
					await this.updateSightingStatusInIDB(sighting.id, 'SYNCED' as SyncStatus);
				}
			} catch (err) {
				syncError = err instanceof Error ? err.message : 'Failed to sync pending sightings';
				this.store.update((s) => {
					const idx = this.findSightingIndex(s.sightings, sighting.id);
					if (idx > -1) {
						s.sightings[idx] = { ...s.sightings[idx], syncStatus: 'FAILED' as SyncStatus };
					}
					return s;
				});
				await this.updateSightingStatusInIDB(sighting.id, 'FAILED' as SyncStatus);
			}
		}

		const pendingDeletes = this.loadPendingDeletes();
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
				(sighting) => sighting.syncStatus !== 'SYNCED'
			);

			const merged = [...serverSightings.map((item: Sighting) => ({ ...item, syncStatus: 'SYNCED' as SyncStatus }))];
			for (const localSighting of localUnsynced) {
				const idx = this.findSightingIndex(merged, localSighting.id);
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
			await this.reconcileIDBWithSightings(merged);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to load latest sightings';
			this.store.update((s) => ({
				...s,
				error: syncError ?? msg
			}));
		}

		this.store.update((s) => ({ ...s, loading: false }));
	}

	async syncPendingAndReload(): Promise<void> {
		if (this.syncInFlight) {
			await this.syncInFlight;
			return;
		}

		this.syncInFlight = this.runSyncPendingAndReload().finally(() => {
			this.syncInFlight = null;
		});
		await this.syncInFlight;
	}

	async init(): Promise<void> {
		await this.ensureDBReady();
		const cachedSightings = await this.loadFromIDB();
		this.store.update((s) => ({ ...s, initialized: true }));
		if (cachedSightings.length > 0) {
			this.store.update((s) => ({ ...s, sightings: cachedSightings }));
		}
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
		await this.ensureDBReady();
		const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const tempSighting: Sighting = {
			...(data as Sighting),
			id: tempId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			syncStatus: 'PENDING' as SyncStatus
		};

		this.store.update((s) => {
			const newList = [...s.sightings, tempSighting];
			return { ...s, sightings: newList, error: null };
		});
		await this.upsertSightingInIDB(tempSighting);

		try {
			this.store.update((s) => ({ ...s, loading: true }));
			const created = await this.sightingsService.createSighting(this.toCreatePayload(tempSighting));
			const syncedSighting = { ...created, syncStatus: 'SYNCED' as SyncStatus };
			this.store.update((s) => {
				const idx = this.findSightingIndex(s.sightings, tempId);
				if (idx > -1) {
					s.sightings[idx] = syncedSighting;
				}
				return s;
			});
			await this.deleteSightingFromIDB(tempId);
			await this.upsertSightingInIDB(syncedSighting);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to add';
			this.store.update((s) => {
				const idx = this.findSightingIndex(s.sightings, tempId);
				if (idx > -1) {
					s.sightings[idx] = { ...s.sightings[idx], syncStatus: 'FAILED' as SyncStatus };
				}
				return { ...s, error: msg };
			});
			await this.updateSightingStatusInIDB(tempId, 'FAILED' as SyncStatus);
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async update(id: string, data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
		await this.ensureDBReady();
		this.store.update((s) => {
			const idx = this.findSightingIndex(s.sightings, id);
			if (idx > -1) {
				s.sightings[idx] = {
					...s.sightings[idx],
					...data,
					syncStatus: 'PENDING' as SyncStatus,
					updatedAt: new Date().toISOString()
				};
			}
			return { ...s, error: null };
		});
		await this.updateSightingStatusInIDB(id, 'PENDING' as SyncStatus);

		try {
			this.store.update((s) => ({ ...s, loading: true }));
			const result = await this.sightingsService.updateSighting(id, data);
			const syncedSighting = { ...result, syncStatus: 'SYNCED' as SyncStatus };
			this.store.update((s) => {
				const idx = this.findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings[idx] = syncedSighting;
				}
				return s;
			});
			await this.upsertSightingInIDB(syncedSighting);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to update';
			this.store.update((s) => {
				const idx = this.findSightingIndex(s.sightings, id);
				if (idx > -1) {
					s.sightings[idx] = { ...s.sightings[idx], syncStatus: 'FAILED' as SyncStatus };
				}
				return { ...s, error: msg };
			});
			await this.updateSightingStatusInIDB(id, 'FAILED' as SyncStatus);
		} finally {
			this.store.update((s) => ({ ...s, loading: false }));
		}
	}

	async remove(id: string): Promise<void> {
		await this.ensureDBReady();
		this.store.update((s) => {
			const idx = this.findSightingIndex(s.sightings, id);
			if (idx > -1) {
				s.sightings.splice(idx, 1);
			}
			return { ...s, error: null };
		});
		await this.deleteSightingFromIDB(id);

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
