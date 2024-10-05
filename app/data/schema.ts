import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";


export type Transcription = {
    id: string,
    content: string,
    timestamp: number
}


export const transcriptions = sqliteTable('transcriptions', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});
