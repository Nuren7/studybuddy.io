"""
StudyBuddy LLMOps practice script — LangSmith tracing demo.

Loads dotenv BEFORE any LangSmith/LangChain usage, then runs a nested
@traceable retrieve → generate pipeline so traces appear in project
StudyBuddy-RAG-Monitoring.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

# --- load_dotenv MUST run before langsmith / langchain imports ---
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
_REPO_ROOT = _ROOT.parent
load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_ROOT / ".env", override=True)

from langsmith import traceable  # noqa: E402
from langsmith.run_helpers import get_current_run_tree  # noqa: E402


@traceable(name="retrieve_study_material", run_type="retriever")
def retrieve_study_material(query: str) -> list[dict]:
    """Demo retriever — simulates pgvector match latency and payload."""
    time.sleep(0.05)
    matches = [
        {
            "title": "Photosynthesis notes",
            "content": "Photosynthesis converts light energy into chemical energy in chloroplasts.",
            "similarity": 0.91,
        },
        {
            "title": "Cell biology summary",
            "content": "Chloroplasts are organelles found in plant cells that perform photosynthesis.",
            "similarity": 0.78,
        },
    ]
    run = get_current_run_tree()
    if run is not None:
        run.metadata["match_count"] = len(matches)
        run.metadata["query_preview"] = query[:120]
    return matches


@traceable(name="generate_answer", run_type="llm")
def generate_answer(query: str, context: list[dict]) -> str:
    """Demo generator — builds an answer from retrieved context (no live LLM call)."""
    time.sleep(0.03)
    snippets = "\n".join(f"- {m['title']}: {m['content']}" for m in context)
    answer = (
        f"Based on your study material, here is a concise answer to: {query!r}\n\n"
        f"{snippets}\n\n"
        "In short: plants convert light into chemical energy via photosynthesis in chloroplasts."
    )
    run = get_current_run_tree()
    if run is not None:
        run.metadata["model"] = "demo-stub"
        run.metadata["context_docs"] = len(context)
        # Approximate token usage for observability practice
        run.extra = {
            **(run.extra or {}),
            "usage": {
                "prompt_tokens": max(1, len(query.split()) + sum(len(m["content"].split()) for m in context)),
                "completion_tokens": max(1, len(answer.split())),
                "total_tokens": max(1, len(query.split()) + len(answer.split())),
            },
        }
    return answer


@traceable(name="rag_pipeline", run_type="chain")
def rag_pipeline(query: str) -> str:
    """Parent RAG chain — retrieval then generation."""
    context = retrieve_study_material(query)
    return generate_answer(query, context)


def main() -> int:
    tracing = os.getenv("LANGCHAIN_TRACING_V2", "").lower() in {"true", "1"}
    api_key = os.getenv("LANGCHAIN_API_KEY") or os.getenv("LANGSMITH_API_KEY") or ""
    project = os.getenv("LANGCHAIN_PROJECT") or os.getenv("LANGSMITH_PROJECT") or "default"

    if not api_key or api_key.startswith("ls__your_"):
        print("ERROR: Set LANGCHAIN_API_KEY in repo .env or llmops/.env before running.")
        print("  Copy llmops/.env.example → llmops/.env and paste your LangSmith key.")
        return 1

    if not tracing:
        print("WARN: LANGCHAIN_TRACING_V2 is not true — enabling for this run.")
        os.environ["LANGCHAIN_TRACING_V2"] = "true"

    query = " ".join(sys.argv[1:]) or "How does photosynthesis work?"
    print(f"Running RAG demo query: {query!r}")
    print(f"LangSmith project: {project}")

    answer = rag_pipeline(query)
    print("\n--- Demo answer ---")
    print(answer)
    print("-------------------\n")
    print(
        "SUCCESS: LangSmith tracing is active and ready to log requests.\n"
        f"Open https://smith.langchain.com and check project '{project}' for the rag_pipeline run."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
