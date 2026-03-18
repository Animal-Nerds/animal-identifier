export async function getSightings(): Promise<Sighting[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return [];
}

export async function createSighting(data: Omit<Sighting, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Sighting> {
	await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'SYNCED' as SyncStatus
    } as Sighting;
}

export async function updateSighting(
	id: string,
	data: Partial<Omit<Sighting, 'id' | 'createdAt' | 'userId'>>
): Promise<Sighting> {
	await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        ...data,
        id: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Sighting;
}

export async function deleteSighting(id: string): Promise<{ success: boolean }> {
	await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true };
}
