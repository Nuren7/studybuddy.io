import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const embeddingModel = "text-embedding-3-small";

async function createEmbedding(text: string, apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: embeddingModel, input: text }),
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.data?.[0]?.embedding as number[] | undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = "search", title, content, source, query, limit = 5 } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (action === "index") {
      if (!title?.trim() || !content?.trim()) {
        return new Response(JSON.stringify({ error: "title and content are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embedding = await createEmbedding(`${title}\n\n${content}`, apiKey);
      if (!embedding) throw new Error("Embedding response did not contain a vector");

      const { data, error } = await supabase
        .from("study_materials")
        .insert({ title: title.trim(), content: content.trim(), source, embedding })
        .select("id, title, source, created_at")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ material: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embedding = await createEmbedding(query.trim(), apiKey);
    if (!embedding) throw new Error("Embedding response did not contain a vector");

    const { data, error } = await supabase.rpc("match_study_materials", {
      query_embedding: embedding,
      match_count: limit,
      similarity_threshold: 0.55,
    });

    if (error) throw error;
    return new Response(JSON.stringify({ results: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Study material search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});