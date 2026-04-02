<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { sightings } from '$lib/stores/sightings';
	import { sightingsService } from '$lib/services/sightings';
	import { Timestamp } from '$lib/utils/timestamp';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let sighting = $state<Sighting | null>(null);
	let imageUrl = $state<string | null>(null);

	function getImageFromSighting(item: Sighting): string | null {
		const imageList = item.images as unknown;
		if (Array.isArray(imageList) && imageList.length > 0) {
			const first = imageList[0] as unknown;
			if (typeof first === 'string') return first;
			if (first && typeof first === 'object' && 'url' in first && typeof first.url === 'string') {
				return first.url;
			}
		}
		const withUrl = item as Sighting & { imageUrl?: string };
		return withUrl.imageUrl ?? null;
	}

	function formatCoordinates(lat: number, lon: number): string {
		const latDir = lat >= 0 ? 'N' : 'S';
		const lonDir = lon >= 0 ? 'E' : 'W';
		return `${Math.abs(lat).toFixed(6)}\u00B0 ${latDir}, ${Math.abs(lon).toFixed(6)}\u00B0 ${lonDir}`;
	}

	onMount(async () => {
		const id = $page.params.id;

		// Try the store first (offline-first / PWA)
		const storeState = $sightings;
		const cached = storeState.sightings.find((s) => s.id === id);

		if (cached) {
			sighting = cached;
			imageUrl = getImageFromSighting(cached);
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

			if (data.has_image) {
				imageUrl = data.image_url ?? null;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sighting';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{sighting ? sighting.species : 'Sighting'} - Animal Identifier</title>
</svelte:head>

<section class="detail-page">
	<nav class="back-nav">
		<a href="/dashboard" class="back-link">← Back to Dashboard</a>
	</nav>

	{#if loading}
		<div class="loading-state">
			<p>Loading sighting...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<a href="/dashboard" class="back-btn">Back to Dashboard</a>
		</div>
	{:else if sighting}
		<article class="sighting-detail">
			{#if imageUrl}
				<div class="image-section">
					<img
						class="sighting-image"
						src={imageUrl}
						alt={`Photo of ${sighting.species}`}
						loading="lazy"
					/>
				</div>
			{/if}

			<div class="info-section">
				<h1 class="species-name">{sighting.species}</h1>

				{#if sighting.description}
					<div class="detail-field">
						<span class="field-label">Location</span>
						<p class="field-value">{sighting.description}</p>
					</div>
				{/if}

				<div class="detail-field">
					<span class="field-label">Coordinates</span>
					<p class="field-value coordinates">{formatCoordinates(sighting.latitude, sighting.longitude)}</p>
				</div>

				<div class="detail-field">
					<span class="field-label">Spotted</span>
					<p class="field-value">{Timestamp.formatForDisplay(new Date(sighting.createdAt))}</p>
				</div>

				{#if sighting.updatedAt}
					<div class="detail-field">
						<span class="field-label">Last updated</span>
						<p class="field-value">{Timestamp.formatForDisplay(new Date(sighting.updatedAt))}</p>
					</div>
				{/if}

				{#if sighting.syncStatus && sighting.syncStatus !== 'SYNCED'}
					<span class="sync-badge {sighting.syncStatus.toLowerCase()}">
						{sighting.syncStatus === 'PENDING' ? 'Pending sync' : ''}
						{sighting.syncStatus === 'FAILED' ? 'Sync failed' : ''}
						{sighting.syncStatus === 'OFFLINE' ? 'Offline' : ''}
						{sighting.syncStatus === 'SYNCING' ? 'Syncing...' : ''}
					</span>
				{/if}

				<div class="actions">
					<a class="edit-btn" href={`/sighting/${sighting.id}/edit`}>Edit Sighting</a>
				</div>
			</div>
		</article>
	{:else}
		<div class="error-state">
			<div class="empty-icon" aria-hidden="true">🔍</div>
			<h2>Sighting not found</h2>
			<p>This sighting may have been deleted or doesn't exist.</p>
			<a href="/dashboard" class="back-btn">Back to Dashboard</a>
		</div>
	{/if}
</section>

<nav class="mobile-bottom-bar">
	<a href="/dashboard" class="mobile-back-btn">← Dashboard</a>
</nav>

<style>
	.detail-page {
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
		margin: 0;
	}

	.empty-icon {
		display: grid;
		place-items: center;
		width: 82px;
		height: 82px;
		border-radius: 999px;
		background: #b7efda;
		font-size: 1.7rem;
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

	.sighting-detail {
		background: #f4f5f7;
		border: 1px solid #7ce3ba;
		border-radius: 0.9rem;
		overflow: hidden;
		max-width: 600px;
		margin: 0 auto;
	}

	.image-section {
		width: 100%;
		background: #e7f3ee;
		border-bottom: 1px solid #cceede;
	}

	.sighting-image {
		width: 100%;
		max-height: 400px;
		object-fit: cover;
		display: block;
	}

	.info-section {
		padding: 1.25rem;
		display: grid;
		gap: 1rem;
	}

	.species-name {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: #065f46;
	}

	.detail-field {
		display: grid;
		gap: 0.15rem;
	}

	.field-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.field-value {
		margin: 0;
		font-size: 1.05rem;
		color: #374151;
	}

	.coordinates {
		font-family: monospace;
		font-size: 0.95rem;
	}

	.sync-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		border: 1px solid transparent;
		width: fit-content;
	}

	.sync-badge.pending,
	.sync-badge.syncing {
		background: #fff7e8;
		color: #835500;
		border-color: #f6da9b;
	}

	.sync-badge.failed,
	.sync-badge.offline {
		background: #fff1f1;
		color: #8f1f17;
		border-color: #ffd4d1;
	}

	.actions {
		margin-top: 0.5rem;
	}

	.edit-btn {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		border: 1px solid #7ce3ba;
		color: #047857;
		border-radius: 0.6rem;
		padding: 0.65rem 1rem;
		font-weight: 600;
		font-size: 1rem;
		text-align: center;
		box-sizing: border-box;
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

		.detail-page {
			padding-bottom: 5rem;
		}

		.back-nav {
			display: none;
		}
	}

	@media (min-width: 720px) {
		.detail-page {
			padding: 1rem 2rem 2rem;
		}

		.sighting-detail {
			max-width: 600px;
		}

		.sighting-image {
			max-height: 450px;
		}

		.species-name {
			font-size: 2.25rem;
		}
	}

	@media (max-width: 480px) {
		.detail-page {
			padding: 0.5rem 0.75rem 1.5rem;
		}

		.info-section {
			padding: 1rem;
		}

		.species-name {
			font-size: 1.75rem;
		}

		.sighting-image {
			max-height: 280px;
		}
	}
</style>
