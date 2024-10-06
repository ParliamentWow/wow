import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { transcriptionDB } from "~/data/schema";
import type { Env } from "~/server";
import { getD1Client } from "../../data";
import { zValidator } from "@hono/zod-validator";
import { insertTranscriptionSchema } from "~/data/schema";
import { insertTranscription } from "../ai/turbopuffer";
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

transcriptions.get("/transcriptions/fix", async (c) => {
  const db = getD1Client(c.env);
  const transcriptions = await db.query.transcriptionDB.findMany();

  try {
    for (const transcription of transcriptions) {
      try {
        console.log("fixing transcription", transcription.id);

        const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
          text: transcription.content,
        });

        console.log("generated vectors for", transcription.id);

        await insertTranscription(c.env, response.data[0], transcription);
      } catch (e) {
        console.log(transcription.id, "failed");
      }
    }
  } catch (e) {
    return c.text((e as Error).stack);
  }

  return c.json(transcriptions);
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

transcriptions.post(
  "/transcriptions",
  zValidator("json", insertTranscriptionSchema),
  async (c) => {
    const data = await c.req.valid("json");
    console.log(data);
    const db = getD1Client(c.env);
    await db.insert(transcriptionDB).values(data);

    const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text: data.content,
    });
    await insertTranscription(c.env, response.data[0], data);

    return c.json(
      {
        message: "Transcription created",
      },
      201
    );
  }
);

export default transcriptions;
