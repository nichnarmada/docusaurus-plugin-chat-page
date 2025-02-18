export interface ContentAuditResult {
  filePath: string
  content: string
  metadata: any
  issues: {
    type: "broken-link" | "missing-metadata" | "formatting"
    message: string
    severity: "error" | "warning" | "info"
    location?: {
      line: number
      column: number
    }
  }[]
}

export interface ContentAuditContent {
  docs: ContentAuditResult[]
  pages: ContentAuditResult[]
  summary: {
    totalFiles: number
    totalIssues: number
    issuesByType: Record<string, number>
  }
}
