import { LoadContext } from "@docusaurus/types"
import * as fs from "fs/promises"
import * as path from "path"
import type { FileNode, ChatPluginContent, OpenAIConfig } from "./types"
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
export async function processDirectory(dir: string): Promise<FileNode[]> {
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
          const content = await fs.readFile(path.join(dir, node.path), "utf-8")
          const [metadata, rawContent] = parseFrontmatter(content)
          node.content = {
            metadata,
            rawContent,
          }
        } catch (error) {
          console.error(`Error processing file ${node.path}:`, error)
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
 * Convert a tree structure to a flat list of files with their content
 */
function treeToFlatList(
  nodes: FileNode[]
): Array<{ filePath: string; content: string; metadata: Record<string, any> }> {
  const results: Array<{
    filePath: string
    content: string
    metadata: Record<string, any>
  }> = []

  function traverse(node: FileNode) {
    if (node.type === "file" && node.content) {
      results.push({
        filePath: node.path,
        content: node.content.rawContent,
        metadata: node.content.metadata,
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
 * Load all content and prepare for embedding generation
 */
export async function loadContent(
  context: LoadContext & { options?: { openai?: OpenAIConfig } }
): Promise<ChatPluginContent> {
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
    processDirectory(docsDir),
    processDirectory(pagesDir),
  ])

  // Convert trees to flat lists and combine
  const allFiles = [...treeToFlatList(docsTree), ...treeToFlatList(pagesTree)]

  // TODO: Implement chunk generation and embedding computation
  const chunks: ChatPluginContent["chunks"] = []

  return {
    chunks,
    metadata: {
      totalChunks: chunks.length,
      lastUpdated: new Date().toISOString(),
    },
  }
}
