import { LLMProviderType, EmbeddingProviderType } from "./types"

/**
 * Default models for LLM providers
 */
export const DEFAULT_LLM_MODELS: Record<LLMProviderType, string> = {
  [LLMProviderType.OPENAI]: "gpt-4o-mini",
  [LLMProviderType.ANTHROPIC]: "claude-3.5-haiku-latest",
  [LLMProviderType.GOOGLE_GENAI]: "gemini-1.5-flash",
  [LLMProviderType.XAI]: "grok-2-latest",
}

/**
 * Default models for embedding providers
 */
export const DEFAULT_EMBEDDING_MODELS: Record<EmbeddingProviderType, string> = {
  [EmbeddingProviderType.OPENAI]: "text-embedding-3-small",
  [EmbeddingProviderType.GOOGLE_GENAI]: "text-embedding-004",
  [EmbeddingProviderType.PINECONE]: "multilingual-e5-large",
}
