import { Link } from "@remix-run/react";

interface Session {
  id: string;
  title: string;
  date: string;
}

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
            {session.title} - {new Date(session.date).toLocaleString()}
          </Link>
        </li>
      ))}
    </ul>
  );
}
