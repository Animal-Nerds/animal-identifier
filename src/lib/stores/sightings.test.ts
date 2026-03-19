class sightingsServiceClass {
    private offline = false;
    async getSightings (): Promise<Sighting[]> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to fetch sightings');

        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174000',
                species: 'Bald Eagle',
                description: 'Spotted near the river',
                latitude: 45.123456,
                longitude: -122.123456,
                sightedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                images: [],
                syncStatus: 'SYNCED' as SyncStatus
            } as Sighting
        ];
    }
    async createSighting (data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Sighting> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to create sighting');

        return {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED' as SyncStatus
        } as Sighting;
    }
    async updateSighting (
        id: string,
        data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId' | 'syncStatus'>>
    ): Promise<Sighting> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to update sighting');

        return {
            ...data,
            id: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED' as SyncStatus
        } as Sighting;
    }
    async deleteSighting (id: string): Promise<{ success: boolean }> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (this.offline)
            throw new Error('Network error: Unable to delete sighting');

        return { success: true };
    }
    setOffline(value: boolean) {
        this.offline = value;
    }
};
export const sightingsServiceTest = new sightingsServiceClass();

const localStorageMock = (() => {
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

import { describe, it, expect } from 'vitest'
import { SightingsStoreClass } from './sightings';
import type { sightingsService } from '$lib/services/sightings';

type MockSightingsService = typeof sightingsService & {
    setOffline: (value: boolean) => void;
};

describe('sightings store', async () => {
    it('should have 0 sightings when offline', async () => {
        let service = new sightingsServiceClass() as MockSightingsService;
        let ls = {...localStorageMock};
        const sightings = new SightingsStoreClass(service, ls);
        service.setOffline(true);
        await sightings.init()
        const state = sightings.getAllSightings()
        expect(state.length).toBe(0)
    });
    
    it('should have 1 sighting when online', async () => {
        let service = new sightingsServiceClass() as MockSightingsService;
        let ls = {...localStorageMock};
        const sightings = new SightingsStoreClass(service, ls);
        service.setOffline(false);
        await sightings.init()
        const state = sightings.getAllSightings()
        expect(state.length).toBe(1)
    });
    
    it('starting offline with 0, then online should be 1', async () => {
        let service = new sightingsServiceClass() as MockSightingsService;
        let ls = {...localStorageMock};
        const sightings = new SightingsStoreClass(service, ls);
        service.setOffline(true);
        await sightings.init()
        expect(sightings.getAllSightings().length).toBe(0)
        service.setOffline(false);
        await sightings.syncPendingAndReload()
        expect(sightings.getAllSightings().length).toBe(1)
    });
})