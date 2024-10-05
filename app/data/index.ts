import { drizzle } from "drizzle-orm/d1";
import type { Env } from "~/server";
import * as schema from "./schema";

export const getD1Client = (env: Env) => {
  return drizzle(env.DB, {
    schema,
  });
};
