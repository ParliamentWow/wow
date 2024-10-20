import React from "react";

const CardWithHeaderAndFooter = ({
  innerRef,
  header,
  menu,
  content,
  footer,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  header: React.ReactNode;
  menu: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={innerRef}>
      {/* We've used 3xl here, but feel free to try other max-widths based on your needs */}
      <div className="mx-auto max-w-3xl">
        <div className="bg-gray-50 border-solid border-gray-300 border-[1px] shadow-2xl p-1 rounded-2xl">
          <div className="overflow-hidden rounded-xl bg-white border-solid border-[1px] border-gray-300">
            <div className="px-4 py-4 sm:px-6 border-b-gray-200 border-solid border-b-[1px] hover:bg-gray-100 *:hover:bg-gray-100">{header}</div>
            <div className="px-4 py-4 sm:px-6 border-b-gray-200 border-solid border-b-[1px]">
              {menu}
            </div>
            <div className="p-4 max-h-64 overflow-auto">{content}</div>
            {footer && <div className="px-4 py-4 sm:px-6">{footer}</div>}
          </div>
        </div>
      </div>
    </div >
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

const sittings = [
  {
    id: 14,
    location: "House of Commons",
    name: "27th October 2024",
  },
  {
    id: 13,
    location: "House of Commons",
    name: "26th October 2024",
  },
  {
    id: 12,
    location: "House of Commons",
    name: "25th October 2024",
  },
  {
    id: 11,
    location: "House of Commons",
    name: "24th October 2024",
  },
  {
    id: 10,
    location: "House of Commons",
    name: "23rd October 2024",
  },
  {
    id: 9,
    location: "House of Commons",
    name: "22nd October 2024",
  },
  {
    id: 8,
    location: "House of Commons",
    name: "21st October 2024",
  },
  {
    id: 7,
    location: "House of Commons",
    name: "20th October 2024",
  },
  {
    id: 6,
    location: "House of Commons",
    name: "19th October 2024",
  },
  {
    id: 5,
    location: "House of Commons",
    name: "18th October 2024",
  },
  {
    id: 4,
    location: "House of Commons",
    name: "17th October 2024",
  },
  {
    id: 3,
    location: "House of Commons",
    name: "16th October 2024",
  },
  {
    id: 2,
    location: "House of Commons",
    name: "15th October 2024",
  },
  {
    id: 1,
    location: "House of Commons",
    name: "14th October 2024",
  },
];


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
        <input
          className="w-full focus:outline-none text-lg"
          placeholder="Search 100+ Parliamentary sittings..."
        />
      }
      menu={
        <div className="flex space-x-2">
          <button className="px-2 py-1 bg-green-900 text-white rounded-lg hover:bg-green-800">
            House of Commons
          </button>
          <button className="px-2 py-1 bg-red-900 text-white rounded-lg hover:bg-red-800">
            House of Lords
          </button>
          <button className="px-2 py-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
            Committees
          </button>
        </div>
      }
      content={
        loading ? (
          <SummarySkeleton />
        ) : (
          <div className="">
            <div className="p-1 text-gray-400 font-bold">Sittings</div>
            <div className="flex flex-col gap-2">
              {sittings.map((sitting) => (
                <button
                  key={sitting.id}
                  className="group flex items-center justify-between p-2 hover:bg-gray-100 rounded-xl  transition-all duration-100 ease-in-out"
                >
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-900">{sitting.name}</div>
                    <div className="text-sm text-gray-600">{sitting.location}</div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-600 h-6 w-6 transform transition-transform duration-100 ease-in-out group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
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
