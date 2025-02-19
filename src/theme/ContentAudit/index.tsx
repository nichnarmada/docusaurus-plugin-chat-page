import React from "react"
import Layout from "@theme/Layout"
import type { ReactNode } from "react"
import { usePluginData } from "@docusaurus/useGlobalData"
import type { ContentTree, FileNode } from "../../types"
import { TreeView } from "./TreeView"
import "./styles.module.css"

function IssueCount({ count }: { count: number }) {
  if (count === 0) {
    return <span className="badge badge--success">No issues</span>
  }
  return <span className="badge badge--warning">{count} issues</span>
}

function SummaryCard({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <div className="card margin-bottom--md">
      <div className="card__header">
        <h3>{title}</h3>
      </div>
      <div className="card__body">
        <p className="margin-bottom--none">{value}</p>
      </div>
    </div>
  )
}

export default function ContentAudit(): ReactNode {
  const pluginData = usePluginData("docusaurus-plugin-content-audit") as {
    tree: ContentTree
    summary: {
      totalFiles: number
      totalIssues: number
      issuesByType: Record<string, number>
    }
  }

  // Defensive check for data
  if (!pluginData || typeof pluginData !== "object") {
    return (
      <Layout title="Content Audit" description="Content Audit Dashboard">
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <h1>Content Audit Dashboard</h1>
              <div className="alert alert--warning">
                No content data available.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const {
    tree: { docs = [], pages = [] },
    summary = { totalFiles: 0, totalIssues: 0, issuesByType: {} },
  } = pluginData

  return (
    <Layout title="Content Audit" description="Content Audit Dashboard">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>Content Audit Dashboard</h1>

            {/* Summary Section */}
            <div className="row margin-bottom--lg">
              <div className="col col--4">
                <SummaryCard title="Total Files" value={summary.totalFiles} />
              </div>
              <div className="col col--4">
                <SummaryCard title="Total Issues" value={summary.totalIssues} />
              </div>
              <div className="col col--4">
                <div className="card">
                  <div className="card__header">
                    <h3>Issues by Type</h3>
                  </div>
                  <div className="card__body">
                    <ul className="clean-list">
                      {Object.entries(summary.issuesByType || {}).map(
                        ([type, count]) => (
                          <li key={type} className="margin-bottom--sm">
                            {type}: {count}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation Files */}
            <div className="margin-bottom--xl">
              <h2>Documentation Files</h2>
              {Array.isArray(docs) && docs.length > 0 ? (
                <TreeView nodes={docs} />
              ) : (
                <div className="alert alert--info">
                  No documentation files found.
                </div>
              )}
            </div>

            {/* Pages */}
            <div>
              <h2>Pages</h2>
              {Array.isArray(pages) && pages.length > 0 ? (
                <TreeView nodes={pages} />
              ) : (
                <div className="alert alert--info">No pages found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
