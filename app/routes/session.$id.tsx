import { type LoaderFunction, json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import Transcript from "~/components/Transcript";
import VideoPlayer from "~/components/VideoPlayer";
// import ChatRoom from "~/components/ChatRoom";
// import QuestionArea from "~/components/QuestionArea";
import { getSessionById } from "~/utils/api.server";

interface Session {
  id: string;
  title: string;
  videoUrl: string;
  isLive: boolean;
}

interface LoaderData {
  session: Session;
}

export const loader: LoaderFunction = async ({ params }) => {
  const session = await getSessionById(params.id as string);
  return json<LoaderData>({ session });
};

export default function SessionPage() {
  const { session } = useLoaderData<LoaderData>();
  const [activeTab, setActiveTab] = useState<
    "transcript" | "chat" | "questions"
  >("transcript");

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
      >
        &larr; Back to Homepage
      </Link>
      <h1 className="text-3xl font-bold mb-6">{session.title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="video-container">
          <VideoPlayer videoUrl={session.videoUrl} isLive={session.isLive} />
        </div>
        <div className="interaction-area">
          <div className="tabs flex mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 ${
                activeTab === "transcript"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Transcript
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 ${
                activeTab === "chat" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2 ${
                activeTab === "questions"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Questions
            </button>
          </div>
          <div className="tab-content">
            {activeTab === "transcript" && (
              <Transcript sessionId={session.id} isLive={session.isLive} />
            )}
            {activeTab === "chat" && <ChatRoom sessionId={session.id} />}
            {activeTab === "questions" && (
              <QuestionArea sessionId={session.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatRoom({ sessionId }: { sessionId: string }) {
  return <div>Chat Room</div>;
}

function QuestionArea({ sessionId }: { sessionId: string }) {
  return <div>Question Area</div>;
}
