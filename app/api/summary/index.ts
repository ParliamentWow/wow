import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { z } from "zod";

import { streamText } from "ai";
import { Env } from "~/server";
import mistral from "../ai/models";
import { summaryPrompt } from "../ai/prompts";
import { getBills, getTranscriptionBySessionId } from "../ai/turbopuffer";

const summary = new Hono<{ Bindings: Env }>();

summary.post(
  "/summary",
  zValidator(
    "json",
    z.object({
      sessionId: z.string(),
      billName: z.string().optional(),
      question: z.string().optional(),
    })
  ),
  async (c) => {
    const data = await c.req.valid("json");
    const sessionId = data.sessionId;
    const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text:
        data.billName ?? "key moments in the debate and important decisions",
    });

    if (!c.env.TURBOPUFFER_KEY) {
      throw new Error("TURBOPUFFER_KEY not found");
    }

    let context = "";

    if (!data.billName) {
      const transcriptions = await getTranscriptionBySessionId(
        c.env,
        sessionId,
        response.data[0]
      );
      context = transcriptions
        .map(
          (pd) =>
            `<transcriptions content="${pd.attributes.page_content}", metadata="${pd.attributes.metadata}" />`
        )
        .join("\n");
    } else {
      const [transcriptions, bills] = await Promise.all([
        getTranscriptionBySessionId(c.env, sessionId, response.data[0]),
        getBills(c.env, response.data[0]),
      ]);

      context =
        transcriptions
          .map((pd) => {
            return `<transcriptions content="${pd.attributes.page_content}", metadata="${pd.attributes.metadata}" />`;
          })
          .join("\n") +
        bills
          .map((pd) => {
            return `<bills content="${pd.attributes.page_content}", metadata="${pd.attributes.metadata}" />`;
          })
          .join("\n");
    }

    const prompt = summaryPrompt(context, data.billName, data.question);
    const { textStream } = await streamText({
      model: mistral(c.env)("mistral-large-latest"),
      prompt,
    });

    const res = stream(c, async (stream) => {
      let fullText = "";
      for await (const chunk of textStream) {
        fullText += chunk;
        await stream.write(chunk);
      }
      await stream.close();
    });

    res.headers.set("content-encoding", "identity");

    return res;
  }
);

export default summary;
