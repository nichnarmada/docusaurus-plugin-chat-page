import { PluginOptions, LLMProviderType, EmbeddingProviderType } from "../types"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs/promises"
import * as path from "path"

const execAsync = promisify(exec)

/**
 * Get the list of required packages based on the plugin configuration
 */
export function getRequiredPackages(options: PluginOptions): Set<string> {
  const packages = new Set<string>()

  // Handle backward compatibility with openai config
  if (options.openai) {
    packages.add(LLMProviderType.OPENAI)
  }

  // Add LLM provider package
  if (options.llm) {
    packages.add(options.llm.provider)
  }

  // Add embeddings provider package
  if (options.embeddings) {
    packages.add(options.embeddings.provider)
  }

  return packages
}

/**
 * Check if a package is installed in the project
 */
async function isPackageInstalled(packageName: string): Promise<boolean> {
  try {
    // Try to require the package
    require.resolve(packageName)
    return true
  } catch {
    return false
  }
}

/**
 * Install missing packages using npm or yarn
 */
export async function installMissingPackages(
  options: PluginOptions
): Promise<void> {
  const requiredPackages = getRequiredPackages(options)
  const missingPackages: string[] = []

  // Check which packages are missing
  for (const pkg of requiredPackages) {
    if (!(await isPackageInstalled(pkg))) {
      missingPackages.push(pkg)
    }
  }

  if (missingPackages.length === 0) {
    return
  }

  // Determine package manager (npm or yarn) by checking for yarn.lock
  const hasYarnLock = await fs
    .access("yarn.lock")
    .then(() => true)
    .catch(() => false)

  const packageManager = hasYarnLock ? "yarn" : "npm"
  const installCommand = hasYarnLock ? "add" : "install"

  console.log(`Installing required packages: ${missingPackages.join(", ")}`)

  try {
    await execAsync(
      `${packageManager} ${installCommand} ${missingPackages.join(" ")} --save`
    )
    console.log("Successfully installed required packages")
  } catch (error) {
    console.error("Failed to install required packages:", error)
    throw new Error(
      `Failed to install required packages. Please install them manually: ${missingPackages.join(
        ", "
      )}`
    )
  }
}

/**
 * Validate that all required packages are available
 */
export async function validatePackages(options: PluginOptions): Promise<void> {
  const requiredPackages = getRequiredPackages(options)
  const missingPackages: string[] = []

  for (const pkg of requiredPackages) {
    if (!(await isPackageInstalled(pkg))) {
      missingPackages.push(pkg)
    }
  }

  if (missingPackages.length > 0) {
    throw new Error(
      `Missing required packages. Please install: ${missingPackages.join(", ")}`
    )
  }
}
