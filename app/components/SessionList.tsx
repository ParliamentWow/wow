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
        <li key={session.id} className="bg-white shadow rounded-lg p-4">
          <Link
            to={`/session/${session.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {session.name} - {new Date(session.timestamp).toLocaleString()}
          </Link>
        </li>
      ))}
    </ul>
  );
}
