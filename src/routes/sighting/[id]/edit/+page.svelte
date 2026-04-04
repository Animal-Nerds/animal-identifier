<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { sightings } from '$lib/stores/sightings';
	import { sightingsService } from '$lib/services/sightings';
	import SightingForm from '$lib/components/SightingForm.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let sighting = $state<Sighting | null>(null);
	let existingImages = $state<string[]>([]);

	function extractImages(item: Sighting): string[] {
		const imageList = item.images as unknown;
		if (Array.isArray(imageList)) {
			return imageList
				.map((img: unknown) => {
					if (typeof img === 'string') return img;
					if (img && typeof img === 'object' && 'url' in img && typeof img.url === 'string') {
						return img.url;
					}
					return null;
				})
				.filter((url): url is string => url !== null);
		}
		const withUrl = item as Sighting & { imageUrl?: string };
		return withUrl.imageUrl ? [withUrl.imageUrl] : [];
	}

	onMount(async () => {
		const id = $page.params.id;
		if (!id) { loading = false; return; }

		// Offline-first: check the store first
		const storeState = $sightings;
		const cached = storeState.sightings.find((s) => s.id === id);

		if (cached) {
			sighting = cached;
			existingImages = extractImages(cached);
			loading = false;
			return;
		}

		// Fall back to API
		try {
			const data = await sightingsService.getSightingById(id);
			sighting = {
				id: data.id,
				userId: '',
				species: data.animal_name,
				description: data.location ?? undefined,
				latitude: data.latitude,
				longitude: data.longitude,
				createdAt: data.created_at,
				updatedAt: data.updated_at,
				images: [],
				syncStatus: 'SYNCED' as SyncStatus
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sighting';
		} finally {
			loading = false;
		}
	});

	async function handleUpdate(id: string, input: CreateSightingInput) {
		error = null;
		try {
			await sightings.update(id, {
				species: input.species,
				description: input.description,
				latitude: input.latitude,
				longitude: input.longitude,
				images: input.images.map((url) => ({ id: '', sightingId: id, url, createdAt: '' }))
			});
			await goto('/dashboard');
		} catch (err) {
			if (err instanceof Error && err.message.includes('400')) {
				error = 'Validation failed. Please check your input.';
			} else {
				error = err instanceof Error ? err.message : 'Failed to update sighting';
			}
		}
	}
</script>

<svelte:head>
	<title>{sighting ? `Edit ${sighting.species}` : 'Edit Sighting'} - Animal Identifier</title>
</svelte:head>

<section class="edit-page">
	<nav class="back-nav">
		<a href={sighting ? `/sighting/${sighting.id}` : '/dashboard'} class="back-link">← Back</a>
	</nav>

	{#if loading}
		<div class="loading-state">
			<p>Loading sighting...</p>
		</div>
	{:else if error && !sighting}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<a href="/dashboard" class="back-btn">Back to Dashboard</a>
		</div>
	{:else if sighting}
		<div class="form-container">
			<h1>Edit Sighting</h1>

			{#if error}
				<p class="error-message">{error}</p>
			{/if}

			<SightingForm
				id={sighting.id}
				action={handleUpdate}
				initialSpecies={sighting.species}
				initialDescription={sighting.description ?? ''}
				initialLatitude={sighting.latitude}
				initialLongitude={sighting.longitude}
				initialImages={existingImages}
			/>
		</div>
	{:else}
		<div class="error-state">
			<h2>Sighting not found</h2>
			<p>This sighting may have been deleted or doesn't exist.</p>
			<a href="/dashboard" class="back-btn">Back to Dashboard</a>
		</div>
	{/if}
</section>

<nav class="mobile-bottom-bar">
	<a href={sighting ? `/sighting/${sighting.id}` : '/dashboard'} class="mobile-back-btn">← Back</a>
</nav>

<style>
	.edit-page {
		width: calc(100% + 2rem);
		margin: -1rem;
		min-height: calc(100vh - 80px);
		background: #d8e5df;
		padding: 0.75rem 1rem 2rem;
		box-sizing: border-box;
	}

	.back-nav {
		margin-bottom: 0.75rem;
	}

	.back-link {
		color: #047857;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.loading-state {
		min-height: 300px;
		display: grid;
		place-items: center;
		color: #4b5563;
		font-size: 1rem;
	}

	.error-state {
		min-height: 300px;
		display: grid;
		place-items: center;
		text-align: center;
		gap: 0.65rem;
		padding: 2rem 1rem;
	}

	.error-state h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #374151;
	}

	.error-state p {
		margin: 0;
		color: #6b7280;
	}

	.error-message {
		color: #b42318;
		background: #fff1f1;
		border: 1px solid #ffd5d2;
		border-radius: 0.5rem;
		padding: 0.65rem 0.75rem;
		margin: 0 0 0.5rem;
	}

	.back-btn {
		text-decoration: none;
		background: #047857;
		color: white;
		padding: 0.55rem 1.2rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.form-container {
		background: #f4f5f7;
		border: 1px solid #7ce3ba;
		border-radius: 0.9rem;
		padding: 1.25rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.form-container h1 {
		margin: 0 0 1rem;
		font-size: 1.75rem;
		font-weight: 700;
		color: #065f46;
	}

	.mobile-bottom-bar {
		display: none;
	}

	@media (max-width: 719px) {
		.mobile-bottom-bar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			padding: 0.65rem 1rem;
			padding-bottom: calc(0.65rem + env(safe-area-inset-bottom));
			background: #f4f5f7;
			border-top: 1px solid #7ce3ba;
			z-index: 50;
		}

		.mobile-back-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			background: #047857;
			color: white;
			text-decoration: none;
			padding: 0.75rem;
			border-radius: 0.6rem;
			font-weight: 600;
			font-size: 1rem;
		}

		.edit-page {
			padding-bottom: 5rem;
		}

		.back-nav {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.edit-page {
			padding: 0.5rem 0.75rem 1.5rem;
		}

		.form-container {
			padding: 1rem;
		}

		.form-container h1 {
			font-size: 1.5rem;
		}
	}
</style>
