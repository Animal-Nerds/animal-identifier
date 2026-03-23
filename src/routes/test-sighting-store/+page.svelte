<script>
    import { sightings } from '$lib/stores/sightings';

    function createSighting() {
        sightings.add({
            userId: '123e4567-e89b-12d3-a456-426614174000',
            species: 'Bald Eagle',
            description: 'Spotted near the river',
            latitude: 45.123456,
            longitude: -122.123456,
            images: []
        });
    }
</script>

<svelte:head>
	<title>Test Sighting Store - Animal Identifier</title>
</svelte:head>

<center>
    <button onclick={createSighting}>Create Sighting</button>
    <button onclick={sightings.syncPendingAndReload}>Sync Pending Changes</button>
    <button onclick={() => console.log(sightings.getAllSightings())}>List Sightings</button>
</center>

<style>
    center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80vh;
        gap: 1rem;
    }
    button {
        padding: 10px 20px;
        font-size: 16px;
        margin: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
</style>