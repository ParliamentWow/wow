import { Hono } from "hono";
import transcriptions from "./transcriptions";
import sessions from "./sessions";
import documents from "./documents";
const api = new Hono();

api.onError((err, c) => {
  console.error(`${err}`);
  return c.json(err, 500);
});

api.get("/api", (c) => {
  return c.text("Parliment Wow!");
});

api.route("/api", sessions);
api.route("/api", transcriptions);
api.route("/api", documents);

export default api;
