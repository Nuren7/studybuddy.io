import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function findRelevantStudyMaterial(query: string, apiKey: string, supabase: ReturnType<typeof createClient>) {
  const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
  });

  if (!embeddingResponse.ok) {
    console.error("Embedding request failed:", embeddingResponse.status);
    return [];
  }

  const embeddingResult = await embeddingResponse.json();
  const embedding = embeddingResult.data?.[0]?.embedding as number[] | undefined;
  if (!embedding) return [];

  const { data, error } = await supabase.rpc("match_study_materials", {
    query_embedding: embedding,
    match_count: 5,
    similarity_threshold: 0.55,
  });

  if (error) {
    console.error("Study material search failed:", error);
    return [];
  }

  return data ?? [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, attachments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
    let studyMaterialContext = "";
    if (lastUserMessage?.content) {
      const matches = await findRelevantStudyMaterial(lastUserMessage.content, LOVABLE_API_KEY, supabase);
      if (matches.length > 0) {
        studyMaterialContext = `\n\n--- Relevant study material ---\n${matches
          .map((match) => `[${match.title}]\n${match.content}`)
          .join("\n\n")}\n--- End relevant study material ---\n`;
      }
    }

    // Process attachments if any
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        console.log("Processing attachment:", attachment.name, attachment.type);
        
        try {
          const { data, error } = await supabase.storage
            .from("chat-attachments")
            .download(attachment.path);
          
          if (error) {
            console.error("Error downloading attachment:", error);
            continue;
          }

          // Handle text-based files
          if (
            attachment.type.startsWith("text/") ||
            attachment.type === "application/json" ||
            attachment.type === "application/xml" ||
            attachment.name.endsWith(".md") ||
            attachment.name.endsWith(".txt") ||
            attachment.name.endsWith(".csv") ||
            attachment.name.endsWith(".json") ||
            attachment.name.endsWith(".xml") ||
            attachment.name.endsWith(".yaml") ||
            attachment.name.endsWith(".yml")
          ) {
            const text = await data.text();
            attachmentContext += `\n\n--- Content of "${attachment.name}" ---\n${text}\n--- End of "${attachment.name}" ---\n`;
          } else {
            // For binary files, just note that they were attached
            attachmentContext += `\n\n[File attached: ${attachment.name} (${attachment.type}) - Binary file, content not readable as text]\n`;
          }
        } catch (err) {
          console.error("Error processing attachment:", err);
          attachmentContext += `\n\n[Error reading file: ${attachment.name}]\n`;
        }
      }
    }

    // Prepare messages with attachment context
    const processedMessages = [...messages];
    if ((attachmentContext || studyMaterialContext) && processedMessages.length > 0) {
      const lastUserMessage = processedMessages[processedMessages.length - 1];
      if (lastUserMessage.role === "user") {
        lastUserMessage.content = lastUserMessage.content + studyMaterialContext + attachmentContext;
      }
    }

    console.log("Sending request to Lovable AI Gateway with", processedMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a helpful, intelligent AI assistant. You can help with any topic including:

- Answering questions on any subject
- Analyzing and summarizing documents
- Writing and editing text
- Coding and technical help
- Creative writing and brainstorming
- Research and explanations
- Math and calculations
- And much more!

When users attach documents, carefully read and analyze their contents to provide helpful responses.

Be conversational, friendly, and thorough. Format your responses with markdown for better readability - use bullet points, numbered lists, bold text, code blocks, and headers when appropriate.`
          },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully connected to AI gateway, streaming response");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
