<script lang="ts">
	let {
		sighting,
		isDeleting = false,
		onDelete
	}: {
		sighting: Sighting;
		isDeleting?: boolean;
		onDelete: (id: string) => void;
	} = $props();

	const syncLabelMap: Record<SyncStatus, string> = {
		PENDING: 'Pending sync',
		SYNCING: 'Syncing',
		SYNCED: 'Synced',
		FAILED: 'Sync failed',
		OFFLINE: 'Offline'
	};

	const syncClassMap: Record<SyncStatus, string> = {
		PENDING: 'pending',
		SYNCING: 'syncing',
		SYNCED: 'synced',
		FAILED: 'failed',
		OFFLINE: 'offline'
	};

	function formatDate(dateLike: string): string {
		const date = new Date(dateLike);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function formatCardCoordinates(latitude: number, longitude: number): string {
		const latDirection = latitude >= 0 ? 'N' : 'S';
		const lngDirection = longitude >= 0 ? 'E' : 'W';
		return `${Math.abs(latitude).toFixed(4)}° ${latDirection}, ${Math.abs(longitude).toFixed(4)}° ${lngDirection}`;
	}

	function getImageUrl(item: Sighting): string | null {
		const imageList = item.images as unknown;
		if (Array.isArray(imageList) && imageList.length > 0) {
			const first = imageList[0] as unknown;
			if (typeof first === 'string') return first;
			if (first && typeof first === 'object' && 'url' in first && typeof first.url === 'string') {
				return first.url;
			}
		}

		const withPossibleUrl = item as Sighting & { imageUrl?: string; image_url?: string };
		return withPossibleUrl.imageUrl ?? withPossibleUrl.image_url ?? null;
	}

	const imageUrl = $derived(getImageUrl(sighting));
</script>

<li class="sighting-card" class:has-image={!!imageUrl}>
	<a class="card-link" href={`/sighting/${sighting.id}`}>
		{#if imageUrl}
			<div class="image-wrap">
				<img class="sighting-image" src={imageUrl} alt={`Photo of ${sighting.species}`} loading="lazy" />
			</div>
		{/if}

		<div class="card-body">
			<div class="card-header">
				<h2>{sighting.species}</h2>
				<span class="sync-badge {syncClassMap[sighting.syncStatus]}">
					{syncLabelMap[sighting.syncStatus]}
				</span>
			</div>

			<div class="meta-row">
				<span class="meta-item">
					<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
					</svg>
					{formatCardCoordinates(sighting.latitude, sighting.longitude)}
				</span>
				<span class="meta-item">
					<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" />
					</svg>
					{formatDate(sighting.createdAt)}
				</span>
			</div>

			{#if sighting.description}
				<p class="description">{sighting.description}</p>
			{/if}
		</div>
	</a>

	<div class="actions-row">
		<a class="edit-btn" href={`/sighting/${sighting.id}/edit`}>Edit</a>
		<button
			class="delete-btn"
			type="button"
			aria-label="Delete sighting"
			disabled={isDeleting}
			onclick={() => onDelete(sighting.id)}
		>
			{#if isDeleting}
				<div class="delete-spinner"></div>
			{:else}
				<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.5.12l-.5-6a.75.75 0 01.72-.78zm2.84 0a.75.75 0 01.72.78l-.5 6a.75.75 0 11-1.5-.12l.5-6a.75.75 0 01.78-.72z" clip-rule="evenodd" />
				</svg>
			{/if}
		</button>
	</div>
</li>

<style>
	.sighting-card {
		border: 1px solid rgba(124, 227, 186, 0.5);
		border-radius: 1rem;
		background: white;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
		transition: box-shadow 0.2s, transform 0.15s;
		display: flex;
		flex-direction: column;
	}

	.sighting-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
		transform: translateY(-2px);
	}

	.card-link {
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.image-wrap {
		width: 100%;
		overflow: hidden;
		background: linear-gradient(135deg, #ecfdf5, #d1fae5);
	}

	.sighting-image {
		width: 100%;
		height: 180px;
		object-fit: cover;
		display: block;
	}

	.card-body {
		padding: 1rem 1.1rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.card-header h2 {
		margin: 0;
		font-size: 1.2rem;
		color: #064e3b;
		font-weight: 700;
		line-height: 1.3;
	}

	.meta-row {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #4b5563;
	}

	.meta-item svg {
		width: 0.85rem;
		height: 0.85rem;
		color: #6b7280;
		flex-shrink: 0;
	}

	.description {
		margin: 0;
		font-size: 0.85rem;
		color: #4b5563;
		line-height: 1.45;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.1rem;
		border-top: 1px solid #f3f4f6;
	}

	.edit-btn {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		color: #047857;
		border: 1px solid #d1fae5;
		background: #f0fdf4;
		border-radius: 0.5rem;
		padding: 0.45rem 0.75rem;
		font-weight: 600;
		font-size: 0.82rem;
		transition: background 0.15s, border-color 0.15s;
	}

	.edit-btn:hover {
		background: #dcfce7;
		border-color: #a7f3d0;
	}

	.delete-btn {
		border: 1px solid #fee2e2;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 0.5rem;
		padding: 0.4rem 0.55rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.delete-btn:hover {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	.delete-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.delete-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.delete-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid #fecaca;
		border-top-color: #dc2626;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.sync-badge {
		font-size: 0.68rem;
		padding: 0.18rem 0.5rem;
		border-radius: 999px;
		border: 1px solid transparent;
		white-space: nowrap;
		font-weight: 600;
		letter-spacing: 0.01em;
		flex-shrink: 0;
	}

	.sync-badge.synced {
		background: #ecfdf5;
		color: #065f46;
		border-color: #a7f3d0;
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

	@media (max-width: 480px) {
		.sighting-image {
			height: 150px;
		}

		.card-body {
			padding: 0.85rem 0.9rem 0.4rem;
		}

		.actions-row {
			padding: 0.55rem 0.9rem;
		}
	}
</style>
