import { Env } from "~/server";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/d1";

export const getD1Client = (env: Env) => {
    return drizzle(env.DB, {
        schema
    });
}