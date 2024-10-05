import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { Env } from "~/server";

const documents = new Hono<{ Bindings: Env }>();

documents.post(
  "/documents",
  zValidator(
    "json",
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      content: z.string(),
      publishDate: z.string(),
      chunkId: z.string(),
    })
  ),
  async (c) => {
    const data = await c.req.valid("json");

    const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text: data.content,
    });

    if (!c.env.TURBOPUFFER_KEY) {
      throw new Error("TURBOPUFFER_KEY not found");
    }
    const pufResponse = await fetch(
      `https://api.turbopuffer.com/v1/vectors/${data.id}`,
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
                metadata: JSON.stringify({
                  ...data,
                  content: undefined,
                  metadata: "document",
                }),
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
        message: "Document created",
      },
      201
    );
  }
);

export default documents;
