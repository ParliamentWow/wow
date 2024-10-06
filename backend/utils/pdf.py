def clean_pdf(url: str) -> str:
    """Extract text from a PDF using PyPDF2, following redirects."""
    import requests
    from PyPDF2 import PdfReader
    import io

    from utils.clean import remove_excessive_whitespace
    headers = {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    }
    try:
        # Use the session to get the URL, following redirects
        response = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        response.raise_for_status()

        file_content = response.content
        try:
            pdf_reader = PdfReader(io.BytesIO(file_content))
            text = "\n".join(page.extract_text() for page in pdf_reader.pages)
            return remove_excessive_whitespace(text)
        except Exception as e:
            print(f"Error reading PDF from {url}: {str(e)}")
            return ""
    except requests.exceptions.RequestException as e:
        print(f"Error downloading PDF from {url}: {str(e)}")
        return ""


if __name__ == "__main__":
    pdf = clean_pdf("https://publications.parliament.uk/pa/bills/cbill/58-04/0203/amend/rwanda_pro_cclm_0422_1.pdf")
    print(pdf)