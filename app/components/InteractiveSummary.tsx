import React from "react";

const CardWithHeaderAndFooter = ({
  innerRef,
  header,
  content,
  footer,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  header: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={innerRef}>
      {/* We've used 3xl here, but feel free to try other max-widths based on your needs */}
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-lg bg-gray-900 bg-opacity-70 shadow">
          <div className="px-4 py-4 sm:px-6">{header}</div>
          <div className="px-4 py-4 sm:p-6">{content}</div>
          {footer && <div className="px-4 py-4 sm:px-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

const SummarySkeleton = () => {
  return (
    <div className="animate-pulse flex space-x-4">
      <div className="flex-1 space-y-4 py-1">
        <div className="h-3 text-gray-600 rounded w-2/5">
          Generating AI Summary
        </div>
        <div className="h-3 bg-gray-800 rounded w-4/5"></div>
        <div className="h-3 bg-gray-800 rounded w-3/5"></div>
        <div className="h-3 bg-gray-800 rounded w-4/5"></div>
        <div className="h-3 bg-gray-800 rounded w-2/5"></div>
        <div className="h-3 bg-gray-800 rounded w-5/5"></div>
        <div className="h-3 bg-gray-800 rounded w-1/5"></div>
      </div>
    </div>
  );
};
export const InteractiveSummarySkeleton = () => {
  const [loading, setLoading] = React.useState(true);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        if (
          rect.top >= 0 &&
          rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight)
        ) {
          const timer = setTimeout(() => {
            setLoading(false);
          }, 2000); // 2 seconds delay

          return () => clearTimeout(timer);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check if already in view

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <CardWithHeaderAndFooter
      innerRef={ref}
      header={
        <div className="text-lg font-semibold text-gray-900">
          Latest Session: House of Commons - Thursday 17 October 2024
        </div>
      }
      content={
        loading ? (
          <SummarySkeleton />
        ) : (
          <div>
            <div>
              <p className="text-base text-gray-700">
                The latest parliamentary session covered several key topics and
                discussions. Here is a brief summary:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 text-gray-700">
                <li>
                  Discussion on the new healthcare reform bill and its
                  implications.
                </li>
                <li>Debate on the proposed changes to the education system.</li>
                <li>
                  Review of the recent economic performance and future
                  projections.
                </li>
                <li>Updates on international relations and foreign policy.</li>
                <li>Questions and answers session with the Prime Minister.</li>
              </ul>
              <div className="mt-4">
                <a href="#" className="text-blue-800 hover:underline">
                  Read the full transcript
                </a>
              </div>
              <div className="mt-2">
                <a href="#" className="text-blue-800 hover:underline">
                  Watch the session video
                </a>
              </div>
            </div>
          </div>
        )
      }
      footer={
        !loading && (
          <div className="flex flex-col space-y-4">
            <textarea
              placeholder="Ask a question about this sitting..."
              className="flex-grow px-4 py-2 border rounded resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }
              }}
            />
            <button className="px-4 py-2 bg-blue-800 text-white rounded self-end">
              Submit
            </button>
          </div>
        )
      }
    />
  );
};

const InteractiveSummary = () => {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6">
        {/* Content goes here */}
        {/* We use less vertical padding on card headers on desktop than on body sections */}
      </div>
      <div className="px-4 py-5 sm:p-6">{/* Content goes here */}</div>
      <div className="px-4 py-4 sm:px-6">
        {/* Content goes here */}
        {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
      </div>
    </div>
  );
};

export default InteractiveSummary;
