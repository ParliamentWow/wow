import {
  type ActionFunction,
  type LoaderFunction,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { getD1Client } from "~/data";
import { sessionDB } from "~/data/schema";

// import VideoPlayer from "~/components/VideoPlayer";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const db = getD1Client(context.env);
  const session = await db.query.sessionDB.findFirst({
    where: eq(sessionDB.id, params.id as string),
  });

  assert(session, "Session not found");

  return json({
    session,
    summaries: {
      shortSummary: "This is a short summary of the session",
      mediumSummary: "This is a medium summary of the session",
      longSummary: "This is a long summary of the session",
    },
  });
};

// export const action: ActionFunction = async ({
//   request,
// }: LoaderFunctionArgs) => {
//   const formData = await request.formData();
//   const question = formData.get("question");
//   console.log("TODO: ask question", question);
//   return json({});
// };

export default function SessionPage() {
  const { session, summaries } = useLoaderData<typeof loader>();
  console.log(session);
  const [activeSummary, setActiveSummary] =
    useState<keyof typeof summaries>("shortSummary");

  return (
    <div className="container mx-auto p-4">
      <Link
        to="/"
        className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
      >
        &larr; Back to Homepage
      </Link>
      <h1 className="text-2xl font-bold mb-4">{session?.name}</h1>

      <iframe
        title="Parliament Wow"
        src={`${session?.videoUrl?.replace(
          "https://parliamentlive.tv/event/index/",
          "https://videoplayback.parliamentlive.tv/Player/Index/"
        )}?audioOnly=False&autoStart=True&script=True`}
        width="100%"
        height="500px"
        allowFullScreen
      />

      {/* A tab bar, with short/medium/long summaries   */}
      <div className="flex gap-4 mt-4">
        <button
          type="button"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => setActiveSummary("shortSummary")}
        >
          Short Summary
        </button>
        <button
          type="button"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => setActiveSummary("mediumSummary")}
        >
          Medium Summary
        </button>
        <button
          type="button"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => setActiveSummary("longSummary")}
        >
          Long Summary
        </button>
      </div>
      <div className="mt-4">
        <ReactMarkdown>{summaries[activeSummary]}</ReactMarkdown>
      </div>
    </div>
  );
}
