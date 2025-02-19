import { LoadContext } from "@docusaurus/types"
import * as fs from "fs/promises"
import * as path from "path"
import type {
  FileNode,
  ContentAuditContent,
  ContentAuditResult,
  ContentTree,
} from "./types"

/**
 * Convert a flat list of file paths into a tree structure
 */
function pathsToTree(files: string[], baseDir: string): FileNode[] {
  const root: FileNode[] = []
  const nodes = new Map<string, FileNode>()

  // Sort files to ensure parent directories are processed first
  const sortedFiles = [...files].sort()

  for (const file of sortedFiles) {
    const relativePath = path.relative(baseDir, file)
    const parts = relativePath.split(path.sep)
    let currentPath = ""

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const fullPath = path.join(currentPath, part)
      const displayPath = isFile ? relativePath : fullPath

      if (!nodes.has(fullPath)) {
        // Get the actual file/directory name from the path
        const name = isFile
          ? path.basename(file, path.extname(file)) // Remove extension for files
          : part

        const node: FileNode = {
          type: isFile ? "file" : "directory",
          name: name,
          path: displayPath,
          children: isFile ? undefined : [],
        }
        nodes.set(fullPath, node)

        if (currentPath === "") {
          root.push(node)
        } else {
          const parent = nodes.get(currentPath)
          parent?.children?.push(node)
        }
      }

      currentPath = fullPath
    }
  }

  return root
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
 * Process a directory and build a tree structure
 */
async function processDirectory(dir: string): Promise<FileNode[]> {
  if (
    !(await fs
      .access(dir)
      .then(() => true)
      .catch(() => false))
  ) {
    return []
  }

  const allFiles = await (async function walk(
    currentDir: string
  ): Promise<string[]> {
    const files: string[] = []
    const entries = await fs.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          files.push(...(await walk(fullPath)))
        }
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        files.push(fullPath)
      }
    }

    return files
  })(dir)

  // Convert flat list to tree
  const tree = pathsToTree(allFiles, dir)

  // Process file contents
  for (const file of allFiles) {
    const content = await fs.readFile(file, "utf-8")
    const [metadata, rawContent] = parseFrontmatter(content)
    const relativePath = path.relative(dir, file)

    // Find the corresponding node in the tree
    let currentNodes = tree
    const parts = relativePath.split(path.sep)

    for (const part of parts) {
      const node = currentNodes.find((n) => n.name === part)
      if (node?.type === "file") {
        node.content = {
          metadata,
          rawContent,
          issues: [], // Will be populated by analysis tools later
        }
        break
      }
      currentNodes = node?.children || []
    }
  }

  return tree
}

/**
 * Calculate total issues in a tree
 */
function calculateTreeIssues(nodes: FileNode[]): {
  totalFiles: number
  totalIssues: number
  issuesByType: Record<string, number>
} {
  let totalFiles = 0
  let totalIssues = 0
  const issuesByType: Record<string, number> = {}

  function traverse(node: FileNode) {
    if (node.type === "file") {
      totalFiles++
      if (node.content) {
        totalIssues += node.content.issues.length
        node.content.issues.forEach((issue) => {
          issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1
        })
      }
    } else if (node.children) {
      node.children.forEach(traverse)
    }
  }

  nodes.forEach(traverse)

  return {
    totalFiles,
    totalIssues,
    issuesByType,
  }
}

/**
 * Convert a tree structure to a flat list of files
 */
function treeToFlatList(nodes: FileNode[]): ContentAuditResult[] {
  const results: ContentAuditResult[] = []

  function traverse(node: FileNode) {
    if (node.type === "file") {
      // Ensure we have at least an empty content object if none exists
      const content = node.content || {
        metadata: {},
        rawContent: "",
        issues: [],
      }

      results.push({
        filePath: node.path,
        content: content.rawContent || "",
        metadata: content.metadata || {},
        issues: content.issues || [],
      })
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  nodes.forEach(traverse)
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

  // Get the tree structures
  const [docsTree, pagesTree] = await Promise.all([
    processDirectory(docsDir),
    processDirectory(pagesDir),
  ])

  // Calculate summary statistics from the tree
  const docsStats = calculateTreeIssues(docsTree)
  const pagesStats = calculateTreeIssues(pagesTree)

  const summary = {
    totalFiles: docsStats.totalFiles + pagesStats.totalFiles,
    totalIssues: docsStats.totalIssues + pagesStats.totalIssues,
    issuesByType: Object.entries(docsStats.issuesByType).reduce(
      (acc, [type, count]) => {
        acc[type] = (acc[type] || 0) + count
        return acc
      },
      { ...pagesStats.issuesByType }
    ),
  }

  // Create the tree structure that matches ContentTree interface
  const tree: ContentTree = {
    docs: docsTree,
    pages: pagesTree,
    summary: summary,
  }

  return {
    tree,
    summary,
  }
}
