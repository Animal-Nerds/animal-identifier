<script lang="ts">
	import { onMount } from 'svelte';
	import { sightings } from '$lib/stores/sightings';
	import SightingCard from '$lib/components/SightingCard.svelte';

	let initialized = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let sightingsList = $state<Sighting[]>([]);
	let searchTerm = $state('');
	let deletingId = $state<string | null>(null);

	$effect(() => {
		const state = $sightings;
		initialized = state.initialized;
		loading = state.loading;
		error = state.error;
		sightingsList = [...state.sightings].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});

	const totalSightings = $derived(sightingsList.length);
	const filteredSightings = $derived.by(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) {
			return sightingsList;
		}

		return sightingsList.filter((item) => {
			return (
				item.species.toLowerCase().includes(query) ||
				(item.description ?? '').toLowerCase().includes(query)
			);
		});
	});

	onMount(async () => {
		await sightings.init();
	});

	async function handleDelete(id: string) {
		const confirmed = window.confirm('Delete this sighting?');
		if (!confirmed) return;

		deletingId = id;
		try {
			await sightings.remove(id);
		} finally {
			deletingId = null;
		}
	}

</script>

<svelte:head>
	<title>Dashboard - Animal Identifier</title>
	<meta name="description" content="View and manage your wildlife sightings. Track species, locations, and photos from your observations." />
</svelte:head>

<section class="dashboard-page">
	<header class="title-row">
		<div class="title-block">
			<h1>My Sightings</h1>
			<p class="subtitle">{totalSightings} {totalSightings === 1 ? 'sighting recorded' : 'sightings recorded'}</p>
		</div>
		<a class="new-sighting-btn" href="/sighting">+ New Sighting</a>
	</header>

	<div class="search-wrap">
		<svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
		</svg>
		<input
			class="search-input"
			type="search"
			name="search"
			bind:value={searchTerm}
			placeholder="Search sightings..."
			aria-label="Search sightings"
		/>
	</div>

	<section class="list-section">
		{#if error}
			<div class="error">
				<svg class="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
				</svg>
				<p>{error}</p>
			</div>
		{/if}

		{#if loading && sightingsList.length > 0}
			<div class="updating-bar">
				<div class="updating-spinner"></div>
				<p class="inline-status">Updating from server...</p>
			</div>
		{/if}

		{#if sightingsList.length > 0}
			{#if filteredSightings.length > 0}
				<ul class="sightings-list">
					{#each filteredSightings as sighting}
						<SightingCard
							{sighting}
							isDeleting={deletingId === sighting.id}
							onDelete={handleDelete}
						/>
					{/each}
				</ul>
			{:else}
				<div class="no-results">
					<p class="inline-status">No sightings match your search.</p>
				</div>
			{/if}
		{:else if loading || !initialized}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p class="inline-status">Loading sightings...</p>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon" aria-hidden="true">
					<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M24 4C13 4 6 14 6 24s7 20 18 20 18-10 18-20S35 4 24 4z" />
						<path d="M18 20c-2-4 0-8 4-8s5 4 3 8M26 20c-2-4 0-8 4-8s5 4 3 8" />
						<path d="M14 30c2 4 6 6 10 6s8-2 10-6" />
					</svg>
				</div>
				<h2>No sightings yet</h2>
				<p>Start tracking wildlife by creating your first sighting</p>
				<a class="empty-cta" href="/sighting">Create your first sighting</a>
			</div>
		{/if}
	</section>
</section>

<style>
	.dashboard-page {
		width: calc(100% + 2rem);
		margin: -1rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem 1.5rem 2rem;
		min-height: calc(100vh - 80px);
		background: linear-gradient(180deg, #d8e5df 0%, #e8f0ec 100%);
		box-sizing: border-box;
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.title-block h1 {
		margin: 0;
		font-size: 1.85rem;
		font-weight: 800;
		color: #064e3b;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 0.15rem 0 0;
		color: #374151;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.new-sighting-btn {
		text-decoration: none;
		background: #047857;
		color: white;
		padding: 0.6rem 1.15rem;
		border-radius: 0.65rem;
		font-size: 0.85rem;
		font-weight: 600;
		box-shadow: 0 4px 14px rgba(4, 120, 87, 0.25);
		transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
	}

	.new-sighting-btn:hover {
		background: #065f46;
		box-shadow: 0 6px 20px rgba(4, 120, 87, 0.35);
	}

	.new-sighting-btn:active {
		transform: scale(0.97);
	}

	.search-wrap {
		position: relative;
		max-width: 460px;
	}

	.search-icon {
		position: absolute;
		left: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1rem;
		height: 1rem;
		color: #6b7280;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		border: 1px solid rgba(121, 221, 184, 0.6);
		border-radius: 0.65rem;
		padding: 0.65rem 0.9rem 0.65rem 2.5rem;
		background: rgba(255, 255, 255, 0.85);
		color: #374151;
		font-size: 0.9rem;
		backdrop-filter: blur(4px);
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	}

	.search-input:focus {
		outline: none;
		border-color: #34d399;
		box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
	}

	.list-section {
		flex: 1;
	}

	.inline-status {
		margin: 0;
		font-size: 0.9rem;
		color: #374151;
	}

	.updating-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		margin-bottom: 1rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 0.5rem;
	}

	.updating-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid #d1d5db;
		border-top-color: #047857;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.error {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin: 0 0 1rem;
		color: #991b1b;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.65rem;
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
	}

	.error p {
		margin: 0;
	}

	.error-icon {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
		margin-top: 0.1rem;
		color: #dc2626;
	}

	/* Loading state */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 260px;
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

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		min-height: 320px;
		padding: 2rem 1rem;
	}

	.empty-icon {
		width: 72px;
		height: 72px;
		border-radius: 999px;
		background: linear-gradient(135deg, #d1fae5, #a7f3d0);
		display: grid;
		place-items: center;
		margin-bottom: 0.5rem;
	}

	.empty-icon svg {
		width: 36px;
		height: 36px;
		color: #065f46;
	}

	.empty-state h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.empty-state p {
		margin: 0;
		color: #4b5563;
		font-size: 0.95rem;
	}

	.empty-cta {
		display: inline-block;
		margin-top: 0.75rem;
		padding: 0.6rem 1.25rem;
		background: #047857;
		color: white;
		text-decoration: none;
		border-radius: 0.65rem;
		font-weight: 600;
		font-size: 0.9rem;
		box-shadow: 0 4px 14px rgba(4, 120, 87, 0.2);
	}

	.no-results {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 120px;
	}

	/* Grid */
	.sightings-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 1100px) {
		.sightings-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 720px) {
		.dashboard-page {
			width: calc(100% + 2rem);
			margin: -1rem;
			padding: 1rem;
			gap: 1rem;
		}

		.title-block h1 {
			font-size: 1.6rem;
		}

		.new-sighting-btn {
			display: none;
		}

		.search-wrap {
			max-width: none;
		}

		.sightings-list {
			grid-template-columns: 1fr;
		}
	}
</style>
