import { useEffect, useState } from "react";

export const useChunkedContent = (url: string) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setContent("");

      try {
        const response = await fetch(url);
        const reader = response.body?.getReader();
        if (!reader) {
          setIsLoading(false);
          setContent("Could not fetch content");
          return;
        }
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setContent((prevContent) => prevContent + chunk);
        }
      } catch (error) {
        console.error("Error fetching chunked content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      // If needed, you can add cleanup logic here
    };
  }, [url]);

  return { content, isLoading };
};
