import json
import logging
import re
import time
from itertools import groupby

import requests
from modal import App, Image
from pydantic import BaseModel

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = App("parliament-live-transcripts")
image = Image.debian_slim().pip_install(
    "requests", "pydantic", "ulid-py", "langchain_text_splitters"
)
browser_image = (
    Image.debian_slim()
    .pip_install("selenium", "requests", "webdriver-manager")
    .run_commands(
        "apt-get update",
        "apt-get install -y chromium chromium-driver",
        "apt-get clean",
        "rm -rf /var/lib/apt/lists/*",
    )
)


class SubtitleEntry(BaseModel):
    sessionId: str
    id: str
    timestampStart: int  # TODO: milliseconds from start of session
    timestampEnd: int  # TODO: milliseconds from start of session
    content: str


@app.function(image=image, timeout=50000)
def fetch_subtitles(base_url: str, index: int, session_id: str) -> SubtitleEntry:
    import ulid

    url = f"{base_url}-{index}.webvtt"

    response = requests.get(url)
    if not response.ok:
        raise Exception(
            f"Failed to fetch subtitles. Possibly reached the end at index {index}."
        )
    content = response.text
    if not content:
        raise Exception(
            f"Failed to fetch subtitles. Possibly reached the end at index {index}."
        )

    lines = content.split("\n")

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Check if the line is an ID (purely numeric)
        if line.isdigit():
            i += 1

            # Next line should be the timestamp
            if i < len(lines):
                timestamp_line = lines[i].strip()
                match = re.match(
                    r"(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})",
                    timestamp_line,
                )
                if match:
                    i += 1

                    # Collect the content
                    content = []
                    while (
                        i < len(lines)
                        and lines[i].strip()
                        and not lines[i].strip().isdigit()
                    ):
                        content.append(lines[i].strip())
                        i += 1

                    subtitle_entry = SubtitleEntry(
                        id=str(ulid.new()),
                        timestampStart=0,
                        timestampEnd=0,
                        content=" ".join(content),
                        sessionId=session_id,
                    )

                    return subtitle_entry
        i += 1


@app.function(image=image)
def send_to_api(data: SubtitleEntry, api_url: str) -> None:
    try:
        response = requests.post(api_url, json=data.dict())
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to send subtitle ID {data.id} to API: {e}")


@app.function(image=browser_image)
def extract_vtt_url(base_page_url: str) -> str:
    """
    Extracts the VTT URL from the given base page URL using Selenium with Chrome.

    Args:
        base_page_url (str): The base URL of the page containing the VTT link.

    Returns:
        str: The extracted VTT URL.

    Raises:
        Exception: If the VTT URL cannot be extracted.
    """
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service

    def setup_driver():
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.set_capability(
            "goog:loggingPrefs", {"performance": "ALL", "browser": "ALL"}
        )
        options.binary_location = "/usr/bin/chromium"

        service = Service("/usr/bin/chromedriver")
        driver = webdriver.Chrome(service=service, options=options)
        return driver

    def capture_vtt_urls(driver, duration=10):
        vtt_urls = []
        start_time = time.time()
        while time.time() - start_time < duration:
            logs = driver.get_log("performance")
            for log in logs:
                try:
                    message = json.loads(log.get("message"))["message"]
                    if "Network.responseReceived" in message["method"]:
                        url = None
                        if "params" in message and "response" in message["params"]:
                            url = message["params"]["response"].get("url")
                        elif "params" in message and "request" in message["params"]:
                            url = message["params"]["request"].get("url")

                        if url and ".webvtt" in url and url not in vtt_urls:
                            vtt_urls.append(url)
                            logger.info(f"Found VTT URL: {url}")
                except Exception as e:
                    logger.error(f"Error processing log entry: {e}")
            time.sleep(0.1)
        return vtt_urls

    driver = setup_driver()
    try:
        logger.info(f"Navigating to URL: {base_page_url}")
        driver.get(base_page_url)
        time.sleep(5)

        vtt_urls = capture_vtt_urls(driver)

        if vtt_urls:
            logger.info(f"Found VTT URLs: {vtt_urls}")
            # Find the base URL by removing the segment number
            vtt_base_url = re.sub(r"-\d+\.webvtt$", "", vtt_urls[0])
            logger.info(f"Extracted VTT base URL: {vtt_base_url}")
            return vtt_base_url
        else:
            raise Exception("No VTT URLs found")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

    finally:
        driver.quit()


