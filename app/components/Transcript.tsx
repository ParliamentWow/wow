import { useState, useEffect } from "react";
import { useRevalidator } from "@remix-run/react";
import { getTranscript } from "~/utils/api.server";

interface TranscriptProps {
  sessionId: string;
  isLive: boolean;
}

export default function Transcript({ sessionId, isLive }: TranscriptProps) {
  const [transcript, setTranscript] = useState("");
  const revalidator = useRevalidator();

  useEffect(() => {
    const fetchTranscript = async () => {
      const data = await getTranscript(sessionId);
      setTranscript(data);
    };

    fetchTranscript();
    if (isLive) {
      const interval = setInterval(() => revalidator.revalidate(), 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [sessionId, isLive, revalidator]);

  return (
    <div className="transcript bg-white shadow rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">Transcript</h3>
      <pre className="whitespace-pre-wrap">{transcript}</pre>
    </div>
  );
}
