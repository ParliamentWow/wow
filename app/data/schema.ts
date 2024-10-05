import { relations, sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";


export const sessionDB = sqliteTable('session', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    vidioUrl: text('vidioUrl').notNull(),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const sessionRelations = relations(sessionDB, ({ many }) => ({
    transcriptions: many(transcriptionDB),
}));
  

export const transcriptionDB = sqliteTable('transcriptions', {
  id: text('id').primaryKey(),
  sessionId: text('sessionId').notNull(), // iso date string
  content: text('content').notNull(),
  timestamp_start: integer('timestamp_start', { mode: 'timestamp' }).notNull(),
  timestamp_end: integer('timestamp_end', { mode: 'timestamp' }).notNull(),
});

export const transcriptionRelations = relations(transcriptionDB, ({ one }) => ({
    session: one(sessionDB, {
        fields: [transcriptionDB.sessionId],
        references: [sessionDB.id],
    }),
}));