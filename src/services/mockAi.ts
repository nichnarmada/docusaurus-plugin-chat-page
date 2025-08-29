import type { AIService } from "./ai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

export class MockAIService implements AIService {
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Generate deterministic fake embeddings based on text hash
    // 1536 dimensions to match text-embedding-3-small
    return texts.map((text) => {
      const hash = this.hashCode(text)
      const rng = this.seededRandom(hash)
      return Array.from({ length: 1536 }, () => rng() * 2 - 1)
    })
  }

  async *generateChatCompletion(messages: ChatCompletionMessageParam[]) {
    const userMessage = messages[messages.length - 1]?.content || ""
    const response =
      `[Development Mode Response]\n\n` +
      `I received your question: "${userMessage}"\n\n` +
      `In production, this would generate a real AI response based on ` +
      `your documentation. The mock mode is working correctly!`

    // Simulate streaming by yielding characters with delay
    for (const char of response) {
      yield char
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private seededRandom(seed: number) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }
}
