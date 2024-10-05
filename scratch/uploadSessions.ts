import { hc } from "hono/client";
import { SessionRoute } from "../app/api/sessions";
import file from "./file.json";
import { readFile } from "fs/promises";
const client = hc<SessionRoute>(
  "https://parliament-wow.threepointone.workers.dev/api"
);

type Bill = {
  id: string;
  name: string;
  stage: string;
  documents: {
    title: string;
    description: string;
    format: string;
    url: string;
    pubDate: string;
  }[];
};

async function uploadSessions() {
  for (const session of file) {
    try {
      if (session.room.includes("BSL")) {
        continue;
      }
      const id = session.url.split("/").pop() as string;

      const date = new Date(session.date);

      const dayBefore = new Date(date).getTime() - 1000 * 60 * 60 * 24;

      const billsText = await readFile(
        `./scratch/bills/${
          new Date(dayBefore).toISOString().split("T")[0]
        }.json`,
        "utf-8"
      );
      const bills: Bill[] = JSON.parse(billsText);
      console.log("video", session.url);
      console.log("session", session.date);
      console.log("room", session.room);
      console.log(
        "bills",
        bills.map((el) => el.name)
      );
      const res = await client.sessions.$post({
        json: {
          id,
          name: `${session.room} - ${session.date}`,
          vidioUrl: session.url,
          room: session.room,
          timestamp: new Date(session.date),
          documents: bills.flatMap((bill) =>
            bill.documents.map((doc) => ({
              title: doc.title,
              description: doc.description,
              format: doc.format,
              url: doc.url,
              pubDate: doc.pubDate,
            }))
          ),
        },
      });

      const response = await res.json();
      console.log(response.error);
    } catch (e) {
      console.log(e);
    }
  }
}

uploadSessions();
