import * as fs from "fs";
import * as path from "path";

for (const text of fs.readdirSync(path.join(__dirname, "scratch/bills"))) {
  const bills = JSON.parse(
    fs.readFileSync(path.join(__dirname, "scratch/bills", text), "utf8")
  );
  for (const bill of bills) {
    for (const document of bill.documents) {
      const target = `${bill.id}-${document.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;
      const res = await fetch(document.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });
      if (!res.ok) {
        console.log("failed", document.url, res.status);
        continue;
      }
      const contentType = res.headers.get("Content-Type")!;

      const type = contentType.includes("pdf") ? "bytes" : "text";
      const content = await res[type]();
      try {
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
        console.log("failed to write", target);
      }
    }
  }
}
