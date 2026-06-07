# DocuScan

> Extract structured data from any document. Locally. Privately.

DocuScan uses AI to extract structured fields from PDFs and scanned images — invoices, resumes, contracts, receipts, and more. Drop a file, pick a template or define your own fields, and get clean structured data exported as JSON or CSV.

**Your documents never leave your machine.**

---

## Features

- **PDF text extraction** — native layer parsing, no upload required
- **OCR for scanned images** — Tesseract-powered with preprocessing for low-quality scans
- **AI-powered field extraction** — LangChain structured output with per-field confidence scores
- **4 built-in templates** — Invoice, Resume, Contract, Receipt
- **Custom field definition** — extract exactly what you need from any document type
- **Confidence scoring** — color-coded per field (green / amber / red)
- **Export to JSON or CSV** — native OS save dialog, clean structured output
- **Provider-flexible** — HuggingFace (free, no key needed), OpenAI, or Google Gemini
- **100% local processing** — documents are never uploaded anywhere
- **Cross-platform** — Windows (.msi) and Linux (.AppImage)

---

## Download

| Platform | Installer |
|---|---|
| Windows | DocuScan-Setup.msi (GitHub Releases) |
| Linux | DocuScan.AppImage (GitHub Releases) |

*Download the latest release from the [Releases](../../releases) page.*

---

## Screenshots

*Drop a PDF → pick a template → AI extracts structured fields → export JSON or CSV*

```
┌─────────────────────────────────────────────────────────────┐
│ DocuScan                        Documents stay on your machine│
├──────────────────┬──────────────────────────────────────────┤
│ Document         │  Field            Value          Confidence│
│ [Drop Zone]      │  vendor_name      Acme Supplies  ████ High │
│                  │  invoice_number   INV-2024-00847 ████ High │
│ Template         │  date             2024-11-15     ███  High │
│ Invoice Resume..│  due_date         2024-12-15     ███  High │
│                  │  total            USD 7,020.00   ██   Med  │
│ AI Settings      │  currency         USD            ████ High │
│ [Collapsed]      │                                           │
│                  │  [Export JSON]  [Export CSV]              │
└──────────────────┴──────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | React 18, TypeScript (strict), Vite, Tailwind CSS |
| AI extraction | Python, LangChain 0.2, Pydantic v2 |
| OCR | Tesseract via pytesseract |
| LLM providers | HuggingFace Hub, OpenAI gpt-4o-mini, Google Gemini 1.5 Flash |
| Packaging | PyInstaller (sidecar), Tauri bundler (AppImage / MSI) |

---

## Local Development Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Rust | stable | https://rustup.rs |
| Node.js | 20+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| Tesseract OCR | 5.x | See below |

**Install Tesseract:**

```bash
# Linux (Ubuntu / Debian)
sudo apt install tesseract-ocr libtesseract-dev

# Windows
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
# Add Tesseract to PATH after installation
```

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/hateem-hassan/DocuScan
cd DocuScan

# 2. Install frontend dependencies
npm install

# 3. Install Python dependencies and build the sidecar binary
#    Linux:
bash scripts/build-sidecar-linux.sh

#    Windows:
scripts\build-sidecar-windows.bat

# 4. Run in development mode
npm run tauri dev
```

The app window opens automatically. Drop any of the sample PDFs from `sample_docs/` to see a full extraction flow.

### Build for Production

```bash
# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu

# Windows (cross-compile or run on Windows)
npm run tauri build -- --target x86_64-pc-windows-msvc
```

Installers are written to `src-tauri/target/release/bundle/`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in as needed:

| Variable | Description | Required |
|---|---|---|
| `HF_API_TOKEN` | HuggingFace token — improves rate limits on free tier | Optional |
| `OPENAI_API_KEY` | OpenAI key — only if using OpenAI provider | Optional |
| `GEMINI_API_KEY` | Google Gemini key — only if using Gemini provider | Optional |

API keys entered in the UI are held in memory only and never written to disk or logged.

---

## AI Provider Comparison

| Provider | Model | Cost | Key Required |
|---|---|---|---|
| **HuggingFace** (default) | Mistral-7B-Instruct-v0.2 | Free | No (token improves rate limits) |
| **OpenAI** | gpt-4o-mini | ~$0.01–0.05 / doc | Yes |
| **Google Gemini** | gemini-1.5-flash | Free tier available | Yes |

For most use cases, HuggingFace works well at no cost. Switch to OpenAI or Gemini for higher accuracy on complex documents.

---

## Supported Document Types

| Template | Extracted Fields |
|---|---|
| **Invoice** | vendor_name, invoice_number, date, due_date, line_items, subtotal, tax, total, currency |
| **Resume** | full_name, email, phone, location, skills, experience, education, certifications |
| **Contract** | parties, effective_date, expiry_date, key_terms, payment_terms, jurisdiction |
| **Receipt** | merchant, date, items, total, payment_method |
| **Custom** | Any fields you define |

---

## Architecture

```
User drops file
      │
      ▼
React frontend (Tauri WebView)
      │ invoke("read_pdf_text" | "read_image_for_ocr")
      ▼
Rust backend (Tauri commands)
 ├─ PDF: pdf-extract crate → raw text
 └─ Image: base64 encode → pass to sidecar
      │ invoke("call_sidecar")
      ▼
Python sidecar (PyInstaller binary)
 ├─ Image path: Tesseract OCR → text
 └─ Text: LangChain → structured fields + confidence
      │ JSON stdout
      ▼
Rust parses SidecarResponse
      │
      ▼
React renders ResultsTable
      │ invoke("export_json" | "export_csv")
      ▼
OS save dialog → file written locally
```

The sidecar is a stateless process: Rust spawns it per-extraction with JSON on stdin, reads JSON from stdout, and the sidecar exits. No server, no persistent process.

---

## Privacy

- No telemetry, no analytics, no cloud sync
- Documents are read from disk locally and never transmitted
- API keys are held in memory during the session only
- The only outbound network calls are to the AI provider API you explicitly configure

---

## Triggering a Release Build

Push a version tag to start the GitHub Actions build pipelines:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers both `build-linux.yml` and `build-windows.yml`. Built installers appear as artifacts on the Actions run and are attached to the GitHub Release automatically.

---

## License

Copyright (c) 2026 Hateem Hassan. All rights reserved.

Available for portfolio and evaluation purposes only. Commercial use requires written permission.

---

## Built By

**Hateem Hassan** — Full-Stack AI & Systems Engineer

- LinkedIn: [linkedin.com/in/hateem-hassan](https://linkedin.com/in/hateem-hassan)
- GitHub: [github.com/hateem-hassan](https://github.com/hateem-hassan)
