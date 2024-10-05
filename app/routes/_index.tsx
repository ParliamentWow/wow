import { type LoaderFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import SessionList from "~/components/SessionList";
import { type Session, getSessions } from "~/utils/api.server";

interface LoaderData {
  sessions: Session[];
}

export const loader: LoaderFunction = async () => {
  const sessions = await getSessions();

  return json<LoaderData>({ sessions });
};

export default function Index() {
  const { sessions } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold flex items-center">
          <img
            src="/wow.png"
            alt="Parliament Wow"
            className="w-10 h-10 inline-block mr-2"
          />
          Parliament Wow
        </h1>
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Live Sessions</h2>
          <SessionList sessions={sessions.filter((s) => s.isLive)} />
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          <SessionList sessions={sessions.filter((s) => s.status === "past")} />
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
          <SessionList
            sessions={sessions.filter((s) => s.status === "upcoming")}
          />
        </section>
      </div>
    </div>
  );
}
