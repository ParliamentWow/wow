import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import SessionList, { type Session } from "~/components/SessionList";
import { getD1Client } from "~/data";

// interface LoaderData {
//   sessions: Session[];
// }

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const db = getD1Client(context.env);
  const sessions = await db.query.sessionDB.findMany();
  return json({ sessions });
};

export default function Index() {
  const { sessions } = useLoaderData<typeof loader>();
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
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          <SessionList sessions={sessions as unknown as Session[]} />
        </section>
      </div>
    </div>
  );
}
