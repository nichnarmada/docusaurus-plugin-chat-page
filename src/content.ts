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

              node.content = {
                metadata,
                rawContent,
                issues,
              }
            } catch (validationError) {
              // Still set content even if validation fails
              node.content = {
                metadata,
                rawContent,
                issues: [],
              }
            }
          } else {
            node.content = {
              metadata,
              rawContent,
              issues: [],
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

/**
 * Calculate total issues in a tree
 */
function calculateTreeIssues(nodes: FileNode[]): {
  totalFiles: number
  totalIssues: number
  issuesByType: Record<string, number>
} {
  // Create a map to store issues by directory
  const directoryIssues = new Map<
    string,
    {
      files: number
      issues: number
      issueTypes: Record<string, number>
    }
  >()

  // Process each file node recursively
  function processNode(node: FileNode) {
    console.log("\nProcessing node:", node.path, "Type:", node.type)

    // Initialize directory stats if needed
    if (node.type === "directory") {
      const dirPath = node.path
      if (!directoryIssues.has(dirPath)) {
        directoryIssues.set(dirPath, {
          files: 0,
          issues: 0,
          issueTypes: {},
        })
      }
    }

    // If it's a file with content, record its issues only in its immediate parent directory
    if (node.type === "file" && node.content) {
      const pathParts = node.path.split("/")
      const parentDirParts = pathParts.slice(0, -1)
      const parentDirPath = parentDirParts.join("/")

      if (parentDirPath) {
        // Only process if file has a parent directory
        console.log(
          `\nProcessing file ${node.path} for directory: ${parentDirPath}`
        )

        if (!directoryIssues.has(parentDirPath)) {
          console.log(`Creating new entry for ${parentDirPath}`)
          directoryIssues.set(parentDirPath, {
            files: 0,
            issues: 0,
            issueTypes: {},
          })
        }

        const dirStats = directoryIssues.get(parentDirPath)!
        dirStats.files++
        dirStats.issues += node.content.issues.length

        // Update issueTypes counts
        node.content.issues.forEach((issue) => {
          dirStats.issueTypes[issue.type] =
            (dirStats.issueTypes[issue.type] || 0) + 1
        })

        console.log(`Updated ${parentDirPath}:`, {
          files: dirStats.files,
          issues: dirStats.issues,
          issueTypes: dirStats.issueTypes,
        })
      }
    }

    // If it's a directory, recursively process children first, then aggregate
    if (node.type === "directory" && node.children) {
      node.children.forEach(processNode)

      // After processing children, aggregate their stats up to this directory
      const currentDirStats = directoryIssues.get(node.path)!

      // Get all immediate child directories
      node.children.forEach((child) => {
        if (child.type === "directory") {
          const childStats = directoryIssues.get(child.path)!
          currentDirStats.files += childStats.files
          currentDirStats.issues += childStats.issues

          // Aggregate issue types from child directory
          Object.entries(childStats.issueTypes).forEach(([type, count]) => {
            currentDirStats.issueTypes[type] =
              (currentDirStats.issueTypes[type] || 0) + count
          })
        }
      })

      console.log(`Aggregated ${node.path}:`, {
        files: currentDirStats.files,
        issues: currentDirStats.issues,
        issueTypes: currentDirStats.issueTypes,
      })
    }
  }

  // Process all nodes recursively
  nodes.forEach(processNode)

  console.log("\n--- Directory Issues Map ---")
  directoryIssues.forEach((value, key) => {
    console.log(`\n${key}:`, value)
  })

  // Calculate totals
  let totalFiles = 0
  let totalIssues = 0
  const issuesByType: Record<string, number> = {}

  // Only count root level directories for the final totals
  nodes.forEach((node) => {
    if (node.type === "directory") {
      const stats = directoryIssues.get(node.path)!
      totalFiles += stats.files
      totalIssues += stats.issues
      Object.entries(stats.issueTypes).forEach(([type, count]) => {
        issuesByType[type] = (issuesByType[type] || 0) + count
      })
    } else if (node.type === "file" && node.content) {
      // Handle root-level files
      totalFiles += 1
      totalIssues += node.content.issues.length
      node.content.issues.forEach((issue) => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1
      })
    }
  })

  console.log("\n--- Final Totals ---")
  console.log({
    totalFiles,
    totalIssues,
    issuesByType,
  })

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
