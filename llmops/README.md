# StudyBuddy LLMOps (Python practice)

Small Python package for practicing LangSmith observability. Production RAG tracing lives in the Supabase Edge Functions (`supabase/functions/chat` and `study-materials`). This folder mirrors the same env vars and `@traceable` patterns.

## Setup

```bash
cd llmops
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Copy env values from the repo root `.env` or from `.env.example`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
# cp .env.example .env
```

Paste your real LangSmith API key into `LANGCHAIN_API_KEY` (or use the repo root `.env`, which `rag_trace_demo.py` also loads).

Required variables:

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=ls__your_langsmith_api_key_here
LANGCHAIN_PROJECT=StudyBuddy-RAG-Monitoring
```

## Run the demo

```bash
python rag_trace_demo.py
python rag_trace_demo.py "What is photosynthesis?"
```

You should see a SUCCESS message. Then open [LangSmith](https://smith.langchain.com) → project **StudyBuddy-RAG-Monitoring** and inspect the nested `rag_pipeline` → `retrieve_study_material` / `generate_answer` runs.
