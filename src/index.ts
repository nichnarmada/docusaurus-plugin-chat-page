import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"
import { loadContent } from "./content"
import type { ChatPluginContent, OpenAIConfig } from "./types"

export interface PluginOptions {
  label?: string
  path?: string
  showNavbar?: boolean
  openai?: OpenAIConfig
}

interface LoadContextWithOptions extends LoadContext {
  options?: {
    openai?: OpenAIConfig
  }
}

interface DocusaurusThemeConfig {
  navbar?: {
    items: Array<{ label: string; to: string; position?: string }>
  }
}

function normalizePath(inputPath: string): string {
  return inputPath.replace(/^\/+/, "")
}

export default function pluginChatPage(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<ChatPluginContent> & {
  getThemeConfig: (props: {
    themeConfig: DocusaurusThemeConfig
  }) => DocusaurusThemeConfig
} {
  const {
    siteConfig: { baseUrl },
  } = context

  // Default options
  const {
    label = "Chat",
    path: inputPath = "chat",
    showNavbar = true,
    openai,
  } = options

  // Normalize the path
  const routePath = normalizePath(inputPath)

  let content: ChatPluginContent | null = null

  // Create a context with options
  const contextWithOptions: LoadContextWithOptions = {
    ...context,
    options: {
      openai,
    },
  }

  return {
    name: "docusaurus-plugin-chat-page",

    getThemePath() {
      return path.resolve(__dirname, "./theme")
    },

    getTypeScriptThemePath() {
      return path.resolve(__dirname, "./theme")
    },

    async loadContent() {
      content = await loadContent(contextWithOptions)
      return content
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute } = actions

      // Save embeddings as static asset
      const embeddingsPath = await createData(
        "embeddings.json",
        JSON.stringify(content)
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

    getThemeConfig({ themeConfig }: { themeConfig: DocusaurusThemeConfig }) {
      if (!showNavbar) {
        return themeConfig
      }

      // Add the chat page to the navbar
      return {
        ...themeConfig,
        navbar: {
          ...themeConfig.navbar,
          items: [
            ...(themeConfig.navbar?.items || []),
            {
              label,
              to: normalizeUrl([baseUrl, routePath]),
              position: "left",
            },
          ],
        },
      }
    },
  }
}
