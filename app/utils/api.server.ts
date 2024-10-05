import data from "../data/data.json";

export interface Session {
  id: string;
  title: string;
  date: string;
  videoUrl: string;
  isLive: boolean;
  status: "live" | "upcoming" | "past" | string;
}

export async function getSessions(): Promise<Session[]> {
  return data.sessions;
}

export async function getSessionById(id: string): Promise<Session> {
  const session = data.sessions.find((s) => s.id === id);

  if (!session) {
    throw new Error(`Session with id ${id} not found`);
  }

  return session;
}
