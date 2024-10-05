import data from "../data/data.json";

export interface Session {
  id: string;
  title: string;
  date: string;
  videoUrl: string;
  isLive: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
}

export async function getUpcomingSessions(): Promise<Session[]> {
  return data.upcomingSessions;
}

export async function getPastSessions(): Promise<Session[]> {
  return data.pastSessions;
}

export async function getLiveSessions(): Promise<Session[]> {
  return data.liveSessions;
}

export async function getSessionById(id: string): Promise<Session> {
  const session =
    data.sessionDetails[id] ||
    data.upcomingSessions.find((s) => s.id === id) ||
    data.pastSessions.find((s) => s.id === id) ||
    data.liveSessions.find((s) => s.id === id);

  if (!session) {
    throw new Error(`Session with id ${id} not found`);
  }

  return session;
}

export async function getTranscript(sessionId: string): Promise<string> {
  const session = data.sessionDetails[sessionId];
  return session?.transcript || "Transcript not available.";
}

export async function getChatMessages(
  sessionId: string
): Promise<ChatMessage[]> {
  const session = data.sessionDetails[sessionId];
  return session?.chatMessages || [];
}

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<void> {
  console.log(`Sending message for session ${sessionId}: ${message}`);
  // In a real application, you would send this to your backend
}

export async function askQuestion(
  sessionId: string,
  question: string
): Promise<string> {
  console.log(`Asking question for session ${sessionId}: ${question}`);
  return "This is a simulated answer to your question.";
}
