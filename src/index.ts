import { LoadContext, Plugin } from "@docusaurus/types"
import { normalizeUrl } from "@docusaurus/utils"

export interface PluginOptions {
  path?: string
  includeDocumentation?: boolean
  includePages?: boolean
}

interface ContentAuditContent {
  docs: {
    filePath: string
    content: string
    metadata: any
  }[]
  pages: {
    filePath: string
    content: string
    metadata: any
  }[]
}

export default function pluginContentAudit(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<ContentAuditContent> {
  const {
    siteConfig: { baseUrl },
    siteDir,
  } = context

  return {
    name: "docusaurus-plugin-content-audit",

    // Get theme path for any UI components we'll add later
    getThemePath() {
      return "../lib/theme"
    },

    getTypeScriptThemePath() {
      return "../src/theme"
    },

    // Load content from docs and pages
    async loadContent(): Promise<ContentAuditContent> {
      console.log("Loading content for audit...")

      const content: ContentAuditContent = {
        docs: [],
        pages: [],
      }

      // TODO: Implement content loading logic
      // 1. Scan docs directory for markdown files
      // 2. Parse metadata and content
      // 3. Check for broken links
      // 4. Validate metadata completeness

      return content
    },

    // Process loaded content and run audits
    async contentLoaded({ content, actions }) {
      console.log("Running content audits...")
      const { addRoute, createData } = actions

      // TODO: Implement audit logic and create routes
      // Example route for audit dashboard
      addRoute({
        path: normalizeUrl([baseUrl, "__docusaurus/content-audit"]),
        component: "@theme/ContentAudit",
        exact: true,
        props: {
          content,
        },
      })
    },

    // Register any client-side components
    getClientModules() {
      return []
    },

    // Extend webpack config if needed
    configureWebpack(config, isServer, utils) {
      return {}
    },
  }
}

// Validate plugin options
export function validateOptions({
  validate,
  options,
}: {
  validate: any
  options: PluginOptions
}): PluginOptions {
  const validatedOptions = validate.objectOf({
    path: validate.string().optional(),
    includeDocumentation: validate.boolean().optional(),
    includePages: validate.boolean().optional(),
  })
  return validatedOptions(options)
}
