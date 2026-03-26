<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getGeolocation } from '$lib/utils/gps';
    import { Timestamp } from '$lib/utils/timestamp';
    import { compressImage } from '$lib/utils/image-compression';
    import { VALIDATION } from '$lib/utils/constants';
    import { validateSightingObject } from '$lib/utils/validation';

    let species = $state('');
    let description = $state('');
    let latitude = $state('');
    let longitude = $state('');
    let seenAt = $state('');
    let imageDataUrl = $state('');
    let imagePreview = $state('');

    let loadind = $state(false);
    let gpsLoading = $state(true);
    let error = $state('');
    let success = $state('');

    onMount(async () => {
        seenAt = Timestamp.toISO(new Date());

        const geo = await getGeolocation();
        if (geo) {
            latitude = String(geo.latitude);
            longitude = String(geo.longitude);
        }
        gpsLoading = false;
    });

async function onPickImage(event: Event) {
    error = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
        const compressed = await compressImage(file);
        imageDataUrl = compressed;
        imagePreview = compressed;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to process image';
    }
}

function validateForm(): boolean {
    const { errors, valid } = validateSightingObject({
        species,
        description,
        latitude: Number(latitude),
        longitude: Number(longitude),
        sightedAt: new Date(seenAt),
        imageUrl: imageDataUrl,
    } as Sighting);
    return valid;
}
</script>

<div class="flex flex-col gap-4" style="width: 100%; max-width: 600px; margin: 2rem auto;">
    <h1 class="text-2xl font-bold">Sighting</h1>

    <form class="flex flex-col gap-4" on:submit|preventDefault={validateForm}>
        <label for="species">Species</label>
        <input id="species" type="text" bind:value={species} class="border p-2 rounded" placeholder="Enter species" />

        <div class="location">
            <button type="button" on:click={getGeolocation} class="text-gray p-2 rounded border">Use Current Location</button>
            <div style="display: flex; width: 100%; margin-top: 0.5rem; justify-content: space-between; gap: 0.5rem;">
                <label for="latitude">Latitude
                    <input id="latitude" type="text" bind:value={latitude} class="border p-2 rounded" placeholder="Enter latitude" />
                </label>
    
                <label for="longitude">Longitude
                    <input id="longitude" type="text" bind:value={longitude} class="border p-2 rounded" placeholder="Enter longitude" />
                </label>
            </div>
        </div>
    </form>

</div>




<style>
    .location {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .location label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
    }
</style>