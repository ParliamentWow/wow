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
import { Suspense, useState } from "react";
import { Footer, Layout, Navigation } from "~/components/Layout";
import SessionList, { type Session } from "~/components/SessionList";
import InteractiveSummary, {
  InteractiveSummarySkeleton,
} from "~/components/InteractiveSummary";
import { getD1Client } from "~/data";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  return json({ message: "hi" });
};

export default function Index() {
  const { message } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div>
      <div className="bg-[url('/parliament.jpg')] bg-cover">
        <Navigation />
        <div className="mx-auto max-w-2xl py-32 sm:py-36 lg:py-42">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="flex gap-1 relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              Announcing our Build Back Britain a16z London hackathon win!
              <a
                href="https://www.linkedin.com/posts/mattzcarey_i-still-cant-believe-we-won-andreessen-activity-7249093301495037953-GRKA"
                className="font-semibold text-blue-800"
              >
                <span aria-hidden="true" className="absolute inset-0" />
                Read more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your AI powered Parliamentary Assistant
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui
              lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat
              fugiat aliqua.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="rounded-md bg-blue-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Get started
              </a>
              <a
                href="#"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <InteractiveSummarySkeleton />
        </Suspense>
        <div className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="relative isolate flex flex-col gap-10 overflow-hidden bg-gray-900 bg-opacity-70 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:flex-row xl:items-center xl:py-32">
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl xl:max-w-none xl:flex-auto">
                Get notified when we’re launching.
              </h2>
              <form className="w-full max-w-md">
                <div className="flex gap-x-4">
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
                  />
                  <button
                    type="submit"
                    className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Notify me
                  </button>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-300">
                  We care about your data. Read our{" "}
                  <a href="#" className="font-semibold text-white">
                    privacy&nbsp;policy
                  </a>
                  .
                </p>
              </form>
              <svg
                viewBox="0 0 1024 1024"
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2"
              >
                <circle
                  r={512}
                  cx={512}
                  cy={512}
                  fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
                  fillOpacity="0.7"
                />
                <defs>
                  <radialGradient
                    r={1}
                    cx={0}
                    cy={0}
                    id="759c1415-0410-454c-8f7c-9a820de03641"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(512 512) rotate(90) scale(512)"
                  >
                    <stop stopColor="#7775D6" />
                    <stop offset={1} stopColor="#E935C1" stopOpacity={0} />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
