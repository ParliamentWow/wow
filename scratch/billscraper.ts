import { xml2json } from "xml-js";
import { parse } from "node:path";
import { writeFileSync } from "node:fs";
import pRetry from "p-retry";

const baseUrl = "https://bills.parliament.uk";
let billId = 3739;

export interface RssItem {
  guid: GUID;
  link: Category;
  category: Category;
  title: Category;
  description: Category;
  pubDate: Category;
  "p4:Stage": Category;
}

export interface Category {
  _text: string;
}

export interface GUID {
  _attributes: Attributes;
  _text: string;
}

export interface Attributes {
  isPermaLink: string;
}

type Sessions = Record<
  string,
  {
    id: string;
    name: string;
    stage: string;
    documents: { name: string; url: string[]; type: string }[];
  }[]
>;

const sessions: Sessions = {};

function parseSittingToReadable(item: RssItem) {
  const id = item.guid._text.split("/").pop();
  const title = item.title._text;
  const session = title.split(" - ")[1];
  const billAttempt1 = item.description._text.includes(" Bill:")
    ? item.description._text.split(" Bill:")[0]
    : null;
  const billAttempt2 = item.description._text.includes(" 2024:")
    ? item.description._text.split(" 2024:")[0]
    : null;
  return {
    id,
    session,
    bill: billAttempt1 || billAttempt2,
    title: title,
    description: item.description._text,
    pubDate: item.pubDate._text,
    stage: item["p4:Stage"]._text,
  };
}

function parsePublicationToReadable(item: RssItem) {
  const path = item.link._text;
  const file = parse(path);
  return {
    title: item.title._text,
    description: item.description._text,
    format: file.ext || "html",
    url: item.link._text,
    pubDate: item.pubDate._text,
  };
}

async function runBillScraper() {
  let hasBill = true;
  while (hasBill) {
    let promises: Promise<undefined>[] = [];

    const batch = [billId, billId - 1, billId - 2, billId - 3, billId - 4, billId - 5, billId - 6, billId - 7, billId - 8, billId - 9];

    console.log(`Scraping batch: ${batch}`);
    for (const bill of batch) {
      promises.push(scrapeBill(bill).catch((e) => {
        console.error(bill);
        return undefined;
      }));
    }

    await Promise.all(promises);
    billId = billId - 10;

    if (billId < 0) {
      hasBill = false;
    }
  }

  console.log(sessions);

  writeFileSync("bills.json", JSON.stringify(sessions, null, 4));
}

runBillScraper();

async function scrapeBill(billId: number) {
  const response = await pRetry(() =>
    fetch(`${baseUrl}/rss/bills/${billId}.rss`)
  );
  if (!response) {
    return undefined;
  }
  const data = await response.text();
  if (data.includes("The resource Bill ID:")) {
    console.error(data);
    return undefined;
  }

  const json = xml2json(data, { compact: true, spaces: 4 });
  const parsed = JSON.parse(json);

  const billTitle = parsed.rss.channel.title._text;
  if (Array.isArray(parsed.rss.channel.item)) {
    const publications = parsed.rss.channel.item.filter(
      (el) => el.category._text === "Publication"
    );
    // console.log(JSON.stringify(sittings[0], null, 4))
    const settings = parsed.rss.channel.item.filter(
      (el) => el.category._text === "Sitting"
    );

    const readablePublications = publications.map(parsePublicationToReadable);
    const readableSittings = settings.map(parseSittingToReadable) as ReturnType<
      typeof parseSittingToReadable
    >[];

    for (const sitting of readableSittings) {
        const date = new Date(sitting.session).toISOString().split("T")[0];
      if (sessions[date]) {
        sessions[date].push({
          id: sitting.id as string,
          name: billTitle,
          stage: sitting.stage,
          documents: readablePublications,
        });
      } else {
        sessions[date] = [
          {
            id: sitting.id as string,
            name: billTitle,
            stage: sitting.stage,
            documents: readablePublications,
          },
        ];
      }
    }
  } else {
    if (parsed.rss.channel.item.category._text === "Sitting") {
      const sitting = parseSittingToReadable(parsed.rss.channel.item);
      const date = new Date(sitting.session).toISOString().split("T")[0];
      if (sessions[date]) {
        sessions[date].push({
          id: sitting.id as string,
          name: billTitle,
          stage: sitting.stage,
          documents: [],
        });
      } else {
        sessions[date] = [
          {
            id: sitting.id as string,
            name: billTitle,
            stage: sitting.stage,
            documents: [],
          },
        ];
      }
    }
  }
}
