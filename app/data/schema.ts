import { relations, sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod"

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
  timestampStart: integer('timestamp_start').notNull(),
  timestampEnd: integer('timestamp_end').notNull(),
});

export const insertTranscriptionSchema = createInsertSchema(transcriptionDB);


export const transcriptionRelations = relations(transcriptionDB, ({ one }) => ({
    session: one(sessionDB, {
        fields: [transcriptionDB.sessionId],
        references: [sessionDB.id],
    }),
}));

