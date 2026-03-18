let offline = false;
const sightingsServiceTest = {
    getSightings: async (): Promise<Sighting[]> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (offline)
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
    },
    createSighting: async (data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Sighting> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (offline)
            throw new Error('Network error: Unable to create sighting');

        return {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED' as SyncStatus
        } as Sighting;
    },
    updateSighting: async (
        id: string,
        data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId' | 'syncStatus'>>
    ): Promise<Sighting> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (offline)
            throw new Error('Network error: Unable to update sighting');

        return {
            ...data,
            id: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED' as SyncStatus
        } as Sighting;
    },
    deleteSighting: async (id: string): Promise<{ success: boolean }> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (offline)
            throw new Error('Network error: Unable to delete sighting');

        return { success: true };
    }
};
export { sightingsServiceTest };

