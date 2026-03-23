<script lang="ts">
    type SyncStatus = 'synced' | 'offline' | 'syncing' | 'error';
    let { status }: { status: SyncStatus } = $props();
</script>

{#if status !== "synced"}
  <div
    class="sync-status {status}"
    role="status"
    aria-live="polite"
  >
    {#if status === "offline"}
      Offline — changes will sync when connection returns
    {:else if status === "syncing"}
      Syncing changes...
    {:else if status === "error"}
      Sync error — retrying
    {/if}
  </div>
{/if}
