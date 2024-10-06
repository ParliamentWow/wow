import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { generateText } from "ai";
import { Env } from "~/server";
import mistral from "../ai/models";
import { summaryPrompt } from "../ai/prompts";

const summary = new Hono<{ Bindings: Env }>();

summary.post(
  "/summary",
  zValidator(
    "json",
    z.object({
      sessionId: z.string(),
      billName: z.string(),
      question: z.string().optional(),
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
        metadata: string;
      };
    }[];
    const prompt = summaryPrompt(
      puffData
        .map((pd) => {
          return `<doc content="${pd.attributes.page_content}", source_url="${pd.attributes.metadata}" />`;
        })
        .join("\n"),
      data.billName,
      data.question
    );
    const { text } = await generateText({
      model: mistral(c.env)("mistral-large-latest"),
      prompt,
    });

    return c.json(
      {
        message: "Summary fetched",
        result: text,
      },
      201
    );
  }
);

summary.post(
  "/question",
  zValidator(
    "json",
    z.object({
      sessionId: z.string(),
      billName: z.string(),
      question: z.string(),
    })
  ),
  async (c) => {
    const data = await c.req.valid("json");
    const sessionId = data.sessionId;

    const transcriptionEmbedding = await c.env.AI.run(
      "@cf/baai/bge-large-en-v1.5",
      {
        text: data.billName,
      }
    );

    const billEmbedding = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
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
          vector: transcriptionEmbedding.data[0],
          //   rank_by: ["page_content", "BM25", data.question],
          top_k: 10,
          include_attributes: true,
        }),
      }
    );

    const pufBillsResponse = await fetch(
      `https://api.turbopuffer.com/v1/vectors/bills/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.TURBOPUFFER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vector: billEmbedding.data[0],
          top_k: 10,
          include_attributes: true,
        }),
      }
    );

    if (!pufResponse.ok || !pufBillsResponse.ok) {
      const txt = await pufResponse.text();
      const txt2 = await pufBillsResponse.text();
      console.log(txt, txt2);
      throw new Error("PUFF request failed");
    }

    const puffData = (await pufResponse.json()) as {
      attributes: {
        page_content: string;
      };
    }[];

    const puffBillsData = (await pufBillsResponse.json()) as {
      attributes: {
        page_content: string;
        metadata: string;
      };
    }[];

    const bill = data.billName;
    const billExtracts = puffBillsData
      .map((el) => ({
        attributes: {
          ...JSON.parse(el.attributes.metadata),
          page_content: el.attributes.page_content,
        },
      }))
      .map(
        (pd) =>
          `<title>${pd.attributes.title}</title> <description>${pd.attributes.description}</description> <url>${pd.attributes.url}</url> <content>${pd.attributes.page_content}</content>`
      )
      .join("\n");

    const transcripts = puffData
      .map((pd) => `<content>${pd.attributes.page_content}</content>`)
      .join("\n");

    const prompt = `${data.question}
${bill}
${billExtracts}
${transcripts}
    `;

    const mistral = await c.env.AI.run("@hf/mistral/mistral-7b-instruct-v0.2", {
      prompt,
    });

    return c.json(
      {
        message: "Summary fetched",
        result: mistral,
        prompt,
      },
      200
    );
  }
);

export default summary;
