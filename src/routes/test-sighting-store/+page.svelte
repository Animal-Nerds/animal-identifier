<script>
    import { sightings } from '$lib/stores/sightings';

</script>

<svelte:head>
	<title>Test Sighting Store - Animal Identifier</title>
</svelte:head>

<center>
    <br />
    <button onclick={() => console.log(sightings)}>List Sightings</button>
</center>