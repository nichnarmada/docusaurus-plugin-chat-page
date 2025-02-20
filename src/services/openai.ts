import OpenAI from "openai"
import type { EmbeddingCreateParams } from "openai/resources/embeddings"
import type { OpenAIConfig } from "../types"

/**
 * Create an OpenAI client instance
 */
export function createOpenAIClient(config: OpenAIConfig) {
  const client = new OpenAI({
    apiKey: config.apiKey,
  })
  const model = "text-embedding-3-small"

  return {
    /**
     * Generate embeddings for a single text string
     */
    async generateEmbedding(text: string): Promise<number[]> {
      const params: EmbeddingCreateParams = {
        model,
        input: text,
      }

      try {
        const response = await client.embeddings.create(params)
        return response.data[0].embedding
      } catch (error) {
        console.error("Error generating embedding:", error)
        throw error
      }
    },

    /**
     * Generate embeddings for multiple text strings in batch
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
      const params: EmbeddingCreateParams = {
        model,
        input: texts,
      }

      try {
        const response = await client.embeddings.create(params)
        return response.data.map((item) => item.embedding)
      } catch (error) {
        console.error("Error generating embeddings:", error)
        throw error
      }
    },
  }
}
