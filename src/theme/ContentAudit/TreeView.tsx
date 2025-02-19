import React, { useState } from "react"
import type { FileNode, ContentIssue } from "../../types"
import styles from "./styles.module.css"

interface TreeNodeProps {
  node: FileNode
  level?: number
}

function IssuesBadge({ issues }: { issues: ContentIssue[] }) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return (
      <span className={`${styles.issuesBadge} ${styles.success}`}>
        No issues
      </span>
    )
  }

  const hasErrors = issues.some((issue) => issue?.severity === "error")
  const badgeClass = hasErrors ? styles.error : styles.warning

  return (
    <span className={`${styles.issuesBadge} ${badgeClass}`}>
      {issues.length} {issues.length === 1 ? "issue" : "issues"}
    </span>
  )
}

function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Defensive check for node
  if (!node || typeof node !== "object") {
    console.warn("Invalid node provided to TreeNode:", node)
    return null
  }

  // More explicit children check
  const children = node.children || []
  const hasChildren =
    node.type === "directory" && Array.isArray(children) && children.length > 0

  // More explicit issues calculation
  const getNodeIssues = (node: FileNode) => {
    if (node.type === "file" && node.content?.issues) {
      return Array.isArray(node.content.issues) ? node.content.issues : []
    }
    return []
  }

  const totalIssues =
    node.type === "directory"
      ? children.reduce((sum, child) => sum + getNodeIssues(child).length, 0)
      : getNodeIssues(node).length

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className={styles.treeNode}>
      <div className={styles.treeNodeContent} onClick={handleToggle}>
        {hasChildren ? (
          <button className={styles.expandButton} type="button">
            {isExpanded ? "−" : "+"}
          </button>
        ) : (
          <span className={styles.expandButton}>•</span>
        )}

        <span className={styles.fileName}>{node.name || "Unnamed"}</span>

        {node.type === "file" && node.content && (
          <IssuesBadge issues={node.content.issues || []} />
        )}
        {node.type === "directory" && totalIssues > 0 && (
          <span className={`${styles.issuesBadge} ${styles.warning}`}>
            {totalIssues} {totalIssues === 1 ? "issue" : "issues"} total
          </span>
        )}
      </div>

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
