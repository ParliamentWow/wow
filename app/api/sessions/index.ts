import { Hono } from "hono";
import { getD1Client } from "../../data";
import { Env } from "~/server";
import { eq, InferSelectModel } from "drizzle-orm";
import { sessionDB } from "~/data/schema";

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

sessions.post("/sessions", async (c) => {

    const data = await c.req.json() as InferSelectModel<typeof sessionDB>;
    const db = getD1Client(c.env);
    await db.insert(sessionDB).values(data);
    return c.json(
        {
        message: "Session created",
        },
        201
    );
});

export default sessions;
