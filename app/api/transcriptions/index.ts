import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { type Transcription, transcriptionDB } from "~/data/schema";
import type { Env } from "~/server";
import { getDBClient } from "../../data";

const transcriptions = new Hono<{ Bindings: Env }>();

transcriptions.get("/transcriptions", async (c) => {
  const db = getDBClient(c.env);
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
  const db = getDBClient(c.env);
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

transcriptions.post("/transcriptions", async (c) => {
  const data = (await c.req.json()) as Transcription;
  const db = getDBClient(c.env);
  await db.insert(transcriptionDB).values(data);
  return c.json(
    {
      message: "Transcription created",
    },
    201
  );
});

export default transcriptions;
