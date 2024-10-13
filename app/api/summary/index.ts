import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { streamText } from "ai";
import { stream } from "hono/streaming";
import { Env } from "~/server";
import { google, mistral } from "../ai/models";
import { qAPrompt, summaryPrompt } from "../ai/prompts";
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
        data.question ??
        data.billName ??
        "key moments in the debate and important decisions",
    });

    if (!c.env.TURBOPUFFER_KEY) {
      throw new Error("TURBOPUFFER_KEY not found");
    }

    const [transcriptions, bills] = await Promise.all([
      getTranscriptionBySessionId(c.env, sessionId, response.data[0]),
      getBills(c.env, response.data[0]),
    ]);

    console.log(bills);

    const context =
      transcriptions
        .map((pd) => {
          return `<transcription_extract content="${pd.attributes.page_content}", metadata="${pd.attributes.metadata}" />`;
        })
        .join("\n") +
      bills
        .map((pd) => {
          return `<bill_extract content="${pd.attributes.page_content}", metadata="${pd.attributes.metadata}" />`;
        })
        .join("\n");

    let streamRes;
    if (data.question) {
      const prompt = qAPrompt(context, data.question);
      streamRes = await streamText({
        model: google(c.env)("gemini-1.5-pro-latest"),
        prompt,
      });
    } else {
      const prompt = summaryPrompt(context, data.billName);
      streamRes = await streamText({
        model: mistral(c.env)("mistral-large-latest"),
        prompt,
      });
    }

    const { textStream } = streamRes;

    return stream(c, async (stream) => {
      for await (const chunk of textStream) {
        console.log(chunk);
        await stream.write(chunk);
      }
      await stream.close();
    });
  }
);

export default summary;
