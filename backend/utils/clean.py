from datetime import datetime
import re


def remove_excessive_whitespace(text: str) -> str:
    text = re.sub(r"\s{11,}", " " * 10, text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()

def parse_rfc2822_date(date_string: str) -> datetime:
    return datetime.strptime(date_string, "%a, %d %b %Y %H:%M:%S %z")
