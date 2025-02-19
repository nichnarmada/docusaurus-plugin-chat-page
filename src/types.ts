export interface ContentIssue {
  type: "broken-link" | "missing-metadata" | "formatting"
  message: string
  severity: "error" | "warning" | "info"
  location?: {
    line: number
    column: number
  }
}

export interface FileNode {
  type: "file" | "directory"
  name: string
  path: string
  children?: FileNode[]
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
