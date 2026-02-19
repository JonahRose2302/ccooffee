import pdfplumber
import sys
sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'c:\Users\Jona\OneDrive\Dokumente\ccooffee\assets\brand\The Ultimate Barista Knowledge Base.pdf'

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"=== PAGE {i+1} ===")
        text = page.extract_text()
        if text:
            print(text)
        print()
