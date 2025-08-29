import OpenAI from "openai"
import type { OpenAIConfig } from "../types"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { MockAIService } from "./mockAi"

export interface AIService {
  generateEmbeddings(texts: string[]): Promise<number[][]>
  generateChatCompletion(
    messages: ChatCompletionMessageParam[]
  ): AsyncGenerator<string, void, unknown>
}

export function createAIService(
  config: OpenAIConfig | undefined,
  useMockData: boolean = false
): AIService {
  if (useMockData) {
    return new MockAIService()
  }

  if (!config?.apiKey) {
    throw new Error("OpenAI API key is required when not using mock data")
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  })

  return {
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
      const response = await client.embeddings.create({
        input: texts,
        model: "text-embedding-3-small",
      })
      return response.data.map((item) => item.embedding)
    },

    async *generateChatCompletion(messages: ChatCompletionMessageParam[]) {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
      })

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) yield content
      }
    },
  }
}
