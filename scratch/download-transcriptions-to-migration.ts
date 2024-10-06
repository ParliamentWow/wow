import { writeFileSync } from "fs";

async function createTranscriptionMigration() {
  const json = (await fetch(
    "https://parliament-wow.threepointone.workers.dev/api/transcriptions"
  ).then((res) => res.json())) as {
    results: {
      id: string;
      sessionId: string;
      content: string;
      timestampStart: number;
      timestampEnd: number;
    }[];
  };

  const migration = json.results
    .filter((el) => el.sessionId === "b015fab5-6ca3-45a1-8b37-ec209d439626")
    .map(
      (el) => `
INSERT INTO transcriptions (id, sessionId, content, timestamp_start, timestamp_end)
VALUES ('${el.id}', '${el.sessionId}', '${el.content.replace(/'/g, "''")}', ${
        el.timestampStart
      }, ${el.timestampEnd});
  `
    )
    .join("\n");

  writeFileSync("./scratch/transcriptions-migration.sql", migration);
  console.log(migration);
}

createTranscriptionMigration();
