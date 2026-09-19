import os
import io
import uuid
import subprocess
from typing import Tuple, Optional
from PIL import Image
from pypdf import PdfReader
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
import requests
from bs4 import BeautifulSoup
from app.config import settings

def run_windows_ocr(image_path: str) -> str:
    """
    Executes Windows native hardware-accelerated OCR (Windows.Media.Ocr.OcrEngine).
    Works 100% out of the box on Windows 10/11 with zero external binary installs.
    """
    ps_script = os.path.join(os.path.dirname(__file__), "ocr_win.ps1")
    if not os.path.exists(ps_script) or not os.path.exists(image_path):
        return ""
    try:
        cmd = [
            "powershell",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            ps_script,
            "-ImagePath",
            os.path.abspath(image_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=15)
        if res.returncode == 0 and res.stdout:
            return res.stdout.strip()
    except Exception as e:
        print(f"[Windows Native OCR Error] {e}")
    return ""

def ocr_image_bytes(image_bytes: bytes, label: str = "embedded image") -> str:
    """
    Performs OCR on raw image bytes:
    1. Runs Windows native OCR.
    2. Falls back to pytesseract if installed.
    3. Falls back to Gemini Vision if GEMINI_API_KEY is configured.
    """
    # 1. Try Windows native OCR
    temp_name = f"temp_ocr_{uuid.uuid4().hex}.png"
    temp_path = os.path.join(settings.UPLOAD_DIR, temp_name)
    try:
        with open(temp_path, "wb") as f:
            f.write(image_bytes)
        text = run_windows_ocr(temp_path)
        if text and len(text) > 2:
            return text
    except Exception as e:
        print(f"[OCR Temp File Warning] {e}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

    # 2. Try pytesseract
    try:
        import pytesseract
        for p in [r"C:\Program Files\Tesseract-OCR\tesseract.exe", r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                break
        img = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img).strip()
        if text:
            return text
    except Exception:
        pass

    # 3. Try Gemini Vision if key provided
    if settings.GEMINI_API_KEY:
        try:
            import base64
            b64_data = base64.b64encode(image_bytes).decode("utf-8")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Extract all readable text, labels, headlines, diagrams, and data from this image."},
                        {"inline_data": {"mime_type": "image/jpeg", "data": b64_data}}
                    ]
                }]
            }
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                res_json = resp.json()
                text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return text
        except Exception as e:
            print(f"[Gemini Vision OCR Error on {label}] {e}")

    # Fallback
    try:
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
        return f"[{label}: {w}x{h} px image indexed]"
    except Exception:
        return ""

def extract_text_from_image(file_path: str) -> Tuple[str, str]:
    """
    Extracts text from uploaded images/screenshots using Windows native OCR.
    """
    # 1. Native Windows OCR
    text = run_windows_ocr(file_path)
    if text and len(text) > 3:
        snippet = text[:280].replace("\n", " ") + ("..." if len(text) > 280 else "")
        return text, snippet

    # 2. Byte-level OCR fallback
    try:
        with open(file_path, "rb") as f:
            img_bytes = f.read()
        text = ocr_image_bytes(img_bytes, label="Image Scan")
        if text and not text.startswith("[Image Scan:"):
            snippet = text[:280].replace("\n", " ") + ("..." if len(text) > 280 else "")
            return text, snippet
    except Exception:
        pass

    # Heuristic fallback if image has no readable text
    try:
        img = Image.open(file_path)
        w, h = img.size
        fallback_text = f"Image ({w}x{h}, {img.format}). Visual media indexed."
    except Exception:
        fallback_text = "Uploaded image file."

    snippet = fallback_text[:280].replace("\n", " ")
    return fallback_text, snippet

