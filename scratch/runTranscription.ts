import { InferSelectModel } from "drizzle-orm";
import { sessionDB } from "~/data/schema";
async function runTranscription() {
  const url =
    "https://mattzcarey--parliament-live-transcripts-controller.modal.run";
  const sessionsResponse = await fetch(
    "https://parliament-wow.threepointone.workers.dev/api/sessions"
  );

  const sessions = ((await sessionsResponse.json()) as any)
    .results as unknown as InferSelectModel<typeof sessionDB>[];

  console.log(sessions);

  for (const session of sessions) {
    // base_page_url: str, api_url: str, session_id: str
    const transcriptionResponse = await fetch(
      `${url}?${new URLSearchParams({
        base_page_url: session.videoUrl,
        api_url:
          "https://parliament-wow.threepointone.workers.dev/api/transcriptions",
        session_id: session.id,
      })}`,
      {
        method: "POST",
      }
    );
    console.log(JSON.stringify(await transcriptionResponse.json(), null, 2));
  }
}

runTranscription();
