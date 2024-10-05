import { Hono } from "hono";
import { getD1Client } from "../../data";
import { Env } from "~/server";
import { eq } from "drizzle-orm";
import { insertSessionSchema, sessionDB } from "~/data/schema";
import { zValidator } from "@hono/zod-validator";

const sessions = new Hono<{ Bindings: Env }>();

sessions.get("/sessions", async (c) => {
  const db = getD1Client(c.env);
  const sessions = await db.query.sessionDB.findMany();

  return c.json(
    {
      message: "Sessions fetched",
      results: sessions,
    },
    200
  );
});
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

const sessionRoute = sessions.post(
  "/sessions",
  zValidator("json", insertSessionSchema),
  async (c) => {
    const data = await c.req.valid("json");
    const db = getD1Client(c.env);
    await db
      .insert(sessionDB)
      .values({ ...data, timestamp: new Date(data.timestamp) });

    return c.json(
      {
        message: "Session created",
      },
      201
    );
  }
);

export type SessionRoute = typeof sessionRoute;

export default sessions;
