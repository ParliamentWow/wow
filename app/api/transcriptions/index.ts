import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { transcriptionDB } from "~/data/schema";
import type { Env } from "~/server";
import { getD1Client } from "../../data";

const transcriptions = new Hono<{ Bindings: Env }>();

transcriptions.get("/transcriptions", async (c) => {
  const db = getD1Client(c.env);
  const transcriptions = await db.query.transcriptionDB.findMany();

  return c.json(
    {
      message: "Transcriptions fetched",
      results: transcriptions,
    },
    200
  );
});

transcriptions.get("/transcriptions/:id", async (c) => {
  const id = c.req.param("id");
  const db = getD1Client(c.env);
  const transcription = await db.query.transcriptionDB.findFirst({
    where: eq(transcriptionDB.id, id),
  });

  return c.json(
    {
      message: "Transcription fetched",
      result: transcription,
    },
    200
  );
});

type Transcription = {
  id: string;
  sessionId: string;
  content: string;
  timestamp_start: number;
  timestamp_end: number;
}

transcriptions.post("/transcriptions", async (c) => {
  const data = (await c.req.json()) as Transcription
  const db = getD1Client(c.env);
  await db.insert(transcriptionDB).values({
    ...data,
    timestamp_start: new Date(data.timestamp_start),
    timestamp_end: new Date(data.timestamp_end),
  });
  return c.json(
    {
      message: "Transcription created",
    },
    201
  );
});

export default transcriptions;
