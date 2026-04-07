import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { IDB } from '../services/idb';
import { SightingsStoreClass } from './sightings';
import type { sightingsService } from '$lib/services/sightings';

class sightingsServiceClass {
    private offline = false;
    private sightings: Sighting[] = [];
    async getSightings (): Promise<Sighting[]> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to fetch sightings');

        return this.sightings;
    }
    async getSightingById (id: string): Promise<Sighting> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to fetch sighting');
        const sighting = this.sightings.find((s) => s.id === id);

        if (!sighting)
            throw new Error('Sighting not found');
        return sighting;
    }
    async createSighting (data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'userId'>): Promise<Sighting> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to create sighting');

        const sighting = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED' as SyncStatus
        } as Sighting;
        this.sightings.push(sighting);
        return sighting;
    }
    async updateSighting (
        id: string,
        data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId' | 'syncStatus'>>
    ): Promise<Sighting> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to update sighting');


        // get index of sighting to update
        const index = this.sightings.findIndex((s) => s.id === id);
        if (index === -1)
            throw new Error('Sighting not found');
        // update sighting
        const updated = {
            ...this.sightings[index],
            ...data,
            updatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED' as SyncStatus
        };
        this.sightings[index] = updated;
        return updated;
    }
    async deleteSighting (id: string): Promise<{ success: boolean }> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to delete sighting');

        const index = this.sightings.findIndex((s) => s.id === id);
        if (index === -1)
            throw new Error('Sighting not found');

        this.sightings.splice(index, 1);
        return { success: true };
    }
    setOffline(value: boolean) {
        this.offline = value;
    }
};
export const sightingsServiceTest = new sightingsServiceClass();

function createLocalStorageMock() {
    let store = {} as Record<string, string>;
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index: number) => Object.keys(store)[index] || null,
        get length() {
            return Object.keys(store).length;
        }
    };
}

type MockSightingsService = typeof sightingsService & {
    setOffline: (value: boolean) => void;
};

let dbCounter = 0;

function createTestIDBClass() {
    dbCounter++;
    const dbName = `sightings-test-${dbCounter}`;

    class TestIDB extends IDB {
        constructor(indexedDBFactory: IDBFactory, _dbName: string, version: number, schema: { tableName: string; keyPath: string }[]) {
            super(indexedDBFactory, dbName, version, schema);
        }
    }

    return { TestIDB, dbName };
}

function setupNewStore(offline: boolean) {
    const service = new sightingsServiceClass() as unknown as MockSightingsService;
    const ls = createLocalStorageMock() as Storage;
    const { TestIDB, dbName } = createTestIDBClass();
    const sightings = new SightingsStoreClass(service, TestIDB, ls);
    service.setOffline(offline);
    return { sightings, service, ls, dbName };
}

async function loadPersistedSightings(dbName: string): Promise<Sighting[]> {
    const idb = new IDB(indexedDB, dbName, 1, [{ tableName: 'sightings_cache', keyPath: 'id' }]);
    await idb.open();
    const result = await idb.getAll('sightings_cache');
    return result.records as Sighting[];
}

function createNewSightingPayload(): Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> {
    return {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        species: 'Fox',
        description: 'Seen near campsite',
        latitude: 45.0,
        longitude: -122.0,
        sightedAt: new Date().toISOString(),
        images: []
    } as Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>;
}

