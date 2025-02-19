import React, { useState } from "react"
import type { FileNode, ContentIssue } from "../../types"
import styles from "./styles.module.css"

interface TreeNodeProps {
  node: FileNode
  level?: number
}

function IssueSeverityIcon({
  severity,
}: {
  severity: ContentIssue["severity"]
}) {
  switch (severity) {
    case "error":
      return <span className={styles.errorIcon}>●</span>
    case "warning":
      return <span className={styles.warningIcon}>●</span>
    case "info":
      return <span className={styles.infoIcon}>●</span>
    default:
      return null
  }
}

function IssueDetails({ issue }: { issue: ContentIssue }) {
  return (
    <div className={styles.issueDetail}>
      <IssueSeverityIcon severity={issue.severity} />
      <div className={styles.issueContent}>
        <div className={styles.issueHeader}>
          <span className={styles.issueMessage}>{issue.message}</span>
        </div>

        {/* AI Suggestions */}
        {issue.type === "ai-suggestion" && issue.details?.aiSuggestions && (
          <div className={styles.aiSuggestions}>
            {issue.details.aiSuggestions.clarity && (
              <div className={styles.aiSuggestion}>
                <strong>Clarity:</strong> {issue.details.aiSuggestions.clarity}
              </div>
            )}
            {issue.details.aiSuggestions.technicalAccuracy && (
              <div className={styles.aiSuggestion}>
                <strong>Technical Accuracy:</strong>{" "}
                {issue.details.aiSuggestions.technicalAccuracy}
              </div>
            )}
            {issue.details.aiSuggestions.audienceMatch && (
              <div className={styles.aiSuggestion}>
                <strong>Audience Match:</strong>{" "}
                {issue.details.aiSuggestions.audienceMatch}
              </div>
            )}
            {issue.details.aiSuggestions.improvements && (
              <div className={styles.aiSuggestion}>
                <strong>Suggested Improvements:</strong>
                <ul className={styles.aiList}>
                  {issue.details.aiSuggestions.improvements.map(
                    (improvement, i) => (
                      <li key={i}>{improvement}</li>
                    )
                  )}
                </ul>
              </div>
            )}
            {issue.details.aiSuggestions.keywords && (
              <div className={styles.aiSuggestion}>
                <strong>Key Terms:</strong>
                <div className={styles.keywordList}>
                  {issue.details.aiSuggestions.keywords.map((keyword, i) => (
                    <span key={i} className={styles.keyword}>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular Issue Details */}
        {issue.details?.recommendation && !issue.details.aiSuggestions && (
          <div className={styles.issueRecommendation}>
            {issue.details.recommendation}
          </div>
        )}
      </div>
    </div>
  )
}

function IssuesBadge({
  issues,
  isLoading,
}: {
  issues: ContentIssue[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <span className={`${styles.issuesBadge} ${styles.loading}`}>
        <span className={styles.loadingSpinner}></span>
        Analyzing...
      </span>
    )
  }

  const severity =
    issues.length > 0
      ? issues.some((i) => i.severity === "error")
        ? "error"
        : issues.some((i) => i.severity === "warning")
        ? "warning"
        : "info"
      : "success"

  return (
    <span className={`${styles.issuesBadge} ${styles[severity]}`}>
      {issues.length === 0
        ? "No issues"
        : `${issues.length} ${issues.length === 1 ? "issue" : "issues"}`}
    </span>
  )
}

function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showIssues, setShowIssues] = useState(false)

  // Defensive check for node
  if (!node || typeof node !== "object") {
    console.warn("Invalid node provided to TreeNode:", node)
    return null
  }

  const children = node.children || []
  const hasChildren =
    node.type === "directory" && Array.isArray(children) && children.length > 0

  const getNodeIssues = (node: FileNode) => {
    if (node.type === "file" && node.content?.issues) {
      return Array.isArray(node.content.issues) ? node.content.issues : []
    }
    return []
  }

  // Calculate total issues for a directory and its descendants using the same logic as content.ts
  const calculateTotalIssues = (node: FileNode): number => {
    if (node.type === "file") {
      return getNodeIssues(node).length
    }

    if (node.type === "directory" && node.children) {
      let totalIssues = 0

      // First count issues from immediate files
      node.children.forEach((child) => {
        if (child.type === "file") {
          totalIssues += getNodeIssues(child).length
        }
      })

      // Then aggregate issues from child directories
      node.children.forEach((child) => {
        if (child.type === "directory") {
          totalIssues += calculateTotalIssues(child)
        }
      })

      return totalIssues
    }

    return 0
  }

  const issues = getNodeIssues(node)
  const totalIssues =
    node.type === "directory" ? calculateTotalIssues(node) : issues.length

  const handleClick = (e: React.MouseEvent) => {
    if (node.type === "directory" && hasChildren) {
      setIsExpanded(!isExpanded)
    } else if (node.type === "file") {
      setShowIssues(!showIssues)
    }
  }

  return (
    <div className={styles.treeNode}>
      <div
        className={`${styles.treeNodeContent} ${
          node.type === "file" ? styles.fileRow : ""
        }`}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            className={styles.expandButton}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? "−" : "+"}
          </button>
        ) : (
          <span className={styles.expandButton}>•</span>
        )}

        <span className={styles.fileName}>{node.name || "Unnamed"}</span>

        {node.type === "file" && (
          <div className={styles.issuesSection}>
            <IssuesBadge issues={issues} isLoading={node.isLoading} />
            {!node.isLoading && issues.length > 0 && (
              <button
                className={styles.issuesExpandButton}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowIssues(!showIssues)
                }}
              >
                {showIssues ? "−" : "+"}
              </button>
            )}
          </div>
        )}
        {node.type === "directory" && totalIssues > 0 && (
          <span className={`${styles.issuesBadge} ${styles.warning}`}>
            {totalIssues} {totalIssues === 1 ? "issue" : "issues"} total
          </span>
        )}
      </div>

      {node.type === "file" && showIssues && issues.length > 0 && (
        <div className={styles.issuesPanel}>
          {issues.map((issue, index) => (
            <IssueDetails key={index} issue={issue} />
          ))}
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className={styles.treeChildren}>
          {children.filter(Boolean).map((child) => (
            <TreeNode
              key={child.path || Math.random()}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({ nodes }: { nodes: FileNode[] }) {
  if (!nodes || !Array.isArray(nodes)) {
    console.warn("Invalid nodes provided to TreeView:", nodes)
    return null
  }

  const validNodes = nodes.filter(Boolean)

  if (!validNodes || validNodes.length === 0) {
    return null
  }

  return (
    <div className={styles.treeContainer}>
      {validNodes.map((node) => (
        <TreeNode key={node.path || Math.random()} node={node} />
      ))}
    </div>
  )
}
