-- Enable semantic search for study material with pgvector.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE TABLE IF NOT EXISTS public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  source text,
  embedding extensions.vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_materials_embedding_idx ON public.study_materials USING hnsw (embedding vector_cosine_ops);
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.match_study_materials(
    query_embedding extensions.vector(1536),
    match_count integer DEFAULT 5,
    similarity_threshold real DEFAULT 0.7
  ) RETURNS TABLE (
    id uuid,
    title text,
    content text,
    source text,
    similarity real
  ) LANGUAGE sql STABLE
SET search_path = public,
  extensions AS $$
SELECT study_materials.id,
  study_materials.title,
  study_materials.content,
  study_materials.source,
  (
    1 - (study_materials.embedding <=> query_embedding)
  )::real AS similarity
FROM public.study_materials
WHERE study_materials.embedding IS NOT NULL
  AND 1 - (study_materials.embedding <=> query_embedding) >= similarity_threshold
ORDER BY study_materials.embedding <=> query_embedding
LIMIT LEAST(match_count, 20);
$$;
GRANT EXECUTE ON FUNCTION public.match_study_materials(extensions.vector(1536), integer, real) TO anon,
  authenticated,
  service_role;