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

export interface OpenAIConfig {
  apiKey: string
  // model?: string // defaults to "gpt-3.5-turbo"
  // maxTokens?: number // defaults to 500
  // temperature?: number // defaults to 0.3
  // embeddingModel?: string // defaults to "text-embedding-3-small"
}

export interface PluginOptions {
  label?: string
  path?: string
  showNavbar?: boolean
  openai?: OpenAIConfig
}
