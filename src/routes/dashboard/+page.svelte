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
</svelte:head>

<section class="dashboard-page">
	<header class="title-row">
		<div class="title-block">
			<h1>My Sightings</h1>
			<p>{totalSightings} {totalSightings === 1 ? 'sighting recorded' : 'sightings recorded'}</p>
		</div>
		<a class="new-sighting-btn" href="/sighting">+ New Sighting</a>
	</header>

	<div class="search-wrap">
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
			<p class="error">{error}</p>
		{/if}

		{#if loading && sightingsList.length > 0}
			<p class="inline-status">Updating from server...</p>
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
				<p class="inline-status">No sightings match your search.</p>
			{/if}
		{:else if loading || !initialized}
			<p class="inline-status">Loading sightings...</p>
		{:else}
			<div class="empty-state">
				<div class="empty-icon" aria-hidden="true">🌲</div>
				<h2>No sightings yet</h2>
				<p>Start tracking wildlife by creating your first sighting</p>
			</div>
		{/if}
	</section>
</section>

<style>
	.dashboard-page {
		width: calc(100% + 2rem);
		margin: -1rem;
		display: grid;
		gap: 0;
		align-content: start;
		padding: 0.75rem 1rem 1.5rem;
		min-height: calc(100vh - 80px);
		background: #d8e5df;
		box-sizing: border-box;
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.title-block h1 {
		margin: 0;
		font-size: 2.15rem;
		font-weight: 700;
		color: #065f46;
	}

	.title-block p {
		margin: 0.25rem 0 0;
		color: #4b5563;
		font-size: 1.1rem;
	}

	.new-sighting-btn {
		text-decoration: none;
		background: #047857;
		color: white;
		padding: 0.45rem 0.9rem;
		border-radius: 0.5rem;
		font-size: 0.82rem;
		font-weight: 600;
		box-shadow: 0 8px 16px rgba(4, 120, 87, 0.2);
	}

	.search-wrap {
		max-width: 430px;
		margin-top: 0;
	}

	.search-input {
		width: 100%;
		border: 1px solid #79ddb8;
		border-radius: 0.5rem;
		padding: 0.7rem 0.9rem;
		background: #eceff2;
		color: #374151;
	}

	.list-section {
		padding-top: 0;
		margin-top: 0.65rem;
	}

	.inline-status {
		margin: 0;
		font-size: 0.95rem;
		color: #4b5563;
	}

	.error {
		margin: 0 0 0.75rem;
		color: #b42318;
		background: #fff1f1;
		border: 1px solid #ffd5d2;
		border-radius: 0.5rem;
		padding: 0.65rem 0.75rem;
	}

	.empty-state {
		min-height: 300px;
		display: grid;
		place-items: center;
		text-align: center;
		gap: 0.65rem;
		padding: 2rem 1rem;
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

	.empty-state h2 {
		margin: 0;
		font-size: 2rem;
		color: #374151;
	}

	.empty-state p {
		margin: 0;
		color: #6b7280;
	}

	.sightings-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.8rem;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 720px) {
		.dashboard-page {
			width: calc(100% + 2rem);
			margin: -1rem;
			padding: 0.6rem 0.9rem 1rem;
			gap: 0.75rem;
		}

		.title-block h1 {
			font-size: 2.05rem;
		}

		.new-sighting-btn {
			display: none;
		}

		.search-wrap {
			max-width: none;
		}
	}

	@media (max-width: 1100px) {
		.sightings-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.sightings-list {
			grid-template-columns: 1fr;
		}
	}
</style>
