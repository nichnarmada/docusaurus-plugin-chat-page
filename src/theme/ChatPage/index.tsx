import React from "react"
import Layout from "@theme/Layout"
import { usePluginData } from "@docusaurus/useGlobalData"
import type { DocumentChunk } from "../../types"

export default function ChatPage(): JSX.Element {
  const { chunks, metadata } = usePluginData("docusaurus-plugin-chat-page") as {
    chunks: DocumentChunk[]
    metadata: {
      totalChunks: number
      lastUpdated: string
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
            {/* Chat UI components will be added here */}
          </div>
        </div>
      </div>
    </Layout>
  )
}
