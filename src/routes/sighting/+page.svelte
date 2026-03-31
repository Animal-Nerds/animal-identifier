<script lang="ts">
	import { goto } from '$app/navigation';
	import SightingForm from '$lib/components/SightingForm.svelte';
	import { sightings } from '$lib/stores/sightings';

	async function handleCreate(data: CreateSightingInput) {
		await sightings.add({
			userId: '',
			species: data.species,
			description: data.description,
			latitude: data.latitude,
			longitude: data.longitude,
			images: data.images.map((url) => ({ id: '', sightingId: '', url, createdAt: '' }))
		});
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>New Sighting - Animal Identifier</title>
</svelte:head>

<div class="page">
	<h1>New Sighting</h1>
	<SightingForm action={handleCreate} />
</div>

<style>
	.page {
		max-width: 500px;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0 0 1.25rem;
	}
</style>
