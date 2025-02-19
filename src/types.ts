export interface ContentIssue {
  type:
    | "missing-metadata"
    | "content-quality"
    | "semantic-similarity"
    | "readability"
    | "ai-suggestion"
  message: string
  severity: "error" | "warning" | "info"
  details?: {
    recommendation?: string
    relatedFiles?: string[]
    missingFields?: string[]
    aiSuggestions?: {
      clarity?: string
      improvements?: string[]
      keywords?: string[]
      technicalAccuracy?: string
      audienceMatch?: string
    }
  }
}

export interface FileNode {
  type: "file" | "directory"
  name: string
  path: string
  children?: FileNode[]
  isLoading?: boolean
  content?: {
    metadata: Record<string, any>
    rawContent: string
    issues: ContentIssue[]
  }
}

export interface ContentTree {
  docs: FileNode[]
  pages: FileNode[]
  summary: {
    totalFiles: number
    totalIssues: number
    issuesByType: Record<string, number>
  }
}

// Legacy interfaces maintained for backward compatibility
export interface ContentAuditResult {
  filePath: string
  content: string
  metadata: Record<string, any>
  issues: ContentIssue[]
}

export interface ContentAuditContent {
  tree: ContentTree
  summary: {
    totalFiles: number
    totalIssues: number
    issuesByType: Record<string, number>
  }
}

export interface OpenAIConfig {
  apiKey: string
  model?: string // defaults to "gpt-3.5-turbo"
  maxTokens?: number // defaults to 500
  temperature?: number // defaults to 0.3
}

export interface PluginOptions {
  label?: string
  path?: string
  showNavbar?: boolean
  openai?: OpenAIConfig
}
