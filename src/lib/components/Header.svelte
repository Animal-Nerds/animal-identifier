<script lang="ts">
	import type { User } from '$lib/db/schema';

	let isOpen = $state(false);
	let { user = null } = $props<{ user?: User | null }>();
</script>

<header class="app-header">
	<div class="header-content">
		<div class="branding">
			<h1>Animal Identifier</h1>
		</div>

        <div class="user-section {user ? '' : 'hidden'}">
            <button class="menu-toggle" onclick={() => (isOpen = !isOpen)} aria-label="Menu">
                ☰
            </button>
            {#if user && isOpen}
            <nav class="dropdown-menu">
                    <div class="user-info">
                        <p class="user-email">{user.email}</p>
                    </div>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/sightings">Sightings</a></li>
                    </ul>
                </nav>
            {/if}
        </div>
	</div>
</header>

<style>
	.app-header {
		background: linear-gradient(135deg, #2d5a2d 0%, #1e3f1e 100%);
		color: white;
		padding: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 100%;
	}

	.branding {
		flex: 1;
	}

	.branding h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.user-section {
		position: relative;
	}

    .user-section.hidden {
        opacity: 0;
        pointer-events: none;
    }

	.menu-toggle {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		background: white;
		color: #1f2a1f;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 200px;
		margin-top: 0.5rem;
		overflow: hidden;
	}

	.user-info {
		padding: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.user-email {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.dropdown-menu ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.dropdown-menu li {
		margin: 0;
	}

	.dropdown-menu a {
		display: block;
		padding: 0.75rem 1rem;
		color: #1f2a1f;
		text-decoration: none;
		border-bottom: 1px solid #f0f0f0;
	}

	.dropdown-menu a:active {
		background: #f5f5f5;
	}

	.logout-btn {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #a66335;
		color: white;
		border: none;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.logout-btn:active {
		opacity: 0.8;
	}
</style>
