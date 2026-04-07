<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SightingForm from '$lib/components/SightingForm.svelte';
	import { sightings } from '$lib/stores/sightings';
	import { sightingsService } from '$lib/services/sightings';

	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let sighting = $state<Sighting | null>(null);

	function imagesToStrings(s: Sighting): string[] {
		const list = s.images as unknown;
		if (!Array.isArray(list)) return [];
		return list
			.map((item) => {
				if (typeof item === 'string') return item;
				if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
					return item.url;
				}
				return '';
			})
			.filter(Boolean);
	}

	onMount(async () => {
		const id = $page.params.id;
		if (!id) {
			loadError = 'Missing sighting id';
			loading = false;
			return;
		}

		await sightings.init();
		const fromStore = sightings.getAllSightings().find((s) => s.id === id);
		if (fromStore) {
			sighting = fromStore;
			loading = false;
			return;
		}

		try {
			const data = await sightingsService.getSightingById(id);
			const img =
				typeof data.image_url === 'string' && data.image_url
					? [data.image_url]
					: [];
			sighting = {
				id: data.id,
				userId: '',
				species: data.animal_name,
				description: data.location ?? undefined,
				latitude: data.latitude ?? 0,
				longitude: data.longitude ?? 0,
				createdAt: data.created_at,
				updatedAt: data.updated_at,
				images: img.map((url) => ({
					id: '',
					sightingId: data.id,
					url,
					createdAt: new Date().toISOString()
				})),
				syncStatus: 'SYNCED' as SyncStatus
			};
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Failed to load sighting';
		} finally {
			loading = false;
		}
	});

	async function handleUpdate(sightingId: string, data: CreateSightingInput) {
		await sightings.update(sightingId, {
			species: data.species,
			description: data.description,
			latitude: data.latitude,
			longitude: data.longitude,
			images: data.images.map((url) => ({
				id: '',
				sightingId: sightingId,
				url,
				createdAt: new Date().toISOString()
			}))
		});
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Edit sighting - Animal Identifier</title>
</svelte:head>

<div class="page">
	<h1>Edit Sighting</h1>

	{#if loading}
		<p class="status">Loading…</p>
	{:else if loadError}
		<p class="error">{loadError}</p>
		<a href="/dashboard" class="back">Back to dashboard</a>
	{:else if sighting}
		<SightingForm
			id={sighting.id}
			initialValues={{
				species: sighting.species,
				description: sighting.description ?? '',
				latitude: sighting.latitude,
				longitude: sighting.longitude,
				images: imagesToStrings(sighting)
			}}
			action={handleUpdate}
		/>
	{/if}
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

	.status {
		color: #4b5563;
	}

	.error {
		color: #b42318;
	}

	.back {
		display: inline-block;
		margin-top: 0.75rem;
		color: #047857;
		font-weight: 600;
	}
</style>
