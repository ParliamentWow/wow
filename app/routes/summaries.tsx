import {
    type LoaderFunction,
    type LoaderFunctionArgs,
    json,
  } from "@remix-run/cloudflare";
  import {
    Form,
    redirect,
    useLoaderData,
    useSearchParams,
  } from "@remix-run/react";
  import { useState } from "react";
  import SessionList, { type Session } from "~/components/SessionList";
  import { getD1Client } from "~/data";
  
  import * as turbopuffer from "../api/ai/turbopuffer";
  
  // interface LoaderData {
  //   sessions: Session[];
  // }
  
  export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    const db = getD1Client(context.env);
    const sessions = await db.query.sessionDB.findMany();
    const url = new URL(request.url);
    const query = url.searchParams;
    console.log({ query });
  
    if (query.get("search")) {
      console.log("searching", query.get("search"));
      const response = await context.env.AI.run("@cf/baai/bge-large-en-v1.5", {
        text: query.get("search"),
      });
  
      try {
        const res = await turbopuffer.query(
          context.env,
          "trascription",
          response.data[0]
        );
  
        return json({
          message: "Sessions fetched",
          sessions: res.map((r) => sessions.find((s) => (s.id = r.sessionId))),
        });
      } catch (e) {
        console.error(e);
      }
    }
    return json({ sessions });
  };
  
  export default function Index() {
    const { sessions } = useLoaderData<typeof loader>();
    const [searchTerm, setSearchTerm] = useState("");
  
    const [query] = useSearchParams();
    console.log(query.get("search"));
  
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
          <Form>
            <input
              name="search"
              type="text"
              placeholder="Search sessions..."
              defaultValue={query.get("search") || ""}
              // value={searchTerm}
              // onChange={(e) => setSearchTerm(e.target.value)}
              // onSubmit={(e) => {
              //   e.preventDefault();
              //   // set the query string to the search term
              //   console.log(searchTerm);
              //   const url = new URL(window.location.href);
              //   url.searchParams.set("search", searchTerm);
              //   return redirect(url.toString());
              // }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Form>
        </div>
        <div className="space-y-8">
          <section>
            <SessionList sessions={sessions as unknown as Session[]} />
          </section>
        </div>
      </div>
    );
  }
  