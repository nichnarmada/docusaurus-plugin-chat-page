/// <reference types="@docusaurus/module-type-aliases" />

import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"
import { loadContent } from "./content"
import type {
  ChatPluginContent,
  OpenAIConfig,
  DevelopmentConfig,
} from "./types"

export interface PluginOptions {
  label?: string
  path?: string
  openai?: OpenAIConfig
  development?: DevelopmentConfig
}

export default function pluginChatPage(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<ChatPluginContent> {
  const {
    siteConfig: { baseUrl },
  } = context

  // Default options
  const {
    label = "Chat",
    path: inputPath = "chat",
    openai,
    development,
  } = options

  // Normalize the path
  const routePath = normalizeUrl([baseUrl, inputPath])

  // Check if mock data is enabled
  const useMockData = development?.mockData === true

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
      // Check API key requirement
      if (!useMockData && !openai?.apiKey) {
        throw new Error(
          "OpenAI API key is required. Please add it to your docusaurus.config.js " +
            "or enable mock data with development: { mockData: true }"
        )
      }

      // Warn if using mock data in production
      if (useMockData && process.env.NODE_ENV === "production") {
        console.warn(
          "\x1b[41m\x1b[37m ⚠️  WARNING \x1b[0m Building for production with mock data enabled! " +
            "This should only be used for development."
        )
      }

      return loadContent({ ...context, options: { openai, development } })
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute, setGlobalData } = actions

      setGlobalData({
        pluginId: "docusaurus-plugin-chat-page",
        ...content,
        config: {
          openai,
          development, // Pass development config to runtime
        },
      })

      const embeddingsPath = await createData(
        "embeddings.json",
        JSON.stringify({
          ...content,
          config: {
            openai,
            development, // Pass development config to runtime
          },
        })
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
