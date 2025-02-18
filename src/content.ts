import { LoadContext } from "@docusaurus/types"
import * as fs from "fs/promises"
import * as path from "path"
import type { ContentAuditContent, ContentAuditResult } from "./types"

/**
 * Recursively find all markdown files in a directory
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue
      }
      files.push(...(await findMarkdownFiles(fullPath)))
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Parse frontmatter metadata from markdown content
 */
function parseFrontmatter(content: string): [Record<string, any>, string] {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return [{}, content]
  }

  try {
    const metadata = match[1].split("\n").reduce((acc, line) => {
      const [key, ...values] = line.split(":")
      if (key && values.length) {
        acc[key.trim()] = values.join(":").trim()
      }
      return acc
    }, {} as Record<string, any>)

    return [metadata, match[2]]
  } catch (error) {
    return [{}, content]
  }
}

/**
 * Load and process content from a directory
 */
async function processDirectory(
  dir: string,
  baseDir: string
): Promise<ContentAuditResult[]> {
  if (
    !(await fs
      .access(dir)
      .then(() => true)
      .catch(() => false))
  ) {
    return []
  }

  const files = await findMarkdownFiles(dir)
  const results: ContentAuditResult[] = []

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8")
    const [metadata, processedContent] = parseFrontmatter(content)
    const relativePath = path.relative(baseDir, file)

    results.push({
      filePath: relativePath,
      content: processedContent,
      metadata,
      issues: [], // Will be populated by analysis tools later
    })
  }

  return results
}

/**
 * Load all content and generate audit data
 */
export async function loadContent(
  context: LoadContext
): Promise<ContentAuditContent> {
  const { siteDir } = context

  const docsDir = path.join(siteDir, "docs")
  const pagesDir = path.join(siteDir, "src/pages")

  const [docs, pages] = await Promise.all([
    processDirectory(docsDir, docsDir),
    processDirectory(pagesDir, pagesDir),
  ])

  // Calculate summary statistics
  const totalFiles = docs.length + pages.length
  const totalIssues = [...docs, ...pages].reduce(
    (sum, file) => sum + file.issues.length,
    0
  )

  // Count issues by type
  const issuesByType = [...docs, ...pages].reduce((acc, file) => {
    file.issues.forEach((issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  return {
    docs,
    pages,
    summary: {
      totalFiles,
      totalIssues,
      issuesByType,
    },
  }
}
