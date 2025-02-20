import { LoadContext } from "@docusaurus/types"
import * as fs from "fs/promises"
import * as path from "path"
import type { FileNode, ChatPluginContent, OpenAIConfig } from "./types"
import { glob } from "glob"
import matter from "gray-matter"
import { remark } from "remark"
import strip from "strip-markdown"
import { createOpenAIClient } from "./services/openai"
import process from "process"

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
 * Split text into chunks intelligently, trying to break at paragraph boundaries
 */
function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  // Split into paragraphs first
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, save current chunk and start new one
    if (currentChunk && currentChunk.length + paragraph.length > maxChunkSize) {
      chunks.push(currentChunk.trim())
      currentChunk = ""
    }

    // If a single paragraph is too long, split it by sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize) {
          if (currentChunk) chunks.push(currentChunk.trim())
          currentChunk = sentence
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence
        }
      }
    } else {
      // Add paragraph to current chunk
      currentChunk = currentChunk
        ? `${currentChunk}\n\n${paragraph}`
        : paragraph
    }
  }

  // Add the last chunk if there is one
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * Process markdown content into plain text and extract frontmatter
 */
async function processMarkdown(content: string): Promise<{
  plainText: string
  frontmatter: Record<string, any>
}> {
  // Extract frontmatter using gray-matter
  const { data: frontmatter, content: markdownContent } = matter(content)

  // Convert markdown to plain text
  const file = await remark().use(strip).process(markdownContent)
  const plainText = String(file)

  return {
    plainText: plainText.trim(),
    frontmatter,
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

    console.log(`\nProcessing ${files.length} markdown files from ${dir}...`)

    const tree = pathsToTree(files, dir)
    let processedFiles = 0
    const totalFiles = files.length

    // Process each file node
    const processNode = async (node: FileNode): Promise<void> => {
      if (node.type === "file") {
        try {
          const content = await fs.readFile(path.join(dir, node.path), "utf-8")
          const { plainText, frontmatter } = await processMarkdown(content)
          node.content = {
            metadata: frontmatter,
            rawContent: plainText,
          }
          processedFiles++
          const progress = Math.round((processedFiles / totalFiles) * 100)
          process.stdout.write(
            `\rProgress: ${progress}% (${processedFiles}/${totalFiles} files)`
          )
        } catch (error) {
          console.error(`\nError processing file ${node.path}:`, error)
        }
      }

      // Process children recursively
      if (node.children) {
        await Promise.all(node.children.map(processNode))
      }
    }

    // Process all root nodes
    await Promise.all(tree.map(processNode))
    console.log("\nFile processing complete!")

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
 * Generate embeddings for chunks in batches
 */
async function generateEmbeddings(
  chunks: Array<{ text: string; metadata: Record<string, any> }>,
  openAIConfig: OpenAIConfig,
  batchSize: number = 20
) {
  const openAIClient = createOpenAIClient({
    apiKey: openAIConfig.apiKey,
    // model: openAIConfig.embeddingModel,
  })

  const results = []
  const totalChunks = chunks.length
  let processedChunks = 0

  console.log(
    `\nGenerating embeddings for ${totalChunks} chunks in batches of ${batchSize}...`
  )

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const texts = batch.map((chunk) => chunk.text)
    const embeddings = await openAIClient.generateEmbeddings(texts)

    for (let j = 0; j < batch.length; j++) {
      results.push({
        text: batch[j].text,
        metadata: batch[j].metadata,
        embedding: embeddings[j],
      })
    }

    processedChunks += batch.length
    const progress = Math.round((processedChunks / totalChunks) * 100)
    process.stdout.write(
      `\rProgress: ${progress}% (${processedChunks}/${totalChunks} chunks)`
    )
  }

  console.log("\nEmbeddings generation complete!")
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

  console.log("\n=== Starting content processing ===")

  const docsDir = path.join(siteDir, "docs")
  const pagesDir = path.join(siteDir, "src/pages")

  // Get the tree structures
  const [docsTree, pagesTree] = await Promise.all([
    processDirectory(docsDir),
    processDirectory(pagesDir),
  ])

  // Convert trees to flat lists and combine
  const allFiles = [...treeToFlatList(docsTree), ...treeToFlatList(pagesTree)]
  console.log(`\nFound ${allFiles.length} total files to process`)

  // Process each file into chunks with metadata
  console.log("\nSplitting content into chunks...")
  let processedForChunking = 0
  const totalForChunking = allFiles.length

  const allChunks = allFiles.flatMap((file) => {
    const textChunks = splitIntoChunks(file.content)
    processedForChunking++
    const progress = Math.round((processedForChunking / totalForChunking) * 100)
    process.stdout.write(
      `\rProgress: ${progress}% (${processedForChunking}/${totalForChunking} files chunked)`
    )

    return textChunks.map((text, index) => ({
      text,
      metadata: {
        ...file.metadata,
        filePath: file.filePath,
        position: index,
      },
    }))
  })
  console.log(
    `\nContent splitting complete! Generated ${allChunks.length} total chunks`
  )

  // Generate embeddings for all chunks
  const chunksWithEmbeddings = await generateEmbeddings(
    allChunks,
    options.openai!,
    20
  )

  console.log("\n=== Content processing complete! ===")
  console.log(`Total files processed: ${allFiles.length}`)
  console.log(`Total chunks generated: ${allChunks.length}`)
  console.log(`Total embeddings created: ${chunksWithEmbeddings.length}`)

  return {
    chunks: chunksWithEmbeddings,
    metadata: {
      totalChunks: chunksWithEmbeddings.length,
      lastUpdated: new Date().toISOString(),
    },
  }
}
