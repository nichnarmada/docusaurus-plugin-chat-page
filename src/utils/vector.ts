/**
 * Calculate the cosine similarity between two vectors
 * @param vec1 First vector
 * @param vec2 Second vector
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length")
  }

  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0))
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0))

  return dotProduct / (mag1 * mag2)
}
