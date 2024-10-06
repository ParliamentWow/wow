import concurrent.futures
import json
import re
import uuid
from pathlib import Path
from typing import List

from pydantic import BaseModel
from utils.clean import remove_excessive_whitespace


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


def pdf_processor(file: Path) -> Document | None:
    import io

    import requests
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from PyPDF2 import PdfReader

    try:
        # Read the file in binary mode
        with open(file, "rb") as f:
            content = f.read()

        name = file.stem
        pdf_reader = PdfReader(io.BytesIO(content))
        text = "\n".join(page.extract_text() for page in pdf_reader.pages)
        text = remove_excessive_whitespace(text)

        bill_id = name.split("-")[0]
        with open(f"../bills_json/{bill_id}.json", "r") as f:
            bill = json.load(f)
            metadata = get_metadata(name, bill)

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

        return doc
    except Exception as e:
        print(f"Error processing file {file.name}: {str(e)}")
        return None


def controller(start_from_id: str | None = None) -> List[Document]:
    docs: List[Document] = []
    # Get all PDF files in the mounted bills directory
    pdf_files = list(Path("../bills").glob("**/*.pdf"))

    # Sort files by ID (assuming ID is at the start of the filename before the first hyphen)
    sorted_pdf_files = sorted(pdf_files, key=lambda f: f.stem.split("-")[0])

    # If start_from_id is provided, filter the files
    if start_from_id:
        sorted_pdf_files = [
            f for f in sorted_pdf_files if f.stem.split("-")[0] >= start_from_id
        ]

    # Process files in batches of 5
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for file in sorted_pdf_files:
            future = executor.submit(pdf_processor, file)
            futures.append(future)

        # Collect results as they complete
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                if result is not None:
                    docs.append(result)
            except Exception as e:
                print(f"Error processing file: {str(e)}")
                # Print the ID of the file that caused the error
                error_file = sorted_pdf_files[len(docs)]
                print(f"Error occurred at file ID: {error_file.stem.split('-')[0]}")

    return docs


if __name__ == "__main__":
    start_from_id = input(
        "Enter the document ID to start from (or press Enter to start from the beginning): "
    ).strip()
    start_from_id = start_from_id if start_from_id else None

    docs = controller(start_from_id)
    if docs:
        print(f"Processed {len(docs)} documents.")
        print(f"First document: {docs[0]}")
        print(f"Last document: {docs[-1]}")
    else:
        print("No documents processed.")
