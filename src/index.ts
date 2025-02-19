import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"
import { loadContent } from "./content"
import type { ContentAuditContent, OpenAIConfig } from "./types"

export interface PluginOptions {
  label?: string
  path?: string
  showNavbar?: boolean
  openai?: OpenAIConfig
}

interface NavbarItem {
  to: string
  label: string
  position: "left" | "right"
}

interface DocusaurusThemeConfig {
  navbar?: {
    items?: NavbarItem[]
  }
}

interface LoadContextWithOptions extends LoadContext {
  options?: {
    openai?: OpenAIConfig
  }
}

function normalizePath(inputPath: string): string {
  return inputPath.startsWith("/") ? inputPath : `/${inputPath}`
}

export default function pluginContentAudit(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<ContentAuditContent> & {
  getThemeConfig: (props: {
    themeConfig: DocusaurusThemeConfig
  }) => DocusaurusThemeConfig
} {
  const {
    siteConfig: { baseUrl },
  } = context

  // Default options
  const {
    label = "Content Audit",
    path: inputPath = "content-audit",
    showNavbar = true,
    openai,
  } = options

  // Normalize the path
  const routePath = normalizePath(inputPath)

  let content: ContentAuditContent | null = null

  // Create a context with options
  const contextWithOptions: LoadContextWithOptions = {
    ...context,
    options: {
      openai,
    },
  }

  return {
    name: "docusaurus-plugin-content-audit",

    getThemePath() {
      return path.resolve(__dirname, "./theme")
    },

    getTypeScriptThemePath() {
      return path.resolve(__dirname, "./theme")
    },

    getClientModules() {
      return [path.resolve(__dirname, "./client/index")]
    },

    async loadContent() {
      content = await loadContent(contextWithOptions)
      return content
    },

    async contentLoaded({ actions, content }) {
      const { addRoute, setGlobalData } = actions

      // Make content available to theme components
      setGlobalData(content)

      // Add route for the audit dashboard
      addRoute({
        path: normalizeUrl([baseUrl, routePath]),
        component: "@theme/ContentAudit",
        exact: true,
      })
    },

    // Register paths to watch for changes
    getPathsToWatch() {
      return [
        path.join(context.siteDir, "docs/**/*.{md,mdx}"),
        path.join(context.siteDir, "src/pages/**/*.{md,mdx}"),
      ]
    },

    // Add navbar/footer items
    getThemeConfig({ themeConfig }: { themeConfig: DocusaurusThemeConfig }) {
      if (!showNavbar) {
        return themeConfig
      }

      // Add navbar item
      const navbarItems = themeConfig.navbar?.items || []
      const newNavbarItem: NavbarItem = {
        to: routePath,
        label: label,
        position: "left",
      }

      return {
        ...themeConfig,
        navbar: {
          ...themeConfig.navbar,
          items: [...navbarItems, newNavbarItem],
        },
      }
    },
  }
}
