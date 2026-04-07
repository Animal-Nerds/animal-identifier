<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { sightings } from '$lib/stores/sightings';
	import { sightingsService } from '$lib/services/sightings';
	import { Timestamp } from '$lib/utils/timestamp';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let sighting = $state<Sighting | null>(null);
	let imageUrl = $state<string | null>(null);
	let isDeleting = $state(false);
	let deleteError = $state<string | null>(null);

	const syncLabelMap: Record<string, string> = {
		PENDING: 'Pending sync',
		SYNCING: 'Syncing...',
		FAILED: 'Sync failed',
		OFFLINE: 'Offline'
	};

	async function handleDelete() {
		if (!sighting) return;
		const confirmed = window.confirm('Are you sure you want to delete this sighting? This cannot be undone.');
		if (!confirmed) return;

		isDeleting = true;
		deleteError = null;
		try {
			await sightings.remove(sighting.id);
			await goto('/dashboard');
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete sighting';
			isDeleting = false;
		}
	}

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
		if (!id) { loading = false; return; }

		const storeState = $sightings;
		const cached = storeState.sightings.find((s) => s.id === id);

		if (cached) {
			sighting = cached;
			imageUrl = getImageFromSighting(cached);
			loading = false;
			return;
		}

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
				imageUrl = data.image_url ?? await sightingsService.getSightingImage(id);
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
	<meta name="description" content={sighting ? `Details for ${sighting.species} sighting` : 'View sighting details'} />
</svelte:head>

