import type { Ai } from "@cloudflare/workers-types/experimental";
import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import api from "./api";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Env = {
  DB: D1Database;
  AI: Ai;
  TURBOPUFFER_KEY?: string;
  // Add your bindings here
};

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    env: Env;
  }
}

const handleRemixRequest = createRequestHandler(build);

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      return api.fetch(request, env);
    }
    return handleRemixRequest(request, {
      env: env,
    });
  },
} satisfies ExportedHandler<Env>;
