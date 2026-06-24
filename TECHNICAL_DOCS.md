# Verse Dig Bible Study | Technical Documentation

## Project Overview

Verse Dig Bible Study is a web-based companion application that leverages AI to provide deep theological analysis, historical context, and linguistic insights into Bible verses. 

The project is split into a static frontend (hosted on Netlify) and a robust, scalable Python backend (hosted on Hugging Face Spaces).

## Architecture

### 1. Frontend (Netlify)
- **Tech Stack:** Vanilla HTML, CSS, and JavaScript.
- **Hosting:** Netlify (Static Site).
- **Core Logic:** 
  - Retrieves raw verse text using the free `bible-api.com`.
  - Sends the verse reference and text to the backend API for AI analysis.
  - Renders the structured JSON response (Historical Context, Linguistic Lens, Cross-References) into the UI.
- **Proxy Configuration:** `netlify.toml` is configured to proxy all requests from `/generate_theology` on the Netlify domain directly to the Hugging Face Space. This prevents CORS issues and hides the actual backend URL from end-users.

### 2. Backend (Hugging Face Spaces)
- **Tech Stack:** Python 3.12, FastAPI, Pydantic, OpenAI Python SDK, `uv` (Package Manager).
- **Hosting:** Hugging Face Spaces (Docker SDK).
- **Core Logic:**
  - **Endpoint (`POST /generate_theology`):** Accepts securely validated payloads (reference and text) using Pydantic models with strict length limits to prevent Denial of Service (DoS) and prompt injection attacks.
  - **Prompt Engineering:** Constructs a highly structured system prompt server-side, enforcing that the AI acts as a theological scholar and returns a strict, parseable JSON object.
  - **AI Integration:** Uses the official `openai` SDK to communicate with OpenAI-compatible APIs (such as OpenRouter or Groq). This makes the backend completely model-agnostic.
  - **Health Check (`GET /`):** A lightweight endpoint designed to be pinged by external cron jobs (e.g., cron-job.org) to keep the Hugging Face Space awake and prevent "cold start" delays.
