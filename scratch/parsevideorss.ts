const url = "https://data.parliamentlive.tv/api/event/feed";
import { xml2json } from "xml-js";

async function parseVideoRss() {
  const response = await fetch(url);
  const xml = await response.text();
  const json = xml2json(xml, { compact: true, spaces: 4 });
  const parsed = JSON.parse(json);

  console.log(
    JSON.stringify(
      parsed.feed.entry.map((entry: any) => ({
        url: entry._attributes["xml:base"],
        date: new Date(entry.updated._text).toISOString().split("T")[0],
        room: entry.title._text,
      }))
    )
  );
}

parseVideoRss();
