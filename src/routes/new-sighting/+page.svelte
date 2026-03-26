<script lan="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getGeolocation } from '$lib/utils/gps';
    import { Timestamp } from '$lib/utils/timestamp';
    import { compressImage } from '$lib/utils/image-compression';
    import { VALIDATION } from '$lib/utils/constants';

    let species = '';
    let description = '';
    let latitude = '';
    let longitude = '';
    let seenAt = '';
    let imageDataUrl = '';
    let imagePreview = '';

    let loadind = false;
    let gpsLoading = true;
    let error = '';
    let success = '';

    onMount(async () => {
        seenAt = Timestamp.toISO(new Date());

        const geo = await getGeolocation();
        if (geo) {
            latitude = String(geo.latitude);
            longitude = String(geo.longitude);
        }
        gpsLoading = false;
    });

</script>

<div class="flex flex-col gap-4">
  <h1 class="text-2xl font-bold">New Sighting</h1>
    
</div>