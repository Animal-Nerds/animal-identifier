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
    <br />
    <button onclick={createSighting}>Create Sighting</button>
    <br />
    <button onclick={() => console.log(sightings.getAllSightings())}>List Sightings</button>
</center>