# TraceBack — The Digital Memory Engine

> **Search your digital life, naturally.**  
> Photos, PDFs, notes, links — find them using what you remember.

TraceBack is a full-stack digital memory engine built with **Next.js**, **FastAPI**, **PostgreSQL with pgvector** (with automatic zero-config fallback), **OCR text extraction**, and **semantic AI embeddings**.

![TraceBack Preview](backend/app/seed.py)

---

## 🚀 Quickstart (Zero-Config Mode)

The application includes an automatic fallback mode so you can run and test the complete application **immediately without needing to install or configure external database servers or API keys**.

### 1. Start the FastAPI Backend

Open a terminal in the project root:

```bash
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server (starts on http://localhost:8000)
python -m uvicorn app.main:app --reload --port 8000
```

> **Note:** On first startup, TraceBack automatically seeds the database with realistic demo memories (e.g. *Internship Portal*, *ML Notes.pdf*, *OpenAI Blog*, *DAA Notes*) so you can test search and knowledge map right away!

### 2. Start the Next.js Frontend

Open a second terminal in the project root:

```bash
cd frontend

# Install packages
npm install

# Start the development server (starts on http://localhost:3000)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🐘 Running with PostgreSQL & pgvector (Production Mode)

To use PostgreSQL with `pgvector`:

1. Spin up a PostgreSQL instance with pgvector (e.g. via Docker or cloud provider like Supabase/Neon):
   ```bash
   docker run -d --name traceback-pg \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=traceback \
     -p 5432:5432 \
     pgvector/pgvector:pg16
   ```

2. Configure `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/traceback
   ```

3. TraceBack will automatically enable the `vector` extension and synchronize embeddings with pgvector!

---

## 🧠 AI Embeddings & OCR Configuration

TraceBack is equipped with a built-in semantic vectorizer that runs completely locally without external API dependencies. If you wish to use OpenAI or Google Gemini embeddings:

Create or edit `backend/.env`:
```env
# Optional: OpenAI embeddings (text-embedding-3-small)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Google Gemini embeddings & Vision OCR
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## ✨ Features & Architecture

- **Natural Language Semantic Search**: Search using everyday thoughts like `"that website where I saw the internship deadline"` or `"dynamic programming graph notes"`.
- **Text Extraction & OCR**: Extracts text from PDFs (`pypdf`), images and screenshots (`Pillow` + OCR), and scrapes content from saved web links (`BeautifulSoup`).
- **Interactive Knowledge Map**: Visual radial graph connecting memories through semantic similarity clusters.
- **Related Memories Engine**: Contextual recommendations linking relevant notes and files together.
- **Detailed Memory Viewer**: Inspect full extracted OCR text, preview media, copy text, view matching reasons, and delete memories.
- **Recent Activity Feed**: Real-time logging of uploads, link saves, notes, and search queries.

---

## 🧪 Verification & Testing

To run the automated backend test suite:

```bash
cd backend
python test_backend.py
```