<section class="detail-page">
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
	{:else if error}
		<div class="error-state">
			<div class="error-card">
				<svg class="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
				</svg>
				<p>{error}</p>
			</div>
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
				<div class="info-header">
					<h1 class="species-name">{sighting.species}</h1>
					{#if sighting.syncStatus && sighting.syncStatus !== 'SYNCED'}
						<span class="sync-badge {sighting.syncStatus.toLowerCase()}">
							{syncLabelMap[sighting.syncStatus] ?? sighting.syncStatus}
						</span>
					{/if}
				</div>

				<div class="fields-grid">
					{#if sighting.description}
						<div class="detail-field">
							<div class="field-icon">
								<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
								</svg>
							</div>
							<div>
								<span class="field-label">Description</span>
								<p class="field-value">{sighting.description}</p>
							</div>
						</div>
					{/if}

					<div class="detail-field">
						<div class="field-icon">
							<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
							</svg>
						</div>
						<div>
							<span class="field-label">Coordinates</span>
							<p class="field-value coordinates">{formatCoordinates(sighting.latitude, sighting.longitude)}</p>
						</div>
					</div>

					<div class="detail-field">
						<div class="field-icon">
							<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" />
							</svg>
						</div>
						<div>
							<span class="field-label">Spotted</span>
							<p class="field-value">{Timestamp.formatForDisplay(new Date(sighting.createdAt))}</p>
						</div>
					</div>

					{#if sighting.updatedAt}
						<div class="detail-field">
							<div class="field-icon">
								<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.06-.18zm-1.624-7.848a7 7 0 00-11.712 3.138.75.75 0 001.06.18 5.5 5.5 0 019.201-2.466l.312.311H10.116a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V1.855a.75.75 0 00-1.5 0v2.033l-.312-.312z" clip-rule="evenodd" />
								</svg>
							</div>
							<div>
								<span class="field-label">Last updated</span>
								<p class="field-value">{Timestamp.formatForDisplay(new Date(sighting.updatedAt))}</p>
							</div>
						</div>
					{/if}
				</div>

				{#if deleteError}
					<div class="delete-error" role="alert">
						<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
						</svg>
						<p>{deleteError}</p>
					</div>
				{/if}

				<div class="actions">
					<a class="edit-btn" href={`/sighting/${sighting.id}/edit`}>
						<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
						</svg>
						Edit Sighting
					</a>
					<button
						class="delete-btn"
						onclick={handleDelete}
						disabled={isDeleting}
						aria-label="Delete sighting"
					>
						{#if isDeleting}
							<div class="delete-spinner"></div>
							Deleting...
						{:else}
							<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.5.12l-.5-6a.75.75 0 01.72-.78zm2.84 0a.75.75 0 01.72.78l-.5 6a.75.75 0 11-1.5-.12l.5-6a.75.75 0 01.78-.72z" clip-rule="evenodd" />
							</svg>
							Delete Sighting
						{/if}
					</button>
				</div>
			</div>
		</article>
	{:else}
		<div class="not-found-state">
			<div class="not-found-icon" aria-hidden="true">
				<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="20" cy="20" r="14" />
					<path d="M30 30l12 12" stroke-linecap="round" />
					<path d="M15 17h10M15 23h6" stroke-linecap="round" />
				</svg>
			</div>
			<h2>Sighting not found</h2>
			<p>This sighting may have been deleted or doesn't exist.</p>
			<a href="/dashboard" class="back-btn">Back to Dashboard</a>
		</div>
	{/if}
</section>

{#if !loading && sighting}
<nav class="mobile-bottom-bar">
	<a href="/dashboard" class="mobile-back-btn" aria-label="Back to dashboard">
		<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
		</svg>
	</a>
	<a class="mobile-edit-btn" href={`/sighting/${sighting.id}/edit`}>
		<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
		</svg>
		Edit
	</a>
	<button
		class="mobile-delete-btn"
		onclick={handleDelete}
		disabled={isDeleting}
		aria-label="Delete sighting"
	>
		<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.5.12l-.5-6a.75.75 0 01.72-.78zm2.84 0a.75.75 0 01.72.78l-.5 6a.75.75 0 11-1.5-.12l.5-6a.75.75 0 01.78-.72z" clip-rule="evenodd" />
		</svg>
		{isDeleting ? '...' : 'Delete'}
	</button>
</nav>
{/if}

<style>
	.detail-page {
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

	/* Not found */
	.not-found-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		min-height: 320px;
		padding: 2rem 1rem;
	}

	.not-found-icon {
		width: 72px;
		height: 72px;
		border-radius: 999px;
		background: linear-gradient(135deg, #d1fae5, #a7f3d0);
		display: grid;
		place-items: center;
		margin-bottom: 0.5rem;
	}

	.not-found-icon svg {
		width: 36px;
		height: 36px;
		color: #065f46;
	}

	.not-found-state h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.not-found-state p {
		margin: 0;
		color: #4b5563;
		font-size: 0.95rem;
	}

	/* Detail card */
	.sighting-detail {
		background: white;
		border: 1px solid rgba(124, 227, 186, 0.5);
		border-radius: 1rem;
		overflow: hidden;
		max-width: 600px;
		margin: 0 auto;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04);
	}

	.image-section {
		width: 100%;
		background: linear-gradient(135deg, #ecfdf5, #d1fae5);
		border-bottom: 1px solid #e5e7eb;
	}

	.sighting-image {
		width: 100%;
		max-height: 400px;
		object-fit: cover;
		display: block;
	}

	.info-section {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.info-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.species-name {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 800;
		color: #064e3b;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	/* Fields */
	.fields-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail-field {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.field-icon {
		width: 32px;
		height: 32px;
		border-radius: 0.5rem;
		background: #f0fdf4;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.field-icon svg {
		width: 16px;
		height: 16px;
		color: #047857;
	}

	.field-label {
		font-size: 0.72rem;
		font-weight: 700;
		color: #4b5563;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field-value {
		margin: 0.1rem 0 0;
		font-size: 0.95rem;
		color: #1f2937;
		line-height: 1.45;
	}

	.coordinates {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.88rem;
	}

	/* Sync badge */
	.sync-badge {
		font-size: 0.68rem;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		border: 1px solid transparent;
		white-space: nowrap;
		font-weight: 600;
		flex-shrink: 0;
	}

	.sync-badge.pending,
	.sync-badge.syncing {
		background: #fffbeb;
		color: #92400e;
		border-color: #fde68a;
	}

	.sync-badge.failed,
	.sync-badge.offline {
		background: #fef2f2;
		color: #991b1b;
		border-color: #fecaca;
	}

	/* Delete error */
	.delete-error {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.65rem;
		padding: 0.75rem 1rem;
	}

	.delete-error svg {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		margin-top: 0.15rem;
		color: #dc2626;
	}

	.delete-error p {
		margin: 0;
		color: #991b1b;
		font-size: 0.9rem;
	}

	/* Actions */
	.actions {
		display: flex;
		gap: 0.65rem;
		margin-top: 0.25rem;
	}

	.edit-btn {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		border: 1px solid #d1fae5;
		background: #f0fdf4;
		color: #047857;
		border-radius: 0.65rem;
		padding: 0.7rem 1rem;
		font-weight: 600;
		font-size: 0.9rem;
		transition: background 0.15s, border-color 0.15s;
	}

	.edit-btn:hover {
		background: #dcfce7;
		border-color: #a7f3d0;
	}

	.edit-btn svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	.delete-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		background: white;
		color: #dc2626;
		border: 1px solid #fecaca;
		border-radius: 0.65rem;
		padding: 0.7rem 1rem;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.delete-btn:hover {
		background: #fef2f2;
		border-color: #fca5a5;
	}

	.delete-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.delete-btn svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	.delete-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid #fecaca;
		border-top-color: #dc2626;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	/* Mobile bottom bar */
	.mobile-bottom-bar {
		display: none;
	}

	@media (max-width: 719px) {
		.mobile-bottom-bar {
			display: flex;
			gap: 0.5rem;
			padding: 1rem;
			padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		}

		.mobile-back-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.3rem;
			background: #f3f4f6;
			color: #374151;
			text-decoration: none;
			padding: 0.7rem;
			border-radius: 0.65rem;
			font-weight: 600;
			font-size: 0.85rem;
		}

		.mobile-back-btn--full {
			width: 100%;
			background: #047857;
			color: white;
		}

		.mobile-back-btn svg {
			width: 1rem;
			height: 1rem;
		}

		.mobile-edit-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.3rem;
			flex: 1;
			background: #f0fdf4;
			color: #047857;
			text-decoration: none;
			padding: 0.7rem;
			border-radius: 0.65rem;
			font-weight: 600;
			font-size: 0.85rem;
			border: 1px solid #d1fae5;
		}

		.mobile-edit-btn svg {
			width: 0.85rem;
			height: 0.85rem;
		}

		.mobile-delete-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.3rem;
			background: white;
			color: #dc2626;
			padding: 0.7rem;
			border-radius: 0.65rem;
			font-weight: 600;
			font-size: 0.85rem;
			border: 1px solid #fecaca;
			cursor: pointer;
		}

		.mobile-delete-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		.mobile-delete-btn svg {
			width: 0.85rem;
			height: 0.85rem;
		}

		.actions {
			display: none;
		}

		.detail-page {
			padding-bottom: 0;
		}

		.back-nav {
			display: none;
		}
	}

	@media (min-width: 720px) {
		.detail-page {
			padding: 1.25rem 2rem 2rem;
		}

		.sighting-image {
			max-height: 450px;
		}

		.species-name {
			font-size: 2rem;
		}
	}

	@media (max-width: 480px) {
		.detail-page {
			padding: 0.75rem 1rem 1.5rem;
		}

		.info-section {
			padding: 1.15rem;
		}

		.species-name {
			font-size: 1.5rem;
		}

		.sighting-image {
			max-height: 280px;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
