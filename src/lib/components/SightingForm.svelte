<script lang="ts">
	import { getGeolocation } from '$lib/utils/gps';
	import { compressImage } from '$lib/utils/image-compression';

	let { id = null, action } = $props<{
		id?: string | null;
		action: ((sighting: CreateSightingInput) => void) | ((id: string, sighting: CreateSightingInput) => void);
	}>();

	let species = $state('');
	let description = $state('');
	let latitude = $state(0);
	let longitude = $state(0);
	let images = $state<string[]>([]);
	let loading = $state(false);
	let error = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (!species.trim()) {
			error = 'Species is required';
			return;
		}

		let sighting: CreateSightingInput = {
			species,
			description,
			latitude,
			longitude,
			images
		};

		if (id) {
			action(id, sighting);
		} else {
			action(sighting);
		}
	}

	async function fetchLocation() {
		const location = await getGeolocation();
		if (location) {
			latitude = location.latitude;
			longitude = location.longitude;
		}
	}

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (!files) return;

		loading = true;
		try {
			for (const file of files) {
				const dataUrl = await compressImage(file);
				images.push(dataUrl);
			}
		} catch (err) {
			error = 'Failed to process image';
		} finally {
			loading = false;
		}
	}

	function removeImage(index: number) {
		images.splice(index, 1);
	}
</script>

<form onsubmit={handleSubmit}>
	<div class="field">
		<label for="species">Species</label>
		<input id="species" type="text" bind:value={species} required />
	</div>

	<div class="field">
		<label for="description">Description</label>
		<textarea id="description" bind:value={description} rows="3"></textarea>
	</div>

	<div class="field">
		<label>Location</label>
		<button type="button" onclick={fetchLocation}>Get Current Location</button>
		{#if latitude !== 0 || longitude !== 0}
			<p class="location-display">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
		{/if}
	</div>

	<div class="field">
		<label for="images">Images</label>
		<input
			id="images"
			type="file"
			accept="image/jpeg,image/png,image/webp"
			multiple
			onchange={handleImageUpload}
			disabled={loading}
		/>
		{#if images.length > 0}
			<div class="image-previews">
				{#each images as image, i}
					<div class="image-preview">
						<img src={image} alt="Sighting preview" />
						<button type="button" onclick={() => removeImage(i)}>Remove</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<button type="submit" disabled={loading}>
		{loading ? 'Processing...' : id ? 'Update Sighting' : 'Create Sighting'}
	</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 500px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	label {
		font-weight: 600;
	}

	input[type='text'],
	textarea {
		padding: 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.5rem;
		background: #f9fafb;
		font-family: inherit;
	}

	.location-display {
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
		color: #555;
	}

	.image-previews {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}

	.image-preview {
		position: relative;
	}

	.image-preview img {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 0.25rem;
	}

	.image-preview button {
		display: block;
		font-size: 0.75rem;
		margin-top: 0.25rem;
		color: #b42318;
		background: none;
		border: none;
		cursor: pointer;
	}

	.error {
		color: #b42318;
		font-size: 0.9rem;
		margin: 0;
	}

	button[type='submit'] {
		padding: 0.85rem;
		background: #2d5a2d;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
	}

	button[type='submit']:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	button[type='button'] {
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.5rem;
		cursor: pointer;
		align-self: flex-start;
	}
</style>
