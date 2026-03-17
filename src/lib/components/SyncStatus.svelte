<script lang="ts">
    type SyncStatus = 'synced' | 'offline' | 'syncing' | 'error';
    let { status }: { status: SyncStatus } = $props();
</script>

{#if status === 'synced'}
    <div class="sync-status"></div>
{:else if status === 'offline'}
    <div class="sync-status">Offline</div>
{:else if status === 'syncing'}
    <div class="sync-status">Syncing...</div>
{:else if status === 'error'}
    <div class="sync-status">Error</div>
{/if}

