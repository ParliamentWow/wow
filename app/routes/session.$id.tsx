import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { Form, Link, useFetcher, useLoaderData } from "@remix-run/react";
import { eq, is } from "drizzle-orm";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getD1Client } from "~/data";
import { sessionDB } from "~/data/schema";

import { Suspense } from "react";
import { suspend } from "suspend-react";
import { useChunkedContent } from "./fetch-chunked";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function debounce(fn: () => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      return fn(...args);
    }, wait);
  };
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

export const action = async ({ request }: ActionFunctionArgs) => {
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
  const [activeBill, setActiveBill] = useState<string>();

  const [question, setQuestion] = useState<string>();

  const debouncedSetQuestion = debounce(setQuestion, 1000);

  const [summaries, setSummaries] = useState<
    Record<string, Record<"short" | "medium" | "long", string>>
  >({});

  const [activeSummary, setActiveSummary] = useState<
    "short" | "medium" | "long"
  >("short");

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

      {/* Video and Transcription section */}
      <div className="flex space-x-4 mb-4">
        <div
          className={`${session.id === "b015fab5-6ca3-45a1-8b37-ec209d439626" ? "w-2/3" : "w-full"} relative`}
        >
          {session.id === "b015fab5-6ca3-45a1-8b37-ec209d439626" && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-bold z-10">
              LIVE
            </div>
          )}
          <iframe
            title="Parliament Wow"
            id="UKPPlayer"
            name="UKPPlayer"
            seamless={true}
            frameBorder={0}
            allow="encrypted-media; autoplay; fullscreen"
            src={`${session.videoUrl.replace(
              "https://parliamentlive.tv/event/index/",
              "https://videoplayback.parliamentlive.tv/Player/Index/"
            )}?audioOnly=False&autoStart=False&script=True`}
            width="100%"
            height="540px"
            allowFullScreen
          />
        </div>
        <div className="w-1/3">
          <h2 className="text-xl font-bold mb-2">Transcription</h2>
          <div
            className="h-[540px] overflow-y-auto bg-gray-100 p-4 rounded-md"
            style={{ overflowAnchor: "auto" }}
          >
            {/* Add your transcription content here */}
            <Transcription sessionId={session.id} />
          </div>
        </div>
      </div>

      {/* Updated layout: QnA section on the left (2/3), bills on the right (1/3) */}
      <div className="mt-4 flex">
        {/* QnA section */}
        <div className="w-2/3 pr-4">
          <h2 className="text-xl font-bold mb-2">
            What are they talking about?
          </h2>
          <Form
            className="flex flex-col space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              debouncedSetQuestion(e.target.question.value);
            }}
          >
            <input
              type="text"
              name="question"
              placeholder="Ask a question"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Ask
            </button>
          </Form>
          <Suspense fallback={<div>Loading...</div>}>
            <Summary
              sessionId={session.id}
              billName={activeBill}
              question={question}
              key={`${session.id}-${activeBill}-${question}`}
            />
          </Suspense>
        </div>

        {/* Bills section */}
        <div className="w-1/3 pl-4">
          <h2 className="text-xl font-bold mb-2">Bills being discussed:</h2>
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
                    // @ts-ignore
                    answerFetcher.data = null;
                    setActiveBill(bill.id);
                    setActiveSummary("short");
                  }
                }}
              >
                <div className="flex flex-col">
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
                            {"TODO: answer"}
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
    </div>
  );
}

const sampleRes = {
  message: "Summary fetched..",
  result: {
    response:
      " <debate_summary>\nThis parliamentary debate primarilyfocused on the importance of ensuring building safety, particularly in the aftermath of the Grenfell Tower tragedy. Members of parliament discussed recent fires and the slow progress in remedying defects, especially regarding cladding. Some expressed concern about the pace of remediation, the financial burden on leaseholders, and the role of developers in the crisis. Residents' displacement, insurance issues, and mortgage difficulties were also addressed. Some members advocated for stronger regulations, regulatory oversight, and industry responsibility.\n\nNotable quotes included calls for accountability, remedial actions, and the urgent need to address these issues.\n</debate_summary>\n\n<impact_analysis>\nThe speeches given during the debate highlighted the ongoing concerns about the safety of residential buildings, particularly for those in high-rise structures and already vulnerable populations. These impacts have immediate and ongoing effects, particularly on residents who face displacement, financial burdens, and emotional distress due to the lack of safety in their homes. Further, the government will likely face pressure to improve inspections, increase support for cladding removal, and further regulate the construction industry.\n\nLong-term consequences may include increased scrutiny of the housing sector, changes to legislation, and improved collaboration between the government, construction industry, and local communities to prevent such crises in the future.\n</impact_analysis>\n\n<citations>\n- Grenfell Tower Inquiry Report (Phase 1)\n- Housing, Communities and Local Government Statements\n- Written ministerial statements on building safety regulations\n</citations>",
  },
};

function Summary({
  sessionId,
  billName,
  question,
}: {
  sessionId: string;
  billName?: string;
  question?: string;
}) {
  // const [response, setResponse] = useState<string>('');

  const { content, isLoading } = useChunkedContent(
    "/api/summary",
    "POST",
    JSON.stringify({
      sessionId,
      billName: billName,
      question: question,
    })
  );

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-md">
      <div className="prose summary">
        {!content ? (
          <div>Loading...</div>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

function Transcription({ sessionId }: { sessionId: string }) {
  const { content, isLoading } = useChunkedContent(`/api/transcriptions/${sessionId}`);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  // if(isLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div
      ref={contentRef}
      className="flex flex-1 overflow-y flex-col"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
