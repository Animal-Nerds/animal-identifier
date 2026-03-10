import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const sightings = pgTable('sightings', {
	id: serial('id').primaryKey(),
	animal: text('animal').notNull(),
	location: text('location').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

