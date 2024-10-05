import { type LoaderFunction, json } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
// import VideoPlayer from "~/components/VideoPlayer";
import {
  // askQuestion,
  getSessionById,
  // getSessionDetails,
  getSessionSummary,
} from "~/utils/api.server";

interface Session {
  id: string;
  title: string;
  videoUrl: string;
  isLive: boolean;
  status: "live" | "upcoming" | "past" | string;
}

interface SessionSummary {
  shortSummary: string;
  longSummary: string;
}

interface LoaderData {
  session: Session;
  summary: SessionSummary;
}

export const loader: LoaderFunction = async ({ params }) => {
  const session = await getSessionById(params.id as string);
  // const summary = await getSessionSummary(params.id as string);
  const summary = {
    shortSummary: "This is a short summary of the session",
    longSummary: "This is a long summary of the session",
  };
  return json<LoaderData>({ session, summary });
};

export default function SessionPage() {
  const { session, summary } = useLoaderData<LoaderData>();
  const [showLongSummary, setShowLongSummary] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const fetcher = useFetcher();

  const handleAskQuestion = () => {
    console.log("TODO: ask question", question);
    // fetcher.submit(
    //   { question, sessionId: session.id },
    //   { method: "post", action: "/api/ask-question" }
    // );
  };

  return (
    <div className="container mx-auto p-4">
      <Link
        to="/"
        className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
      >
        &larr; Back to Homepage
      </Link>
      <h1 className="text-2xl font-bold mb-4">{session.title}</h1>

      {/* <VideoPlayer url={session.videoUrl} /> */}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Session Summary</h2>
        <p>{summary.shortSummary}</p>
        <button
          type="button"
          onClick={() => setShowLongSummary(!showLongSummary)}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          {showLongSummary ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {showLongSummary && (
        <div className="mt-4">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  // biome-ignore lint/a11y/useValidAnchor: <explanation>
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedSection(props.href || null);
                  }}
                  className="text-blue-500 hover:underline cursor-pointer"
                />
              ),
            }}
          >
            {summary.longSummary}
          </ReactMarkdown>
        </div>
      )}

      {selectedSection && (
        <fetcher.Form
          method="get"
          action={`/api/session-details/${selectedSection}`}
        >
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          >
            Load Details for Selected Section
          </button>
        </fetcher.Form>
      )}

      {fetcher.data?.details && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Section Details</h3>
          <ReactMarkdown>{fetcher.data.details}</ReactMarkdown>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Ask a Question</h2>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter your question about the session"
        />
        <button
          type="button"
          onClick={handleAskQuestion}
          className="mt-2 bg-purple-500 text-white px-4 py-2 rounded"
        >
          Ask
        </button>
      </div>

      {fetcher.data && fetcher.data.answer && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Answer</h3>
          <p>{fetcher.data.answer}</p>
        </div>
      )}
    </div>
  );
}
