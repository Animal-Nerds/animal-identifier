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
		await goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Edit sighting - Animal Identifier</title>
	<meta name="description" content="Edit your animal sighting details" />
</svelte:head>

<section class="edit-page">
	{#if !loading}
	<nav class="back-nav">
		<a href="/dashboard" class="back-link">
			<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
			</svg>
			Back to Dashboard
		</a>
	</nav>
	{/if}

	{#if loading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading sighting...</p>
		</div>
	{:else if loadError}
		<div class="error-state">
			<div class="error-card">
				<svg class="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
				</svg>
				<p>{loadError}</p>
			</div>
			<a href="/dashboard" class="back-btn">Back to Dashboard</a>
		</div>
	{:else if sighting}
		<div class="form-card">
			<h1>Edit Sighting</h1>
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
		</div>
	{/if}
</section>

<style>
	.edit-page {
		width: calc(100% + 2rem);
		margin: -1rem;
		min-height: calc(100vh - 80px);
		min-height: calc(100dvh - 80px);
		background: linear-gradient(180deg, #d8e5df 0%, #e8f0ec 100%);
		padding: 1.25rem 1.5rem 2rem;
		box-sizing: border-box;
	}

	.back-nav {
		margin-bottom: 1rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: #047857;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition: color 0.15s;
	}

	.back-link:hover {
		color: #065f46;
	}

	.back-link svg {
		width: 1rem;
		height: 1rem;
	}

	/* Loading */
	.loading-state {
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.loading-state p {
		margin: 0;
		color: #374151;
		font-size: 0.95rem;
	}

	.loading-spinner {
		width: 36px;
		height: 36px;
		border: 3px solid #d1fae5;
		border-top-color: #047857;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Error */
	.error-state {
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem 1rem;
	}

	.error-card {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		max-width: 400px;
	}

	.error-card p {
		margin: 0;
		color: #991b1b;
		font-size: 0.9rem;
	}

	.error-icon {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
		margin-top: 0.1rem;
		color: #dc2626;
	}

	.back-btn {
		text-decoration: none;
		background: #047857;
		color: white;
		padding: 0.6rem 1.25rem;
		border-radius: 0.65rem;
		font-weight: 600;
		font-size: 0.9rem;
		box-shadow: 0 4px 14px rgba(4, 120, 87, 0.2);
		transition: background 0.15s;
	}

	.back-btn:hover {
		background: #065f46;
	}

	/* Form card */
	.form-card {
		background: white;
		border: 1px solid rgba(124, 227, 186, 0.5);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 500px;
		margin: 0 auto;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04);
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 800;
		color: #064e3b;
		margin: 0 0 1.25rem;
		letter-spacing: -0.02em;
	}

	@media (max-width: 480px) {
		.edit-page {
			padding: 0.75rem 1rem 1.5rem;
		}

		.form-card {
			padding: 1.15rem;
		}
	}

	@media (min-width: 720px) {
		.edit-page {
			padding: 1.25rem 2rem 2rem;
		}
	}
</style>
