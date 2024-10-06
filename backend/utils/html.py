import asyncio

from utils.clean import remove_excessive_whitespace

TIMEOUT = 50000
WAIT_TIME = 2
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

def clean_html(url: str) -> str:
    html = get_html_playwright(url)
    markdown = parse_html_text(html)
    markdown = remove_excessive_whitespace(markdown)
    return markdown

def parse_html_text(html: str) -> str:
    import html2text
    h = html2text.HTML2Text()
    h.ignore_links = False
    markdown_content = h.handle(html)

    new_markdown_content = ""
    inside_link_content = False
    link_open_count = 0
    for char in markdown_content:
        if char == "[":
            link_open_count += 1
        elif char == "]":
            link_open_count = max(0, link_open_count - 1)
        inside_link_content = link_open_count > 0

        if inside_link_content and char == "\n":
            new_markdown_content += "\\" + "\n"
        else:
            new_markdown_content += char
    
    return new_markdown_content


async def aget_html_playwright(url: str) -> str:
    """Get the HTML of a page with improved robustness."""
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError, Error as PlaywrightError
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=USER_AGENT, viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()

        try:
            await page.goto(url, timeout=TIMEOUT, wait_until="domcontentloaded")
            await asyncio.sleep(1)
            return await page.content()

        except PlaywrightTimeoutError:
            print(f"Timeout occurred while loading {url}")
            raise PlaywrightTimeoutError(f"Timeout occurred while loading {url}")
        except PlaywrightError as e:
            print(f"Playwright error occurred while scraping {url}: {e!s}")
            raise PlaywrightError(
                f"Playwright error occurred while scraping {url}: {e!s}"
            )
        finally:
            if "context" in locals():
                await context.close()
            if "browser" in locals():
                await browser.close()

def get_html_playwright(url: str) -> str:
    """Get the HTML of a page with improved robustness."""
    return asyncio.run(aget_html_playwright(url))
