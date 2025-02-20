/// <reference types="@docusaurus/module-type-aliases" />

import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"
import { loadContent } from "./content"
import type { ChatPluginContent, OpenAIConfig } from "./types"

export interface PluginOptions {
  label?: string
  path?: string
  openai?: OpenAIConfig
}

interface LoadContextWithOptions extends LoadContext {
  options?: {
    openai?: OpenAIConfig
  }
}

function normalizePath(inputPath: string): string {
  return inputPath.replace(/^\/+/, "")
}

export default function pluginChatPage(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<ChatPluginContent> {
  const {
    siteConfig: { baseUrl },
  } = context

  // Default options
  const { label = "Chat", path: inputPath = "chat", openai } = options

  // Normalize the path
  const routePath = normalizeUrl([baseUrl, inputPath])

  return {
    name: "docusaurus-plugin-chat-page",

    getThemePath() {
      return "../lib/theme"
    },

    getTypeScriptThemePath() {
      return "./theme"
    },

    getPathsToWatch() {
      return [
        path.join("src", "theme", "**", "*.{ts,tsx}"),
        path.join("src", "utils", "**", "*.{ts,tsx}"),
      ]
    },

    getClientModules() {
      return [path.join("theme", "ChatPage", "styles.module.css")]
    },

    async loadContent() {
      console.log("loadContent - OpenAI config:", openai)
      if (!openai?.apiKey) {
        throw new Error(
          "OpenAI API key is required. Please add it to your docusaurus.config.js"
        )
      }
      return loadContent({ ...context, options: { openai } })
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute, setGlobalData } = actions

      // Set all global data in a single call
      setGlobalData({
        pluginId: "docusaurus-plugin-chat-page",
        ...content,
        config: {
          openai,
        },
      })

      // Create embeddings file
      const embeddingsPath = await createData(
        "embeddings.json",
        JSON.stringify({
          ...content,
          config: {
            openai,
          },
        })
      )

      // Add the chat route
      addRoute({
        path: routePath,
        component: "@theme/ChatPage",
        modules: {
          embeddings: embeddingsPath,
        },
        exact: true,
      })
    },
  }
}
