import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"
import { loadContent } from "./content"
import type { ContentAuditContent } from "./types"

export interface PluginOptions {
  label?: string
  path?: string
  showNavbar?: boolean
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

// Helper function to normalize path with leading slash
function normalizePath(inputPath: string): string {
  // Remove trailing slashes and ensure leading slash
  return "/" + inputPath.replace(/^\/+|\/+$/g, "")
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
  } = options

  // Normalize the path
  const routePath = normalizePath(inputPath)

  return {
    name: "docusaurus-plugin-content-audit",

    getThemePath() {
      return path.resolve(__dirname, "./theme")
    },

    getTypeScriptThemePath() {
      return path.resolve(__dirname, "./theme")
    },

    async loadContent() {
      return loadContent(context)
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
