class sightingsServiceClass {
    private offline = false;
    private sightings: Sighting[] = [];
    async getSightings (): Promise<Sighting[]> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to fetch sightings');

        return this.sightings;
    }
    async createSighting (data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Sighting> {
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

import { describe, it, expect } from 'vitest'
import { SightingsStoreClass } from './sightings';
import type { sightingsService } from '$lib/services/sightings';

type MockSightingsService = typeof sightingsService & {
    setOffline: (value: boolean) => void;
};

function setupNewStore(offline: boolean) {
    let service = new sightingsServiceClass() as MockSightingsService;
    let ls = createLocalStorageMock() as Storage;
    const sightings = new SightingsStoreClass(service, ls);
    service.setOffline(offline);
    return { sightings, service, ls };
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

describe('sightings store', async () => {
    it('should have 0 sightings when offline', async () => {
        let { sightings, service } = setupNewStore(true)
        await sightings.init()
        const state = sightings.getAllSightings()
        expect(state.length).toBe(0)
    })
    
    it('should have 0 sighting when online', async () => {
        let { sightings, service } = setupNewStore(false)
        await sightings.init()
        const state = sightings.getAllSightings()
        expect(state.length).toBe(0)
    })
    
    it('starting offline with 0, then online should still be 0', async () => {
        let { sightings, service } = setupNewStore(true)
        await sightings.init()
        expect(sightings.getAllSightings().length).toBe(0)
        service.setOffline(false);
        await sightings.syncPendingAndReload()
        expect(sightings.getAllSightings().length).toBe(0)
    })

    it('should add sighting offline and keep it locally as FAILED', async () => {
        let { sightings, service } = setupNewStore(true)
        await sightings.init()
        expect(sightings.getAllSightings().length).toBe(0)

        await sightings.add(createNewSightingPayload())
        const state = sightings.getAllSightings()

        expect(state.length).toBe(1)
        expect(state[0].species).toBe('Fox')
        expect(state[0].syncStatus).toBe('FAILED')
    })

    it('should sync offline-added sighting when back online', async () => {
        let { sightings, service } = setupNewStore(true)
        await sightings.init()

        await sightings.add(createNewSightingPayload())
        expect(sightings.getAllSightings().length).toBe(1)
        expect(sightings.getAllSightings()[0].syncStatus).toBe('FAILED')

        service.setOffline(false);
        await sightings.syncPendingAndReload()

        const state = sightings.getAllSightings()
        expect(state.length).toBe(1)
        expect(state.some((s) => s.species === 'Fox')).toBe(true)
    })

    it('should update sighting offline and retain updated values', async () => {
        let { sightings, service } = setupNewStore(false)
        await sightings.init()
        expect(sightings.getAllSightings().length).toBe(0)
        await sightings.add(createNewSightingPayload())
        expect(sightings.getAllSightings().length).toBe(1)
        const existing = sightings.getAllSightings()[0]

        service.setOffline(true);
        await sightings.update(existing.id, { description: 'Updated while offline' })

        const updated = sightings.getAllSightings()[0]
        expect(updated.description).toBe('Updated while offline')
        expect(updated.syncStatus).toBe('FAILED')
    })

    it('should remove sighting offline without rollback', async () => {
        let { sightings, service } = setupNewStore(false)
        await sightings.init()
        expect(sightings.getAllSightings().length).toBe(0)
        const existing = await sightings.add(createNewSightingPayload())

        const id = sightings.getAllSightings()[0].id
        service.setOffline(true);
        await sightings.remove(id)

        expect(sightings.getAllSightings().length).toBe(0)
    })

    it('should persist sightings to local storage after offline add', async () => {
        let { sightings, service, ls } = setupNewStore(true)
        await sightings.init()

        await sightings.add(createNewSightingPayload())

        const raw = ls.getItem('sightings_cache')
        expect(raw).not.toBeNull()
        const saved = JSON.parse(raw as string) as Sighting[]
        expect(saved.length).toBe(1)
        expect(saved[0].species).toBe('Fox')
    })
    
    it('should keep local changes and get pull changes from server too', async () => {
        let { sightings, service, ls } = setupNewStore(false)
        await sightings.init()

        // add sighting to server directly to simulate another client adding while this one is offline
        await service.createSighting(createNewSightingPayload())

        // add a local sighting while offline
        await sightings.add(createNewSightingPayload())

        // sync and reload
        service.setOffline(false);
        await sightings.syncPendingAndReload()

        const state = sightings.getAllSightings()
        expect(state.length).toBe(2)
        expect(state.filter((s) => s.species === 'Fox').length).toBe(2)
        
    })
})