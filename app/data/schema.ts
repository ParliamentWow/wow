import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";


export type Transcription = {
    id: string,
    content: string,
    timestamp: Date
}


export const transcriptionDB = sqliteTable('transcriptions', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});
