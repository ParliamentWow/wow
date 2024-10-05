import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { Env } from "~/server";
import { summaryPrompt } from "../ai/prompts";
import { SummarySize } from "../ai/types";

const summary = new Hono<{ Bindings: Env }>();

summary.post(
  "/summary",
  zValidator(
    "json",
    z.object({
      sessionId: z.string(),
      billName: z.string(),
    })
  ),
  async (c) => {
    const data = await c.req.valid("json");
    const sessionId = data.sessionId;
    const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text: data.billName,
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
          top_k: 10,
          include_attributes: true,
        }),
      }
    );

    if (!pufResponse.ok) {
      const txt = await pufResponse.text();
      console.log(txt);
      throw new Error("PUFF request failed");
    }

    const puffData = (await pufResponse.json()) as {
      attributes: {
        page_content: string;
      };
    }[];
    const prompt = summaryPrompt(
      SummarySize.Short,
      puffData
        .map((pd) => `<content>${pd.attributes.page_content}</content>`)
        .join("\n"),
      data.billName
    );
    const mistral = await c.env.AI.run(
      "@cf/mistral/mistral-7b-instruct-v0.2-lora",
      {
        prompt,
      }
    );

    return c.json(
      {
        message: "Summary fetched",
        result: mistral,
      },
      201
    );
  }
);

export default summary;