describe('sightings store', () => {
    it('should have 0 sightings when offline', async () => {
        const { sightings } = setupNewStore(true);
        await sightings.init();
        const state = sightings.getAllSightings();
        expect(state.length).toBe(0);
    });
    
    it('should have 0 sighting when online', async () => {
        const { sightings } = setupNewStore(false);
        await sightings.init();
        const state = sightings.getAllSightings();
        expect(state.length).toBe(0);
    });
    
    it('starting offline with 0, then online should still be 0', async () => {
        const { sightings, service } = setupNewStore(true);
        await sightings.init();
        expect(sightings.getAllSightings().length).toBe(0);
        service.setOffline(false);
        await sightings.syncPendingAndReload();
        expect(sightings.getAllSightings().length).toBe(0);
    });

    it('should add sighting offline and keep it locally as FAILED', async () => {
        const { sightings } = setupNewStore(true);
        await sightings.init();
        expect(sightings.getAllSightings().length).toBe(0);

        await sightings.add(createNewSightingPayload());
        const state = sightings.getAllSightings();

        expect(state.length).toBe(1);
        expect(state[0].species).toBe('Fox');
        expect(state[0].syncStatus).toBe('FAILED');
    });

    it('should sync offline-added sighting when back online', async () => {
        const { sightings, service } = setupNewStore(true);
        await sightings.init();

        await sightings.add(createNewSightingPayload());
        expect(sightings.getAllSightings().length).toBe(1);
        expect(sightings.getAllSightings()[0].syncStatus).toBe('FAILED');

        service.setOffline(false);
        await sightings.syncPendingAndReload();

        const state = sightings.getAllSightings();
        expect(state.length).toBe(1);
        expect(state.some((s) => s.species === 'Fox')).toBe(true);
    });

    it('should update sighting offline and retain updated values', async () => {
        const { sightings, service } = setupNewStore(false);
        await sightings.init();
        expect(sightings.getAllSightings().length).toBe(0);
        await sightings.add(createNewSightingPayload());
        expect(sightings.getAllSightings().length).toBe(1);
        const existing = sightings.getAllSightings()[0];

        service.setOffline(true);
        await sightings.update(existing.id, { description: 'Updated while offline' });

        const updated = sightings.getAllSightings()[0];
        expect(updated.description).toBe('Updated while offline');
        expect(updated.syncStatus).toBe('FAILED');
    });

    it('should remove sighting offline without rollback', async () => {
        const { sightings, service } = setupNewStore(false);
        await sightings.init();
        expect(sightings.getAllSightings().length).toBe(0);
        await sightings.add(createNewSightingPayload());

        const id = sightings.getAllSightings()[0].id;
        service.setOffline(true);
        await sightings.remove(id);

        expect(sightings.getAllSightings().length).toBe(0);
    });

    it('should persist sightings to idb as individual records after offline add', async () => {
        const { sightings, dbName } = setupNewStore(true);
        await sightings.init();

        await sightings.add(createNewSightingPayload());

        const saved = await loadPersistedSightings(dbName);
        expect(saved.length).toBe(1);
        expect(saved[0].species).toBe('Fox');
    });
    
    it('should keep local changes and get pull changes from server too', async () => {
        const { sightings, service } = setupNewStore(true);
        await sightings.init();

        // add sighting to server directly to simulate another client adding while this one is offline
        service.setOffline(false);
        await service.createSighting(createNewSightingPayload());
        service.setOffline(true);

        // add a local sighting while offline
        await sightings.add(createNewSightingPayload());

        // sync and reload
        service.setOffline(false);
        await sightings.syncPendingAndReload();

        const state = sightings.getAllSightings();
        expect(state.length).toBe(2);
        expect(state.filter((s) => s.species === 'Fox').length).toBe(2);
    });
    
    it('should never go to the server when created and deleted offline', async () => {
        const { sightings, service } = setupNewStore(true);
        await sightings.init();

        // add sighting while offline
        await sightings.add(createNewSightingPayload());
        expect(sightings.getAllSightings().length).toBe(1);

        // delete the sighting while still offline
        const id = sightings.getAllSightings()[0].id;
        await sightings.remove(id);
        
        // should be removed locally and none should be on the server
        expect(sightings.getAllSightings().length).toBe(0);
        service.setOffline(false);
        const serverSightings = await service.getSightings();
        service.setOffline(true);
        expect(serverSightings.length).toBe(0);


        // sync the delete
        service.setOffline(false);
        await sightings.syncPendingAndReload();

        const clientState = sightings.getAllSightings();
        expect(clientState.length).toBe(0);
        const serverState = await service.getSightings();
        expect(serverState.length).toBe(0);
    });
    
    it('should delete on the server when online', async () => {
        const { sightings, service } = setupNewStore(false);
        await sightings.init();

        // add sighting while online
        await sightings.add(createNewSightingPayload());
        expect(sightings.getAllSightings().length).toBe(1);

        // delete the sighting after going offline
        const id = sightings.getAllSightings()[0].id;
        service.setOffline(true);
        await sightings.remove(id);
        
        // should be removed locally immediately, but still be on the server
        expect(sightings.getAllSightings().length).toBe(0);
        service.setOffline(false);
        const serverSighting = await service.getSightingById(id);
        service.setOffline(true);
        expect(serverSighting).toBeDefined();


        // sync the delete
        service.setOffline(false);
        await sightings.syncPendingAndReload();

        const clientState = sightings.getAllSightings();
        expect(clientState.length).toBe(0);
        const serverState = await service.getSightings();
        expect(serverState.length).toBe(0);
    });
});