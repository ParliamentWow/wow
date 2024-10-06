import * as fs from "node:fs";
import * as path from "node:path";
import pLimit from "p-limit";

const limit = pLimit(20); // Set concurrency to 20

async function processBill(bill: any) {
  const promises = bill.documents.map((document: any) =>
    limit(async () => {
      const target = `${bill.id}-${document.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;

      if (
        fs.existsSync(
          path.join(__dirname, "scratch/dest", `${target.slice(0, 70)}.pdf`)
        ) ||
        fs.existsSync(
          path.join(__dirname, "scratch/dest", `${target.slice(0, 70)}.html`)
        )
      ) {
        console.log("skipping", target);
        return;
      }
      try {
        const res = await fetch(document.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        });

        if (!res.ok) {
          console.log("failed", document.url, res.status);
          return;
        }

        const contentType = res.headers.get("Content-Type")!;
        const type = contentType.includes("pdf") ? "bytes" : "text";
        const content = await res[type]();

        fs.writeFileSync(
          path.join(
            __dirname,
            "scratch/dest",
            `${target.slice(0, 70)}.${type === "bytes" ? "pdf" : "html"}`
          ),
          content,
          {
            encoding: type === "bytes" ? "binary" : "utf-8",
          }
        );
        console.log("wrote", target);
      } catch (e) {
        console.log("failed to write", target, e);
      }
    })
  );

  await Promise.all(promises);
}

async function main() {
  const files = fs.readdirSync(path.join(__dirname, "scratch/bills"));
  for (const text of files) {
    const bills = JSON.parse(
      fs.readFileSync(path.join(__dirname, "scratch/bills", text), "utf8")
    );
    await Promise.all(bills.map(processBill));
  }
  console.log("done");
}

main().catch(console.error);