def extract_text_from_pdf(file_path: str) -> Tuple[str, str]:
    """
    Extracts selectable text and performs deep OCR on embedded graphics inside PDF.
    """
    try:
        reader = PdfReader(file_path)
        full_sections = []
        image_ocr_sections = []
        
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                full_sections.append(f"--- Page {i+1} ---\n" + page_text.strip())
            
            # Deep embedded image scan
            if hasattr(page, "images"):
                for img_idx, img_obj in enumerate(page.images):
                    try:
                        ocr_result = ocr_image_bytes(img_obj.data, label=f"Page {i+1} Image {img_idx+1}")
                        if ocr_result and len(ocr_result) > 10 and not ocr_result.startswith("["):
                            image_ocr_sections.append(f"[Page {i+1} Embedded Graphic OCR]:\n{ocr_result}")
                    except Exception as e:
                        print(f"[PDF Embedded Image OCR Warning] {e}")

        combined_text = "\n\n".join(full_sections)
        if image_ocr_sections:
            combined_text += "\n\n=== Scanned Embedded Image Content (OCR) ===\n" + "\n\n".join(image_ocr_sections)

        if not combined_text.strip():
            combined_text = "PDF document with no extractable text."

        snippet = combined_text[:280].replace("\n", " ") + ("..." if len(combined_text) > 280 else "")
        return combined_text.strip(), snippet
    except Exception as e:
        print(f"[PDF Extraction Error] {e}")
        return f"Error extracting PDF: {str(e)}", "Unreadable PDF document."

def extract_text_from_pptx(file_path: str) -> Tuple[str, str]:
    """
    Extracts text from PowerPoint presentations (.pptx) including slide notes
    and embedded images using deep OCR.
    """
    try:
        prs = Presentation(file_path)
        slides_text = []
        embedded_ocr_text = []

        for slide_num, slide in enumerate(prs.slides, 1):
            slide_elements = []
            
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            slide_elements.append(text)
                            
                if shape.has_table:
                    for row in shape.table.rows:
                        row_vals = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_vals:
                            slide_elements.append(" | ".join(row_vals))

                if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                    try:
                        img_bytes = shape.image.blob
                        ocr_res = ocr_image_bytes(img_bytes, label=f"Slide {slide_num} Picture")
                        if ocr_res and len(ocr_res) > 8 and not ocr_res.startswith("["):
                            embedded_ocr_text.append(f"[Slide {slide_num} Embedded Visual OCR]:\n{ocr_res}")
                    except Exception as e:
                        print(f"[PPTX Image OCR Warning] {e}")

            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    slide_elements.append(f"(Notes: {notes})")

            if slide_elements:
                slides_text.append(f"--- Slide {slide_num} ---\n" + "\n".join(slide_elements))

        combined = "\n\n".join(slides_text)
        if embedded_ocr_text:
            combined += "\n\n=== Scanned Embedded Slide Images (OCR) ===\n" + "\n\n".join(embedded_ocr_text)

        if not combined.strip():
            combined = "PowerPoint presentation with visual slides."

        snippet = combined[:280].replace("\n", " ") + ("..." if len(combined) > 280 else "")
        return combined.strip(), snippet
    except Exception as e:
        print(f"[PPTX Extraction Error] {e}")
        return f"Error extracting PowerPoint presentation: {str(e)}", "Unreadable presentation document."

def scrape_webpage(url: str) -> Tuple[str, str, str]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=8)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        elif soup.find("h1"):
            title = soup.find("h1").get_text(strip=True)
        else:
            title = url

        for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
            tag.decompose()

        paragraphs = [p.get_text(strip=True) for p in soup.find_all(['p', 'h1', 'h2', 'h3', 'li'])]
        text_content = "\n".join([p for p in paragraphs if len(p) > 20])
        if not text_content:
            text_content = soup.get_text(separator=" ", strip=True)

        meta_desc = ""
        desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if desc_tag and desc_tag.get("content"):
            meta_desc = desc_tag["content"].strip()

        snippet = meta_desc if meta_desc else text_content[:280].replace("\n", " ")
        if len(snippet) > 280:
            snippet = snippet[:280] + "..."

        return title, text_content, snippet
    except Exception as e:
        print(f"[Web Scraper Error] {e}")
        return url, f"Could not scrape {url}: {str(e)}", f"Saved web bookmark for {url}."
