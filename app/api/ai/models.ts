import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { Env } from "~/server";

const mistral = (env: Env) => {
  if (!env.MISTRAL_AI_API_KEY) {
    throw new Error("MISTRAL_AI_API_KEY is not set");
  }
  return createMistral({
    apiKey: env.MISTRAL_AI_API_KEY,
  });
};

const google = (env: Env) => {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return createGoogleGenerativeAI({
    apiKey: env.GOOGLE_AI_API_KEY,
  });
};

export { google, mistral };
