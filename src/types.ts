export interface FileNode {
  type: "file" | "directory"
  name: string
  path: string
  children?: FileNode[]
  content?: {
    metadata: Record<string, any>
    rawContent: string
  }
}

/**
 * Base document chunk without embedding
 */
export interface DocumentChunk {
  text: string
  metadata: {
    filePath: string
    title?: string
    section?: string
    position?: number
    [key: string]: any
  }
}

/**
 * Document chunk with embedding vector
 */
export interface DocumentChunkWithEmbedding extends DocumentChunk {
  embedding: number[]
}

export interface VectorStore {
  chunks: DocumentChunkWithEmbedding[]
  metadata: {
    model: string
    timestamp: string
    version: string
  }
}

export interface ChatPluginContent {
  chunks: DocumentChunkWithEmbedding[]
  metadata: {
    totalChunks: number
    lastUpdated: string
  }
}

// Base config interface for most providers
export interface BaseProviderConfig {
  apiKey: string
  model?: string
}

// Special config for Pinecone since it needs additional fields
export interface PineconeConfig extends BaseProviderConfig {
  environment: string
  index: string
}

// Enum for LLM providers with their corresponding package names
export enum LLMProviderType {
  OPENAI = "@langchain/openai",
  ANTHROPIC = "@langchain/anthropic",
  GOOGLE_GENAI = "@langchain/google-genai",
  XAI = "@langchain/xai",
}

// Enum for embedding providers with their corresponding package names
export enum EmbeddingProviderType {
  OPENAI = "@langchain/openai",
  GOOGLE_GENAI = "@langchain/google-genai",
  PINECONE = "@langchain/pinecone",
}

// Type for standard providers that use BaseProviderConfig
type StandardProvider<T extends LLMProviderType | EmbeddingProviderType> = {
  provider: T
  config: BaseProviderConfig
}

// Type for providers that need special config (like Pinecone)
type SpecialProvider<T extends LLMProviderType | EmbeddingProviderType> = {
  provider: T
  config: PineconeConfig
}

// Union type for LLM providers
export type LLMProvider = StandardProvider<LLMProviderType>

// Union type for embedding providers
export type EmbeddingProvider =
  | StandardProvider<EmbeddingProviderType.OPENAI>
  | StandardProvider<EmbeddingProviderType.GOOGLE_GENAI>
  | SpecialProvider<EmbeddingProviderType.PINECONE>

// Plugin options interface
export interface PluginOptions {
  label?: string
  path?: string
  // For backward compatibility
  openai?: BaseProviderConfig
  // New provider configurations
  llm?: LLMProvider
  embeddings?: EmbeddingProvider
}
