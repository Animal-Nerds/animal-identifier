<script lang="ts">
	import { sightings } from '$lib/stores/sightings';
  import type { SightingsStoreState } from '$lib/stores/sightings';
  import { onMount } from 'svelte';

  let status = $state('SYNCED') as SyncStatus;
  
	$effect(() => {
    update($sightings);
	});

  const update = (curr: SightingsStoreState | null) => {
    status = !navigator.onLine
      ? ('OFFLINE' as SyncStatus)
      : curr?.loading
        ? ('SYNCING' as SyncStatus)
        : curr?.error
          ? ('FAILED' as SyncStatus)
          : ('SYNCED' as SyncStatus);
  };

  onMount(() => {
    let current: SightingsStoreState | null = null;

    const unsubscribe = sightings.subscribe((value) => {
      current = value;
    });

    const syncHandler = () => {
      if (current) update(current);
    };

    window.addEventListener('online', syncHandler);
    window.addEventListener('offline', syncHandler);
    syncHandler();

    return () => {
      unsubscribe();
      window.removeEventListener('online', syncHandler);
      window.removeEventListener('offline', syncHandler);
    };
  });
</script>

<div
  class="sync-status {status}"
  role="status"
  aria-live="polite"
>
  {status}
</div>

<style>
  .sync-status {
    font-size: 0.875rem;
    padding: 0.15rem 0.45rem;
    border-radius: 0.75rem;
    border: 2px solid;
    margin: 0 0.5rem;
    color: white;
    text-transform: uppercase;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .sync-status.SYNCED {
    background-color: #5cbd73; /* Green */
    border-color: #26b447;
  }

  .sync-status.SYNCING {
    background-color: #ffd966; /* Yellow */
    border-color: #ffc107;
  }

  .sync-status.FAILED {
    background-color: #d65f6b; /* Red */
    border-color: #dc3545;

  }

  .sync-status.OFFLINE {
    background-color: #96999b; /* Gray */
    border-color: #797c7e;
  }
</style>