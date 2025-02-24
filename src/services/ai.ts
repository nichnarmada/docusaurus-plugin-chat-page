import { ChatOpenAI } from "@langchain/openai"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatXAI } from "@langchain/xai"
import { OpenAIEmbeddings } from "@langchain/openai"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { PineconeEmbeddings } from "@langchain/pinecone"
import { TaskType } from "@google/generative-ai"
import { type BaseChatModel } from "@langchain/core/language_models/chat_models"
import { type Embeddings } from "@langchain/core/embeddings"
import { type AIMessageChunk } from "@langchain/core/messages"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { LLMProviderType, EmbeddingProviderType } from "../types"
import type { LLMProvider, EmbeddingProvider } from "../types"
import { DEFAULT_LLM_MODELS, DEFAULT_EMBEDDING_MODELS } from "../constants"

export interface AIService {
  generateEmbeddings(texts: string[]): Promise<number[][]>
  generateChatCompletion(
    messages: { role: string; content: string }[]
  ): AsyncGenerator<string, void, unknown>
}

function createLLMModel(provider: LLMProvider): BaseChatModel {
  const { config } = provider

  switch (provider.provider) {
    case LLMProviderType.OPENAI:
      return new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model || DEFAULT_LLM_MODELS[LLMProviderType.OPENAI],
        streaming: true,
      })
    case LLMProviderType.ANTHROPIC:
      return new ChatAnthropic({
        apiKey: config.apiKey,
        model: config.model || DEFAULT_LLM_MODELS[LLMProviderType.ANTHROPIC],
        streaming: true,
      })
    case LLMProviderType.GOOGLE_GENAI:
      return new ChatGoogleGenerativeAI({
        apiKey: config.apiKey,
        model: config.model || DEFAULT_LLM_MODELS[LLMProviderType.GOOGLE_GENAI],
        streaming: true,
      })
    case LLMProviderType.XAI:
      return new ChatXAI({
        apiKey: config.apiKey,
        model: config.model || DEFAULT_LLM_MODELS[LLMProviderType.XAI],
        streaming: true,
      })
    default:
      throw new Error(`Unsupported LLM provider: ${provider.provider}`)
  }
}

function createEmbeddingsModel(provider: EmbeddingProvider): Embeddings {
  const { config } = provider

  switch (provider.provider) {
    case EmbeddingProviderType.OPENAI:
      return new OpenAIEmbeddings({
        apiKey: config.apiKey,
        model:
          config.model ||
          DEFAULT_EMBEDDING_MODELS[EmbeddingProviderType.OPENAI],
      })
    case EmbeddingProviderType.GOOGLE_GENAI:
      return new GoogleGenerativeAIEmbeddings({
        apiKey: config.apiKey,
        model:
          config.model ||
          DEFAULT_EMBEDDING_MODELS[EmbeddingProviderType.GOOGLE_GENAI],
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Documentation Chunk", // Generic title for documentation chunks
      })
    case EmbeddingProviderType.PINECONE:
      return new PineconeEmbeddings({
        apiKey: config.apiKey,
        model:
          config.model ||
          DEFAULT_EMBEDDING_MODELS[EmbeddingProviderType.PINECONE],
      })
  }
}

export function createAIService(
  llmProvider: LLMProvider,
  embeddingsProvider: EmbeddingProvider
): AIService {
  const chatModel = createLLMModel(llmProvider)
  const embeddingsModel = createEmbeddingsModel(embeddingsProvider)

  return {
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
      return await embeddingsModel.embedDocuments(texts)
    },

    async *generateChatCompletion(
      messages: { role: string; content: string }[]
    ) {
      // Convert messages to LangChain format
      const formattedMessages = messages.map((msg) => {
        switch (msg.role) {
          case "system":
            return new SystemMessage(msg.content)
          case "user":
          case "human":
            return new HumanMessage(msg.content)
          default:
            // For assistant/AI messages, we'll let them be handled by the model's response
            return new HumanMessage(msg.content)
        }
      })

      const stream = await chatModel.stream(formattedMessages)

      for await (const chunk of stream) {
        const content = (chunk as AIMessageChunk).content
        if (typeof content === "string" && content) yield content
      }
    },
  }
}
