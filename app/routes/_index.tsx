import { type LoaderFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import SessionList from "~/components/SessionList";
import { getPastSessions, getUpcomingSessions } from "~/utils/api.server";

interface Session {
  id: string;
  title: string;
  date: string;
}

interface LoaderData {
  upcomingSessions: Session[];
  pastSessions: Session[];
}

export const loader: LoaderFunction = async () => {
  const [upcomingSessions, pastSessions] = await Promise.all([
    getUpcomingSessions(),
    getPastSessions(),
  ]);
  return json<LoaderData>({ upcomingSessions, pastSessions });
};

export default function Index() {
  const { upcomingSessions, pastSessions } = useLoaderData<LoaderData>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        <img
          src="/wow.png"
          alt="Parliament Wow"
          className="w-10 h-10 inline-block mr-2"
        />
        Parliament Wow
      </h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
          <SessionList sessions={upcomingSessions} />
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          <SessionList sessions={pastSessions} />
        </section>
      </div>
    </div>
  );
}
