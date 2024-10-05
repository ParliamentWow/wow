import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { transcriptionDB } from "~/data/schema";
import type { Env } from "~/server";
import { getD1Client } from "../../data";
import { zValidator } from "@hono/zod-validator";
import { insertTranscriptionSchema } from "~/data/schema";
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

transcriptions.post("/transcriptions", zValidator('json', insertTranscriptionSchema), async (c) => {
  const data = await c.req.valid("json")
  console.log(data)
  const db = getD1Client(c.env);
  await db.insert(transcriptionDB).values(data);
  return c.json(
    {
      message: "Transcription created",
    },
    201
  );
});

export default transcriptions;
