import OpenAI from "openai"
import type { ContentIssue, OpenAIConfig } from "../types"

interface AIValidationContext {
  content: string
  filePath: string
  metadata: Record<string, any>
  openai: OpenAIConfig
}

const DEFAULT_SYSTEM_PROMPT = `You are a technical documentation expert. Analyze the provided documentation content and provide actionable feedback on:
1. Clarity and readability
2. Technical accuracy
3. Audience appropriateness
4. Suggested improvements
5. Key concepts and terminology

Format your response as JSON with the following structure:
{
  "clarity": "brief assessment of clarity with specific suggestions for improvement",
  "technicalAccuracy": "assessment of technical accuracy with specific areas to verify or improve",
  "audienceMatch": "assessment of audience appropriateness with suggestions to better target the audience",
  "improvements": ["list", "of", "specific", "actionable", "improvements"],
  "keywords": ["key", "technical", "terms", "identified"]
}

Be concise but specific in your feedback, focusing on actionable suggestions that will help improve the documentation.`

/**
 * Analyzes content using OpenAI
 */
async function analyzeWithAI(
  context: AIValidationContext
): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = []

  try {
    const model = "o3-mini"
    const openai = new OpenAI({
      apiKey: context.openai.apiKey,
    })

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: DEFAULT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this documentation content:
Title: ${context.metadata.title || "Untitled"}
Content:
${context.content}`,
        },
      ],
      // temperature: context.openai.temperature || 0.3,
      // max_tokens: context.openai.maxTokens || 500,
      response_format: { type: "json_object" },
    })

    if (!response.choices[0]?.message?.content) {
      throw new Error("No response content from OpenAI")
    }

    const analysis = JSON.parse(response.choices[0].message.content)

    // Add clarity/readability issue if needed
    if (analysis.clarity && !analysis.clarity.toLowerCase().includes("clear")) {
      issues.push({
        type: "ai-suggestion",
        message: "Content clarity could be improved",
        severity: "warning",
        details: {
          aiSuggestions: {
            clarity: analysis.clarity,
            improvements: analysis.improvements,
          },
        },
      })
    }

    // Add technical accuracy issue if needed
    if (
      analysis.technicalAccuracy &&
      !analysis.technicalAccuracy.toLowerCase().includes("accurate")
    ) {
      issues.push({
        type: "ai-suggestion",
        message: "Technical accuracy concerns",
        severity: "error",
        details: {
          aiSuggestions: {
            technicalAccuracy: analysis.technicalAccuracy,
            improvements: analysis.improvements.filter(
              (imp) =>
                imp.toLowerCase().includes("technical") ||
                imp.toLowerCase().includes("accuracy")
            ),
          },
        },
      })
    }

    // Add audience match issue if needed
    if (
      analysis.audienceMatch &&
      !analysis.audienceMatch.toLowerCase().includes("appropriate")
    ) {
      issues.push({
        type: "ai-suggestion",
        message: "Content may not match target audience",
        severity: "warning",
        details: {
          aiSuggestions: {
            audienceMatch: analysis.audienceMatch,
            improvements: analysis.improvements.filter(
              (imp) =>
                imp.toLowerCase().includes("audience") ||
                imp.toLowerCase().includes("user")
            ),
          },
        },
      })
    }

    // Always add keywords as info
    if (analysis.keywords && analysis.keywords.length > 0) {
      issues.push({
        type: "ai-suggestion",
        message: "Key technical terms identified",
        severity: "info",
        details: {
          aiSuggestions: {
            keywords: analysis.keywords,
          },
        },
      })
    }
  } catch (error) {
    console.error("Error in analyzeWithAI:", error)
    issues.push({
      type: "ai-suggestion",
      message: "Failed to analyze content with AI",
      severity: "warning",
      details: {
        recommendation: `Check your OpenAI configuration and try again. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
    })
  }

  return issues
}

/**
 * Main AI validation function
 */
export async function validateWithAI(
  content: string,
  filePath: string,
  metadata: Record<string, any>,
  openai: OpenAIConfig
): Promise<ContentIssue[]> {
  if (!openai?.apiKey) {
    return [
      {
        type: "ai-suggestion",
        message: "OpenAI API key not configured",
        severity: "info",
        details: {
          recommendation:
            "Add OpenAI configuration to your docusaurus.config.js to enable AI-powered content analysis.",
        },
      },
    ]
  }

  const context: AIValidationContext = { content, filePath, metadata, openai }
  return analyzeWithAI(context)
}
