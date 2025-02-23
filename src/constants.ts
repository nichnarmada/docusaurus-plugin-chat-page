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
  [EmbeddingProviderType.PINECONE]: "llama-text-embed-v2",
}

/**
 * Default chunk sizes for different embedding models
 * This is important because different models have different token limits
 */
export const DEFAULT_CHUNK_SIZES: Record<EmbeddingProviderType, number> = {
  [EmbeddingProviderType.OPENAI]: 1000,
  [EmbeddingProviderType.GOOGLE_GENAI]: 1000,
  [EmbeddingProviderType.PINECONE]: 1000,
}

/**
 * Default chunk overlap for different embedding models
 */
export const DEFAULT_CHUNK_OVERLAP: Record<EmbeddingProviderType, number> = {
  [EmbeddingProviderType.OPENAI]: 200,
  [EmbeddingProviderType.GOOGLE_GENAI]: 200,
  [EmbeddingProviderType.PINECONE]: 200,
}

/**
 * Maximum context window sizes for LLM models
 * This helps in determining how much context we can send to each model
 */
export const MAX_CONTEXT_WINDOW: Record<LLMProviderType, number> = {
  [LLMProviderType.OPENAI]: 128000, // GPT-4 Turbo
  [LLMProviderType.ANTHROPIC]: 200000, // Claude 3
  [LLMProviderType.GOOGLE_GENAI]: 32768, // Gemini Pro
  [LLMProviderType.XAI]: 32000, // Estimated for XAI
}

/**
 * Default temperature settings for each LLM provider
 */
export const DEFAULT_TEMPERATURE: Record<LLMProviderType, number> = {
  [LLMProviderType.OPENAI]: 0.7,
  [LLMProviderType.ANTHROPIC]: 0.7,
  [LLMProviderType.GOOGLE_GENAI]: 0.7,
  [LLMProviderType.XAI]: 0.7,
}

/**
 * Default top-k similar chunks to retrieve for context
 */
export const DEFAULT_TOP_K = 3

/**
 * Default similarity threshold for retrieving relevant chunks
 * Chunks with similarity scores below this threshold will be ignored
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.7
