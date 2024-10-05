import { Env } from "~/server";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/d1";

export const getDBClient = (env: Env) => {
    return drizzle(env.DB, {
        schema
    });
}