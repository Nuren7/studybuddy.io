/**
 * LangSmith tracing helpers for Supabase Edge Functions.
 * Traces are no-ops when LANGCHAIN_API_KEY / LANGSMITH_API_KEY is unset.
 */
import { traceable } from "npm:langsmith@0.3.45/traceable";

let warnedMissingKey = false;

export function isLangSmithEnabled(): boolean {
  const key =
    Deno.env.get("LANGCHAIN_API_KEY") ??
    Deno.env.get("LANGSMITH_API_KEY") ??
    "";
  return Boolean(key.trim());
}

/** Ensure LangChain/LangSmith env aliases are visible to the SDK. */
export function ensureLangSmithEnv(): boolean {
  const enabled = isLangSmithEnabled();
  if (!enabled) {
    if (!warnedMissingKey) {
      console.log(
        "LangSmith tracing disabled: set LANGCHAIN_API_KEY (or LANGSMITH_API_KEY) to enable.",
      );
      warnedMissingKey = true;
    }
    return false;
  }

  // SDK reads these process/Deno env vars
  if (!Deno.env.get("LANGCHAIN_TRACING_V2") && !Deno.env.get("LANGSMITH_TRACING")) {
    Deno.env.set("LANGCHAIN_TRACING_V2", "true");
  }
  if (!Deno.env.get("LANGCHAIN_ENDPOINT") && !Deno.env.get("LANGSMITH_ENDPOINT")) {
    Deno.env.set("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com");
  }
  if (!Deno.env.get("LANGCHAIN_PROJECT") && !Deno.env.get("LANGSMITH_PROJECT")) {
    Deno.env.set("LANGCHAIN_PROJECT", "StudyBuddy-RAG-Monitoring");
  }

  return true;
}

type TraceableOptions = {
  name: string;
  run_type?: "chain" | "llm" | "retriever" | "tool" | "embedding" | "prompt" | "parser";
  metadata?: Record<string, unknown>;
};

/**
 * Wrap a function with LangSmith tracing when enabled; otherwise return it unchanged.
 */
export function traced<T extends (...args: never[]) => unknown>(
  fn: T,
  options: TraceableOptions,
): T {
  if (!ensureLangSmithEnv()) {
    return fn;
  }
  return traceable(fn, {
    name: options.name,
    run_type: options.run_type ?? "chain",
    metadata: {
      project: Deno.env.get("LANGCHAIN_PROJECT") ?? "StudyBuddy-RAG-Monitoring",
      ...options.metadata,
    },
  }) as T;
}
