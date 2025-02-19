import { LoadContext } from "@docusaurus/types"
import * as fs from "fs/promises"
import * as path from "path"
import type {
  FileNode,
  ContentAuditContent,
  ContentAuditResult,
  ContentTree,
  OpenAIConfig,
  ContentIssue,
} from "./types"
import { validateWithAI } from "./validators/ai"
import { glob } from "glob"

/**
 * Convert a flat list of file paths into a tree structure
 */
function pathsToTree(files: string[], baseDir: string): FileNode[] {
  const root: FileNode[] = []
  const nodes = new Map<string, FileNode>()

  // Sort files to ensure parent directories are processed first
  const sortedFiles = [...files].sort()

  for (const file of sortedFiles) {
    // File is already relative to baseDir
    const parts = file.split(path.sep)
    let currentPath = ""

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const fullPath = path.join(currentPath, part)
      const displayPath = file // Use the original relative path for files

      if (!nodes.has(fullPath)) {
        // Get the actual file/directory name from the path
        const name = isFile
          ? path.basename(part, path.extname(part)) // Remove extension for files
          : part

        const node: FileNode = {
          type: isFile ? "file" : "directory",
          name: name,
          path: isFile ? displayPath : fullPath,
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
export async function processDirectory(
  dir: string,
  openai?: OpenAIConfig
): Promise<FileNode[]> {
  try {
    const files = glob.sync("**/*.md", {
      cwd: dir,
      absolute: false,
    })

    const tree = pathsToTree(files, dir)

    // Process each file node
    const processNode = async (node: FileNode): Promise<void> => {
      if (node.type === "file") {
        try {
          node.isLoading = true
          const content = await fs.readFile(path.join(dir, node.path), "utf-8")
          const [metadata, rawContent] = parseFrontmatter(content)

          if (openai?.apiKey) {
            try {
              const issues = await validateWithAI(
                rawContent,
                node.path,
                metadata,
                openai
              )
              const overallScore = calculateOverallScore(issues)

              node.content = {
                metadata,
                rawContent,
                issues,
                overallScore,
              }
            } catch (validationError) {
              // Still set content even if validation fails
              node.content = {
                metadata,
                rawContent,
                issues: [],
                overallScore: 0,
              }
            }
          } else {
            node.content = {
              metadata,
              rawContent,
              issues: [],
              overallScore: 0,
            }
          }
        } catch (error) {
          console.error(`Error processing file ${node.path}:`, error)
        } finally {
          node.isLoading = false
        }
      }

      // Process children recursively
      if (node.children) {
        await Promise.all(node.children.map(processNode))
      }
    }

    // Process all root nodes
    await Promise.all(tree.map(processNode))

    return tree
  } catch (error) {
    console.error("Error in processDirectory:", error)
    throw error
  }
}

function calculateOverallScore(issues: ContentIssue[]): number {
  if (!issues.length) return 100

  // Calculate weighted average of all scores
  const scores = issues.map((issue) => ({
    score: issue.details?.score || 0,
    weight:
      issue.severity === "error" ? 3 : issue.severity === "warning" ? 2 : 1,
  }))

  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0)
  const weightedSum = scores.reduce(
    (sum, item) => sum + item.score * item.weight,
    0
  )

  return Math.round(weightedSum / totalWeight)
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
  context: LoadContext & { options?: { openai?: OpenAIConfig } }
): Promise<ContentAuditContent> {
  const { siteDir, options } = context

  if (!options?.openai?.apiKey) {
    throw new Error(
      "OpenAI API key is required. Please add it to your docusaurus.config.js"
    )
  }

  const docsDir = path.join(siteDir, "docs")
  const pagesDir = path.join(siteDir, "src/pages")

  // Get the tree structures
  const [docsTree, pagesTree] = await Promise.all([
    processDirectory(docsDir, options.openai),
    processDirectory(pagesDir, options.openai),
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

  return {
    tree: {
      docs: docsTree,
      pages: pagesTree,
      summary,
    },
    summary,
  }
}
