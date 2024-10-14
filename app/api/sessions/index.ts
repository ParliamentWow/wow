import { Hono } from "hono";
import { getD1Client } from "../../data";
import { Env } from "~/server";
import { eq } from "drizzle-orm";
import { insertSessionSchema, sessionDB } from "~/data/schema";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as turbopuffer from "../ai/turbopuffer";
const sessions = new Hono<{ Bindings: Env }>();

sessions.get(
  "/sessions",
  zValidator(
    "query",
    z
      .object({
        search: z.string().optional(),
      })
      .optional()
  ),
  async (c) => {
    const db = getD1Client(c.env);
    const query = c.req.valid("query") || {};
    const sessions = await db.query.sessionDB.findMany();

    if (query.search) {
      const response = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
        text: query.search,
      });

      try {
        const res = await turbopuffer.query(
          c.env,
          "trascription",
          response.data[0]
        );

        return c.json({
          message: "Sessions fetched",
          results: res.map((r) => sessions.find((s) => (s.id = r.sessionId))),
        });
      } catch (e) {
        console.error(e);
      }
    }

    return c.json(
      {
        message: "Sessions fetched",
        results: sessions,
      },
      200
    );
  }
);
sessions.get("/sessions/:id", async (c) => {
  const id = c.req.param("id");

  const db = getD1Client(c.env);
  const session = await db.query.sessionDB.findFirst({
    where: eq(sessionDB.id, id),
  });

  return c.json(
    {
      message: "Session fetched",
      result: session,
    },
    200
  );
});

// const sessionRoute = sessions.post(
//   "/sessions",
//   zValidator("json", insertSessionSchema),
//   async (c) => {
//     const data = await c.req.valid("json");
//     const db = getD1Client(c.env);
//     await db
//       .insert(sessionDB)
//       .values({ ...data, timestamp: new Date(data.timestamp) });

//     return c.json(
//       {
//         message: "Session created",
//       },
//       201
//     );
//   }
// );

export type SessionRoute = typeof sessionRoute;

export default sessions;
