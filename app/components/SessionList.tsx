import { Link } from "@remix-run/react";
import type { InferSelectModel } from "drizzle-orm";
import type { sessionDB } from "~/data/schema";

export type Session = InferSelectModel<typeof sessionDB>;

interface SessionListProps {
  sessions: Session[];
}

export default function SessionList({ sessions }: SessionListProps) {
  return (
    <ul className="space-y-2">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="bg-white shadow rounded-lg p-4 flex items-center justify-between"
        >
          <Link
            to={`/session/${session.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {session.name}
          </Link>
          {session.id === "b015fab5-6ca3-45a1-8b37-ec209d439626" && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              LIVE
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
