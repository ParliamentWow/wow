import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { transcriptionDB } from "~/data/schema";
import type { Env } from "~/server";
import { getD1Client } from "../../data";
import { zValidator } from "@hono/zod-validator";
import { insertTranscriptionSchema } from "~/data/schema";
import { insertTranscription } from "../ai/turbopuffer";
import { stream, streamText } from "hono/streaming";
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

transcriptions.get("/transcriptions/live", async (c) => {
  const db = getD1Client(c.env);

  const sessionId = "b015fab5-6ca3-45a1-8b37-ec209d439626";
  const transcriptions = await db.query.transcriptionDB.findMany({
    where: eq(transcriptionDB.sessionId, sessionId),
  });

  console.log(transcriptions);

  const chunks = transcriptions.flatMap((t) =>
    t.content.replace(/\\u[\dA-F]{4}/gi, "").split(".")
  );

  const res = streamText(c, async (stream) => {
    await new Promise((r) => setTimeout(r, 10000));
    for (const chunk of chunks) {
      await stream.writeln(`<div className="p-1>${chunk}</div>`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  });
  res.headers.set("content-encoding", "identity");
  return res;
});

transcriptions.get("/transcriptions/:id", async (c) => {
  const id = c.req.param("id");
  const db = getD1Client(c.env);

  const transcriptions = await db.query.transcriptionDB.findMany({
    where: eq(transcriptionDB.sessionId, id),
  });

  const chunks = transcriptions.flatMap((t) =>
    t.content.replace(/\\u[\dA-F]{4}/gi, "").split(".")
  );

  return streamText(c, async (stream) => {
    for (const chunk of chunks) {
      await stream.writeln(chunk);
      await new Promise((r) => setTimeout(r, 2500));
    }
  });
});

transcriptions.post(
  "/transcriptions",
  zValidator("json", insertTranscriptionSchema),
  async (c) => {
    const data = await c.req.valid("json");
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
