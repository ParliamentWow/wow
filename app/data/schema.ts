import { relations, sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";


export type Transcription = {
    id: string,
    content: string,
    sessionId: string,
    timestamp: Date
}

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
  sessionId: text('sessionId').notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const transcriptionRelations = relations(transcriptionDB, ({ one }) => ({
    session: one(sessionDB, {
        fields: [transcriptionDB.sessionId],
        references: [sessionDB.id],
    }),
}));