import json
import re
import uuid
from pathlib import Path

from modal import App, Image, Mount
from pydantic import BaseModel
from utils.clean import remove_excessive_whitespace
from utils.html import parse_html_text

app = App("html-cleaning")
image = Image.debian_slim().pip_install(
    "requests", "html2text", "pydantic", "langchain_text_splitters"
)

bill_mount = Mount.from_local_dir("../bills", remote_path="/bills")
json_mount = Mount.from_local_dir("../bills_json", remote_path="/json")


# before pushing add this to the main doc
class Metadata(BaseModel):
    title: str
    description: str
    url: str
    publishDate: str
    chunkId: str | None = None
    id: str


class Document(BaseModel):
    metadata: Metadata
    content: str


def get_metadata(name: str, bill: dict) -> Metadata:
    # do some stuff to get the metadata
    docs = bill["documents"]
    for doc in docs:
        title = re.sub(r"[^a-zA-Z0-9]", "_", doc["title"])
        title = title[:70]  # Slice to 70 characters
        title = f"{bill['id']}-{title}"

        # parse the name to remove anything after the last space
        name = name.split(" ")[0]

        if name in title:
            return Metadata(
                title=doc["title"],
                description=doc["description"],
                url=doc["url"],
                publishDate=doc["pubDate"],
                id=str(uuid.uuid4()),
            )

    raise ValueError(f"No metadata found for {name}")


@app.function(image=image, mounts=[json_mount, bill_mount], timeout=86400)
def doc_processor(file: Path) -> Document | None:
    import requests
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    with open(file, "r") as f:
        content = f.read()

    name = file.stem
    markdown = parse_html_text(content)
    text = remove_excessive_whitespace(markdown)

    bill_id = name.split("-")[0]
    with open(f"/json/{bill_id}.json", "r") as f:
        bill = json.load(f)
        metadata = get_metadata(name, bill)

    if not metadata:
        raise ValueError(f"No metadata found for {name}")

    doc = Document(content=text, metadata=metadata)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
    )

    chunks = splitter.split_text(doc.content)

    for chunk in chunks:
        res = requests.post(
            "https://parliament-wow.threepointone.workers.dev/api/documents",
            json={
                "id": metadata.id,
                "title": metadata.title,
                "description": metadata.description,
                "url": metadata.url,
                "content": chunk,
                "publishDate": metadata.publishDate,
                "chunkId": str(uuid.uuid4()),
            },
        )
        if res.status_code != 201:
            raise ValueError(f"Failed to upload document {name} with chunk {chunk}")


@app.function(image=image, mounts=[bill_mount], timeout=86400)
def controller(start_from_id: str | None = None) -> list[Document]:
    # Get all HTML files in the mounted bills directory
    html_files = list(Path("/bills").glob("**/*.html"))

    sorted_html_files = sorted(html_files, key=lambda f: f.name.split("-")[0])

    # Filter files if start_from_id is provided
    if start_from_id:
        sorted_html_files = [
            f for f in sorted_html_files if f.name.split("-")[0] >= start_from_id
        ]

    # Process all HTML files
    for doc in doc_processor.map(sorted_html_files, order_outputs=False):
        if isinstance(doc, Exception):
            break


@app.local_entrypoint()
def main():
    start_from_id = str(3733)

    controller.remote(start_from_id)
