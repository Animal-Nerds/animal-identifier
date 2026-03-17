// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

export { };

declare global {
	interface User {
		id: string;
		email: string;
		username: string;
		createdAt: string;
		avatarUrl?: string;
	}

	interface Session {
		id: string;
		userId: string;
		token: string;
		expiresAt: string;
	}

	interface Image {
		id: string;
		sightingId: string;
		url: string;
		thumbnailUrl?: string;
		createdAt: string;
	}

	interface Sighting {
		id: string;
		userId: string;

		species: string;
		description?: string;

		latitude: number;
		longitude: number;

		createdAt: string;
		updatedAt?: string;

		images: Image[];

		syncStatus: SyncStatus;
	}

	namespace App {
		interface Locals {
			token?: string;
		}
	}

	enum SyncStatus {
		PENDING = 'PENDING',
		SYNCING = 'SYNCING',
		SYNCED = 'SYNCED',
		FAILED = 'FAILED',
		OFFLINE = 'OFFLINE'
	}

	interface ValidationResult {
		valid: boolean;
		errors: string[];
	}
}
