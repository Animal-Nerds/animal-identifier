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
		return `${Math.abs(latitude).toFixed(6)}° ${latDirection}, ${Math.abs(longitude).toFixed(6)}° ${lngDirection}`;
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

<li class="sighting-card">
	<a class="card-link" href={`/sighting/${sighting.id}`}>
		{#if imageUrl}
			<div class="image-wrap">
				<img class="sighting-image" src={imageUrl} alt={`Photo of ${sighting.species}`} loading="lazy" />
			</div>
		{/if}

		<div class="card-heading-row">
			<h3>{sighting.species}</h3>
			{#if imageUrl}
				<span class="image-indicator" title="Has image">IMG</span>
			{/if}
		</div>

		<p class="meta">📍 {formatCardCoordinates(sighting.latitude, sighting.longitude)}</p>
		<p class="meta">📅 {formatDate(sighting.createdAt)}</p>

		{#if sighting.description}
			<p class="description">{sighting.description}</p>
		{/if}

		<span class="sync-badge {syncClassMap[sighting.syncStatus]}">
			{syncLabelMap[sighting.syncStatus]}
		</span>
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
				{isDeleting ? '...' : '🗑'}
			</button>
		</div>
</li>

<style>
	.sighting-card {
		border: 1px solid #7ce3ba;
		border-radius: 0.9rem;
		background: #f4f5f7;
		padding: 1rem;
	}

	.card-link {
		text-decoration: none;
		color: inherit;
		display: grid;
		gap: 0.6rem;
	}

	.image-wrap {
		width: 100%;
		overflow: hidden;
		border-radius: 0.7rem;
		border: 1px solid #cceede;
		background: #e7f3ee;
	}

	.sighting-image {
		width: 100%;
		height: 180px;
		object-fit: cover;
		display: block;
	}

	.card-heading-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.card-heading-row h3 {
		margin: 0;
		font-size: 2rem;
		color: #065f46;
		font-weight: 700;
	}

	.image-indicator {
		font-size: 0.68rem;
		font-weight: 700;
		color: #7a4d00;
		background: #fff4db;
		padding: 0.15rem 0.4rem;
		border-radius: 999px;
		border: 1px solid #ffe0a8;
	}

	.meta {
		margin: 0;
		font-size: 1.05rem;
		color: #4b5563;
	}

	.description {
		margin: 0;
		font-size: 1.05rem;
		color: #4b5563;
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-top: 0.35rem;
	}

	.edit-btn {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		border: 1px solid #7ce3ba;
		color: #047857;
		border-radius: 0.6rem;
		padding: 0.55rem 0.8rem;
		font-weight: 600;
	}

	.delete-btn {
		border: 1px solid #f9a8a8;
		background: #fff;
		color: #dc2626;
		border-radius: 0.6rem;
		padding: 0.45rem 0.62rem;
		font-size: 1.05rem;
		line-height: 1;
	}

	.sync-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		border: 1px solid transparent;
		white-space: nowrap;
		width: fit-content;
	}

	.sync-badge.synced {
		background: #eaf8ee;
		color: #256636;
		border-color: #bce6c6;
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

	@media (max-width: 720px) {
		.card-heading-row h3 {
			font-size: 2.1rem;
		}
	}

	@media (max-width: 480px) {
		.sighting-image {
			height: 160px;
		}

		.meta,
		.description {
			font-size: 1.08rem;
		}

		.actions-row {
			gap: 0.55rem;
		}

		.edit-btn {
			padding: 0.65rem 0.9rem;
		}
	}
</style>
