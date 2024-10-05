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

    if (!c.env.TURBOPUFFER_KEY) {
      throw new Error("TURBOPUFFER_KEY not found");
    }
    const pufResponse = await fetch(
      "https://api.turbopuffer.com/v1/vectors/transcription",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.TURBOPUFFER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upserts: [
            {
              id: data.id,
              vector: response.data[0],
              attributes: {
                page_content: data.content,
                metadata: JSON.stringify({ ...data, content: undefined }),
              },
            },
          ],
          distance_metric: "cosine_distance",
          schema: {
            page_content: {
              type: "string",
              bm25: {
                language: "english",
                stemming: false,
                remove_stopwords: true,
                case_sensitive: false,
              },
            },
          },
        }),
      }
    );

    if (!pufResponse.ok) {
      throw new Error("Failed to insert into puffer");
    }

    return c.json(
      {
        message: "Transcription created",
      },
      201
    );
  }
);

export default transcriptions;
