import { pgTable, text, timestamp, uuid, doublePrecision, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	avatarUrl: text('avatar_url'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
	sightings: many(sightings),
	sessions: many(sessions)
}));

// ─── Sessions ────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

// ─── Sightings ───────────────────────────────────────────────────────────────

export const sightings = pgTable('sightings', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	species: text('species').notNull(),
	description: text('description'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	sightedAt: timestamp('sighted_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const sightingsRelations = relations(sightings, ({ one, many }) => ({
	user: one(users, {
		fields: [sightings.userId],
		references: [users.id]
	}),
	images: many(images)
}));

// ─── Images ──────────────────────────────────────────────────────────────────

export const images = pgTable('images', {
	id: uuid('id').primaryKey().defaultRandom(),
	sightingId: uuid('sighting_id')
		.notNull()
		.references(() => sightings.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	altText: text('alt_text'),
	order: integer('order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const imagesRelations = relations(images, ({ one }) => ({
	sighting: one(sightings, {
		fields: [images.sightingId],
		references: [sightings.id]
	})
}));

// ─── Exported types ──────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Sighting = typeof sightings.$inferSelect;
export type NewSighting = typeof sightings.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
