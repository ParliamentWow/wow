import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { Env } from "~/server";

const documents = new Hono<{ Bindings: Env }>();

documents.post(
  "/summary/:sessionId",
  zValidator(
    "json",
    z.object({
      question: z.string(),
    })
  ),
  async (c) => {
    const data = await c.req.valid("json");
    const sessionId = c.req.param("sessionId");
    const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text: data.question,
    });

    if (!c.env.TURBOPUFFER_KEY) {
      throw new Error("TURBOPUFFER_KEY not found");
    }
    const pufResponse = await fetch(
      `https://api.turbopuffer.com/v1/vectors/${sessionId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.TURBOPUFFER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vector: response.data[0],
          //   rank_by: ["page_content", "BM25", data.question],
          top_k: 4,
          include_attributes: true,
        }),
      }
    );

    if (!pufResponse.ok) {
      throw new Error("Failed to insert into puffer");
    }
    return c.json(
      {
        message: "Summary fetched",
        result: await pufResponse.json(),
      },
      201
    );
  }
);

export default documents;
