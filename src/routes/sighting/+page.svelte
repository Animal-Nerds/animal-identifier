<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getGeolocation } from '$lib/utils/gps';
	import { Timestamp } from '$lib/utils/timestamp';
	import { compressImage } from '$lib/utils/image-compression';
	import { createSighting } from '$lib/services/sightings';

	let species = $state('');
	let description = $state('');
	let latitude = $state('');
	let longitude = $state('');
	let seenAt = $state('');
	let imageDataUrl = $state('');
	let imagePreview = $state('');

	let loading = $state(false);
	let gpsLoading = $state(true);
	let error = $state('');

	onMount(async () => {
		seenAt = Timestamp.toISO(new Date());

		const geo = await getGeolocation();
		if (geo) {
			latitude = String(geo.latitude);
			longitude = String(geo.longitude);
		}
		gpsLoading = false;
	});

	async function onPickImage(event: Event) {
		error = '';
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const compressed = await compressImage(file);
			imageDataUrl = compressed;
			imagePreview = compressed;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to process image';
		}
	}

	function removeImage() {
		imageDataUrl = '';
		imagePreview = '';
	}

	async function fetchLocation() {
		gpsLoading = true;
		const geo = await getGeolocation();
		if (geo) {
			latitude = String(geo.latitude);
			longitude = String(geo.longitude);
		}
		gpsLoading = false;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (!species.trim()) {
			error = 'Species is required';
			return;
		}

		const lat = Number(latitude);
		const lng = Number(longitude);

		if (isNaN(lat) || isNaN(lng)) {
			error = 'Latitude and longitude must be valid numbers';
			return;
		}

		loading = true;

		try {
			await createSighting({
				species: species.trim(),
				description: description.trim() || undefined,
				latitude: lat,
				longitude: lng,
				images: imageDataUrl ? [imageDataUrl] : []
			});

			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create sighting';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>New Sighting - Animal Identifier</title>
</svelte:head>

<div class="page">
	<h1>New Sighting</h1>

	<form onsubmit={handleSubmit}>
		<div class="field">
			<label for="species">Species</label>
			<input
				id="species"
				type="text"
				bind:value={species}
				placeholder="e.g. White-tailed Deer"
				required
			/>
		</div>

		<div class="field">
			<label for="description">Description</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="What did you observe?"
				rows="3"
			></textarea>
		</div>

		<div class="field">
			<label>Location</label>
			<button type="button" class="btn-secondary" onclick={fetchLocation} disabled={gpsLoading}>
				{gpsLoading ? 'Getting location...' : 'Use Current Location'}
			</button>
			<div class="location-row">
				<label for="latitude">Latitude
					<input id="latitude" type="text" bind:value={latitude} placeholder="0.00000" />
				</label>
				<label for="longitude">Longitude
					<input id="longitude" type="text" bind:value={longitude} placeholder="0.00000" />
				</label>
			</div>
		</div>

		<div class="field">
			<label for="image">Photo</label>
			<input
				id="image"
				type="file"
				accept="image/jpeg,image/png,image/webp"
				onchange={onPickImage}
			/>
			{#if imagePreview}
				<div class="image-preview">
					<img src={imagePreview} alt="Sighting preview" />
					<button type="button" class="remove-btn" onclick={removeImage}>Remove</button>
				</div>
			{/if}
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button type="submit" class="btn-primary" disabled={loading}>
			{loading ? 'Saving...' : 'Create Sighting'}
		</button>
	</form>
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

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	input[type='text'],
	textarea {
		padding: 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.5rem;
		background: #f9fafb;
		font-family: inherit;
		font-size: 0.95rem;
	}

	.location-row {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.location-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
		font-weight: 400;
		font-size: 0.85rem;
	}

	.image-preview {
		margin-top: 0.5rem;
	}

	.image-preview img {
		width: 120px;
		height: 120px;
		object-fit: cover;
		border-radius: 0.5rem;
	}

	.remove-btn {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.8rem;
		color: #b42318;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.error {
		color: #b42318;
		font-size: 0.9rem;
		margin: 0;
	}

	.btn-primary {
		padding: 0.85rem;
		background: #2d5a2d;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.5rem;
		cursor: pointer;
		align-self: flex-start;
		font-size: 0.9rem;
	}

	.btn-secondary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
