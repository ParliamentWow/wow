import {
  type ActionFunction,
  type LoaderFunction,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { Form, Link, useFetcher, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { getD1Client } from "~/data";
import { sessionDB } from "~/data/schema";

// import VideoPlayer from "~/components/VideoPlayer";

function assert(condition: unknown, message: string): asserts condition {
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
  });
};

export const action: ActionFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const formData = await request.formData();
  const question = formData.get("question");
  console.log("TODO: ask question", question);
  return json({
    answer: "TODO: answer",
  });
};

export default function SessionPage() {
  const { session } = useLoaderData<typeof loader>();
  assert(session, "Session not found");
  const [activeBill, setActiveBill] = useState<string | null>(null);

  const [summaries, setSummaries] = useState<
    Record<string, Record<"short" | "medium" | "long", string>>
  >({});

  const [activeSummary, setActiveSummary] = useState<
    "short" | "medium" | "long"
  >("short");

  const answerFetcher = useFetcher();

  function handleAskQuestion(billId: string, question: string) {
    answerFetcher.submit(
      { billId, question },
      {
        method: "post",
      }
    );
  }

  const handleZoom = (
    billId: string,
    summaryType: "short" | "medium" | "long"
  ) => {
    setActiveBill(billId);
    setActiveSummary(summaryType);
  };

  return (
    <div className="container mx-auto p-4">
      <Link
        to="/"
        className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
      >
        &larr; Back to Homepage
      </Link>
      <h1 className="text-2xl font-bold mb-4">{session.name}</h1>

      <iframe
        title="Parliament Wow"
        src={`${session.videoUrl.replace(
          "https://parliamentlive.tv/event/index/",
          "https://videoplayback.parliamentlive.tv/Player/Index/"
        )}?audioOnly=False&autoStart=True&script=True`}
        width="100%"
        height="500px"
        allowFullScreen
      />

      {/* list out the bills in a session */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Bills</h2>
        <ul className="list-disc">
          {session.bills.map((bill) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <li
              key={bill.id}
              style={{
                marginBottom: 20,
              }}
              onClick={() => {
                if (activeBill !== bill.id) {
                  setActiveBill(bill.id);
                  setActiveSummary("short");
                  answerFetcher.data = null;
                }
              }}
            >
              <div className="flex">
                <span className="font-bold cursor-pointer">{bill.name}</span>
                <span
                  className="text-gray-400 italic"
                  style={{
                    paddingLeft: 10,
                  }}
                >
                  ({bill.stage})
                </span>
              </div>
              {activeBill === bill.id && (
                <div className="mt-4 relative">
                  <div
                    className="flex items-center space-x-2 mb-2 absolute"
                    style={{ left: -40, top: -40, flexDirection: "column" }}
                  >
                    <button
                      type="button"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                      style={{
                        display: "block",
                        width: 20,
                        height: 20,
                        margin: 3,
                        lineHeight: 0.8,
                        fontSize: 8,
                      }}
                      onClick={() => {
                        handleZoom(
                          bill.id,
                          activeSummary === "short" ? "medium" : "long"
                        );
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                      style={{
                        display: "block",
                        width: 20,
                        height: 20,
                        margin: 3,
                        lineHeight: 0.8,
                        fontSize: 8,
                      }}
                      onClick={() => {
                        handleZoom(
                          bill.id,
                          activeSummary === "long" ? "medium" : "short"
                        );
                      }}
                    >
                      -
                    </button>
                  </div>
                  <ReactMarkdown>
                    {`Showing ${activeSummary} summary for ${bill.name}:`}
                  </ReactMarkdown>
                  <div>
                    {/* an input to ask a question, and section with the answer */}
                    <div className="mt-4">
                      <Form
                        className="flex space-x-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAskQuestion(bill.id, "Ask a question");
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Ask a question"
                          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Ask
                        </button>
                      </Form>
                      <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <ReactMarkdown className="prose">
                          {answerFetcher.data?.answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
