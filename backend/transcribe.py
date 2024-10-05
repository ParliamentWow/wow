import logging
import requests
import re
import json
import os
from modal import App, Dict, Image
from pydantic import BaseModel
import time
import re

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = App("parliament-live-transcripts")
image = Image.debian_slim().pip_install("requests", "pydantic")
browser_image = Image.debian_slim().pip_install("selenium", "requests", "webdriver-manager")    .run_commands(
        "apt-get update",
        "apt-get install -y chromium chromium-driver",
        "apt-get clean",
        "rm -rf /var/lib/apt/lists/*"
    )
dict = Dict.from_name("parliament-live-transcripts", create_if_missing=True)


class SubtitleEntry(BaseModel):
    id: int
    timestamp_start: str
    timestamp_end: str
    content: str


def parse_timestamp(timestamp: str) -> int:
    # Convert timestamp to milliseconds for easier comparison
    h, m, s = timestamp.split(':')
    s, ms = s.split('.')
    return int(h) * 3600000 + int(m) * 60000 + int(s) * 1000 + int(ms)


@app.function(image=image)
def fetch_subtitles(base_url: str, index: int) -> SubtitleEntry:
    url = f"{base_url}-{index}.webvtt"

    try:
        response = requests.get(url)
        if not response.ok:
            raise Exception(f"Failed to fetch subtitles. Possibly reached the end at index {index}.")
        content = response.text
        if not content:
            raise Exception(f"Failed to fetch subtitles. Possibly reached the end at index {index}.")
        
        lines = content.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Check if the line is an ID (purely numeric)
            if line.isdigit():
                subtitle_id = int(line)
                i += 1
                
                # Next line should be the timestamp
                if i < len(lines):
                    timestamp_line = lines[i].strip()
                    match = re.match(r'(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})', timestamp_line)
                    if match:
                        start_time, end_time = match.groups()
                        i += 1
                        
                        # Collect the content
                        content = []
                        while i < len(lines) and lines[i].strip() and not lines[i].strip().isdigit():
                            content.append(lines[i].strip())
                            i += 1
                        
                        subtitle_entry = SubtitleEntry(
                            id=subtitle_id,
                            timestamp_start=start_time,
                            timestamp_end=end_time,
                            content=" ".join(content)
                        )

                        print(subtitle_entry)
                        return subtitle_entry
            i += 1

    except Exception as e:
        print(f"Failed to fetch subtitles. Possibly reached the end at index {index}.")
        dict["stop_count"] += 1
        return

@app.function(image=image)
def send_to_api(data: SubtitleEntry | None) -> None:
    if data is None:
        return

    api_url: str = os.getenv('API_URL', 'https://api.example.com/subtitles')

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
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By
    from webdriver_manager.chrome import ChromeDriverManager
    
    def setup_driver():
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.set_capability("goog:loggingPrefs", {"performance": "ALL", "browser": "ALL"})
        options.binary_location = "/usr/bin/chromium"
        
        service = Service("/usr/bin/chromedriver")
        driver = webdriver.Chrome(service=service, options=options)
        return driver


    def capture_vtt_urls(driver, duration=60):
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
            
        vtt_urls = capture_vtt_urls(driver, duration=30)
        
        if vtt_urls:
            logger.info(f"Found VTT URLs: {vtt_urls}")
            # Find the base URL by removing the segment number
            vtt_base_url = re.sub(r'-\d+\.webvtt$', '', vtt_urls[0])
            logger.info(f"Extracted VTT base URL: {vtt_base_url}")
            return vtt_base_url
        else:
            raise Exception("No VTT URLs found")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

    finally:
        driver.quit()


@app.function(image=image)
def controller(base_page_url: str) -> None:
    """
    Controller function to manage the workflow.
    
    Args:
        base_page_url (str): The base page URL to extract the VTT URL.
    """
    try:
        VTT_BASE_URL = extract_vtt_url.remote(base_page_url)
        print(f"Extracted VTT Base URL: {VTT_BASE_URL}")
    except Exception as e:
        print(f"Failed to extract VTT URL: {e}")
        return

    batch_size: int = 100
    current_batch: int = 1
    dict["stop_count"] = 0

    while True:
        batch_indices: list[int] = list(range((current_batch - 1) * batch_size + 1, current_batch * batch_size + 1))
        print(f"Processing batch {current_batch}: Indices {batch_indices[0]} to {batch_indices[-1]}")

        try:
            url_list = [VTT_BASE_URL for _ in batch_indices]
            for subtitle in fetch_subtitles.map(url_list, batch_indices):
                send_to_api.remote(subtitle)
            current_batch += 1
            if dict["stop_count"] >= batch_size:
                print("Reached the end of the subtitles.")
                break
        except Exception as e:
            print(f"Finished with batch {current_batch} due to error: {e}")
            break


@app.local_entrypoint()
def main() -> None:
    """
    Local entry point for the Modal app.
    """
    BASE_PAGE_URL = "https://videoplayback.parliamentlive.tv/Player/Index/d439fb88-5c5c-48c5-a0db-c715e09f78d2"
    controller.remote(BASE_PAGE_URL)