def dedup_and_chunk(subtitles: list[SubtitleEntry]) -> list[SubtitleEntry]:
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    # Remove duplicates while preserving order
    unique_subtitles = [next(g) for k, g in groupby(subtitles, key=lambda x: x.content)]

    # Join the content, preserving order
    ordered_content = " ".join(s.content for s in unique_subtitles)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=5000,
        chunk_overlap=100,
    )
    chunks = splitter.split_text(ordered_content)

    return [
        SubtitleEntry(
            id=f"{subtitles[0].sessionId}-chunk-{i}",
            sessionId=subtitles[0].sessionId,
            timestampStart=i,  # Using chunk index as timestampStart
            timestampEnd=unique_subtitles[-1].timestampEnd if unique_subtitles else 0,
            content=chunk,
        )
        for i, chunk in enumerate(chunks)
    ]


@app.function(image=image, timeout=80000)
def controller(base_page_url: str, api_url: str, session_id: str | None = None) -> None:
    """
    Controller function to manage the workflow.

    Args:
        base_page_url (str): The base page URL to extract the VTT URL.
        api_url (str): The API URL to send the processed subtitles.
        session_id (str): The session ID for the current transcription.
    """
    if session_id is None:
        raise ValueError("Session ID is required in date timestamp format")

    try:
        VTT_BASE_URL = extract_vtt_url.remote(base_page_url)
        print(f"Extracted VTT Base URL: {VTT_BASE_URL}")
    except Exception as e:
        print(f"Failed to extract VTT URL: {e}")
        return

    batch_size: int = 100
    current_batch: int = 1
    all_subtitles: list[SubtitleEntry] = []
    consecutive_empty_batches: int = 0
    max_empty_batches: int = 3  # Stop after this many consecutive empty batches

    while True:
        batch_indices: list[int] = list(
            range((current_batch - 1) * batch_size + 1, current_batch * batch_size + 1)
        )
        session_ids = [session_id for _ in batch_indices]
        url_list = [VTT_BASE_URL for _ in batch_indices]
        print(
            f"Processing batch {current_batch}: Indices {batch_indices[0]} to {batch_indices[-1]}"
        )

        batch_subtitles: list[SubtitleEntry] = []
        try:
            for subtitle in fetch_subtitles.map(url_list, batch_indices, session_ids):
                if subtitle is not None:
                    batch_subtitles.append(subtitle)
        except Exception as e:
            print(f"Error processing batch {current_batch}: {e}")

        if not batch_subtitles:
            consecutive_empty_batches += 1
            print(
                f"Empty batch encountered. Consecutive empty batches: {consecutive_empty_batches}"
            )
            if consecutive_empty_batches >= max_empty_batches:
                print(
                    f"Reached {max_empty_batches} consecutive empty batches. Ending transcription."
                )
                break
        else:
            consecutive_empty_batches = 0
            all_subtitles.extend(batch_subtitles)

        current_batch += 1

    print(f"Total subtitles collected: {len(all_subtitles)}")
    chunks = dedup_and_chunk(all_subtitles)
    print(f"Number of chunks after deduplication: {len(chunks)}")

    for chunk in chunks:
        send_to_api.remote(chunk, api_url)

    print("Transcription process completed.")


@app.local_entrypoint()
def main() -> None:
    """
    Local entry point for the Modal app.
    """
    data = requests.get("https://parliament-wow.threepointone.workers.dev/api/sessions")
    API_URL = "https://parliament-wow.threepointone.workers.dev/api/transcriptions"
    json = data.json()
    results = json["results"]
    for result in results:
        video_url = result["videoUrl"]
        session_id = result["id"]
        if session_id == "b015fab5-6ca3-45a1-8b37-ec209d439626":
            print(f"Session ID: {session_id}")
            controller.remote(video_url, API_URL, session_id)
