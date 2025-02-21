import React, { useState, useRef, useEffect } from "react"
import Layout from "@theme/Layout"
import { usePluginData } from "@docusaurus/useGlobalData"
import useIsBrowser from "@docusaurus/useIsBrowser"
import type { DocumentChunk, DocumentChunkWithEmbedding } from "../../types"
import styles from "./styles.module.css"
import OpenAI from "openai"
import { cosineSimilarity } from "../../utils/vector"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export default function ChatPage(): JSX.Element {
  const isBrowser = useIsBrowser()
  const [forceUpdate, setForceUpdate] = useState(0)
  const pluginData = usePluginData("docusaurus-plugin-chat-page")

  // Subscribe to content updates in development
  useEffect(() => {
    if (isBrowser && process.env.NODE_ENV === "development") {
      // @ts-ignore - registerReloadCallback is added by our plugin
      const unsubscribe = (window as any).docusaurus.registerReloadCallback?.(
        () => setForceUpdate((n) => n + 1)
      )
      return () => unsubscribe?.()
    }
  }, [isBrowser])

  // Log plugin data changes
  useEffect(() => {
    if (pluginData) {
      const { chunks, metadata, config } = pluginData as {
        chunks: DocumentChunkWithEmbedding[]
        metadata: {
          totalChunks: number
          lastUpdated: string
        }
        config: {
          openai: {
            apiKey: string
          }
        }
      }
    }
  }, [pluginData])

  // Defensive check for data
  if (!pluginData || typeof pluginData !== "object") {
    return (
      <Layout title="Chat" description="Chat with your documentation">
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <div className={styles.errorMessage}>
                No plugin data available. Make sure the plugin is properly
                configured.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const { chunks, metadata, config } = pluginData as {
    chunks: DocumentChunkWithEmbedding[]
    metadata: {
      totalChunks: number
      lastUpdated: string
    }
    config: {
      openai: {
        apiKey: string
      }
    }
  }

  // Check for required data
  if (!chunks || !metadata || !config?.openai?.apiKey) {
    return (
      <Layout title="Chat" description="Chat with your documentation">
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <div className={styles.errorMessage}>
                Missing required data. Please ensure the plugin is properly
                configured with:
                <ul>
                  {!chunks && <li>Document chunks</li>}
                  {!metadata && <li>Metadata</li>}
                  {!config?.openai?.apiKey && <li>OpenAI API key</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  })
  const [inputValue, setInputValue] = useState("")
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  // Initialize OpenAI client with API key from plugin options
  const client = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true,
  })

  // Scroll to bottom of chat history when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [chatState.messages])

  // Find most relevant chunks for the query
  const findRelevantChunks = async (query: string, topK: number = 3) => {
    try {
      // Get query embedding from OpenAI
      const response = await client.embeddings.create({
        input: query,
        model: "text-embedding-3-small",
      })
      const queryEmbedding = response.data[0].embedding

      // Calculate cosine similarity with all chunks
      const similarities = chunks.map((chunk) => ({
        chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))

      // Sort by similarity and get top K
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map((item) => item.chunk)
    } catch (error) {
      console.error("Error getting embeddings:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || chatState.isLoading) return

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    // Add user message once
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }))
    setInputValue("")

    try {
      // Find relevant chunks
      const relevantChunks = await findRelevantChunks(inputValue)

      // Prepare system message with context
      const contextText = relevantChunks
        .map((chunk) => `${chunk.text}\nSource: ${chunk.metadata.filePath}`)
        .join("\n\n")

      // Get response from OpenAI
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful documentation assistant. Answer questions based on the following documentation context:\n\n${contextText}`,
          },
          ...chatState.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: inputValue },
        ],
        stream: true,
      })

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      // Add initial empty assistant message
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }))

      // Stream the response
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ""
        assistantMessage.content += content

        // Only update the assistant's message content
        setChatState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages.slice(0, -1),
            {
              ...assistantMessage,
              content: assistantMessage.content,
            },
          ],
        }))
      }

      // Final update after streaming is complete
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    } catch (error) {
      console.error("Error:", error)
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to get response. Please try again.",
      }))
    }
  }

  return (
    <Layout title="Chat" description="Chat with your documentation">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>Chat with Documentation</h1>
            <p>
              Ask questions about your documentation and get AI-powered answers.
              {metadata.totalChunks} chunks of documentation indexed, last
              updated {new Date(metadata.lastUpdated).toLocaleDateString()}.
            </p>

            <div className={styles.chatContainer}>
              <div className={styles.chatHistory} ref={chatHistoryRef}>
                {chatState.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${
                      message.role === "assistant"
                        ? styles.assistantMessage
                        : styles.userMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    <div className={styles.messageTimestamp}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {chatState.isLoading && (
                  <div className={styles.loadingIndicator}>
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </div>
                )}
                {chatState.error && (
                  <div className={styles.errorMessage}>{chatState.error}</div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className={styles.chatInputContainer}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about the documentation..."
                  className={styles.chatInput}
                  disabled={chatState.isLoading}
                />
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={chatState.isLoading || !inputValue.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
