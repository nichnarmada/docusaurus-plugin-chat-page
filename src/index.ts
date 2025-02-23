/// <reference types="@docusaurus/module-type-aliases" />

import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"
import { loadContent } from "./content"
import type { ChatPluginContent, PluginOptions } from "./types"
import {
  installMissingPackages,
  validatePackages,
} from "./utils/package-manager"

export * from "./types"

export default async function pluginChatPage(
  context: LoadContext,
  options: PluginOptions = {}
): Promise<Plugin<ChatPluginContent>> {
  const {
    siteConfig: { baseUrl },
  } = context

  // Default options
  const { label = "Chat", path: inputPath = "chat" } = options

  // Install required packages based on configuration
  try {
    await installMissingPackages(options)
  } catch (error) {
    console.error("Failed to install required packages:", error)
    throw error
  }

  // Validate that all required packages are available
  await validatePackages(options)

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
      // For backward compatibility
      if (options.openai && !options.llm && !options.embeddings) {
        options.llm = {
          provider: "openai" as any,
          config: options.openai,
        }
        options.embeddings = {
          provider: "openai" as any,
          config: options.openai,
        }
      }

      // Validate that at least one provider is configured
      if (!options.llm || !options.embeddings) {
        throw new Error(
          "You must configure both an LLM provider and an embeddings provider"
        )
      }

      return loadContent({ ...context, options })
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute, setGlobalData } = actions

      // Remove sensitive data before exposing to client
      const safeContent = {
        ...content,
        config: {
          llmProvider: options.llm?.provider,
          embeddingsProvider: options.embeddings?.provider,
        },
      }

      setGlobalData({
        pluginId: "docusaurus-plugin-chat-page",
        ...safeContent,
      })

      const embeddingsPath = await createData(
        "embeddings.json",
        JSON.stringify(safeContent)
      )

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
