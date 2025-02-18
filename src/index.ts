import { LoadContext, Plugin, ThemeConfig } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"
import * as path from "path"

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

interface DocusaurusThemeConfig extends ThemeConfig {
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
): Plugin<void> & {
  getThemeConfig: (config: {
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

    async contentLoaded({ actions }) {
      const { addRoute } = actions

      // Add route for the audit dashboard
      addRoute({
        path: normalizeUrl([baseUrl, routePath]),
        component: "@theme/ContentAudit",
        exact: true,
      })
    },

    // Add navbar/footer items
    getThemeConfig(props) {
      if (!showNavbar) {
        return props.themeConfig
      }

      // Add navbar item
      const navbarItems = props.themeConfig.navbar?.items || []
      const newNavbarItem: NavbarItem = {
        to: routePath,
        label: label,
        position: "left",
      }

      return {
        ...props.themeConfig,
        navbar: {
          ...props.themeConfig.navbar,
          items: [...navbarItems, newNavbarItem],
        },
      }
    },
  }
}
