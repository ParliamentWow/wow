import base64
import os
from mistralai import Mistral
from pdf2image import convert_from_path
from PIL import Image
import io
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class PDFPage(BaseModel):
    page_number: int
    content: str

def encode_image(image: Image.Image) -> str:
    """Encode the image to base64."""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def process_pdf(pdf_path: str, api_key: str, model: str) -> list[PDFPage]:
    """Process a PDF file and return a list of PDFPage objects."""
    client = Mistral(api_key=api_key)
    pages = convert_from_path(pdf_path)
    results = []

    for i, page in enumerate(pages, start=1):
        base64_image = encode_image(page)
        
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract the text content from this image of a PDF page. Return the whole page content in markdown format. Do not return any other text or comments."
                    },
                    {
                        "type": "image_url",
                        "image_url": f"data:image/png;base64,{base64_image}"
                    }
                ]
            }
        ]

        chat_response = client.chat.complete(
            model=model,
            messages=messages
        )

        content = chat_response.choices[0].message.content
        results.append(PDFPage(page_number=i, content=content))

    return results

def main():
    # Path to your PDF
    pdf_path = "../bills/3094-Publication__Additional_Provision__AP1__June_2022.pdf"

    # Retrieve the API key from environment variables
    api_key = os.getenv("MISTRAL_AI_API_KEY")

    # Specify model
    model = "pixtral-12b-2409"

    # Process the PDF
    pdf_contents = process_pdf(pdf_path, api_key, model)

    # Print the extracted text from each page
    for page in pdf_contents:
        print(f"Page {page.page_number}:")
        print(page.content)
        print("-" * 50)

    # Concatenate all page contents
    full_text = "\n".join(page.content for page in pdf_contents)
    print("Full PDF Text:")
    print(full_text)

if __name__ == "__main__":
    main()