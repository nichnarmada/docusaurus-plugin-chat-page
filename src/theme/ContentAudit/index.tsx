import React from "react"
import Layout from "@theme/Layout"
import type { ReactNode } from "react"
import { usePluginData } from "@docusaurus/useGlobalData"
import type { ContentAuditContent } from "../../types"

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
  const { docs, pages, summary } = usePluginData(
    "docusaurus-plugin-content-audit"
  ) as ContentAuditContent

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
                      {Object.entries(summary.issuesByType).map(
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
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc) => (
                      <tr key={doc.filePath}>
                        <td>{doc.filePath}</td>
                        <td>
                          <IssueCount count={doc.issues.length} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pages */}
            <div>
              <h2>Pages</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => (
                      <tr key={page.filePath}>
                        <td>{page.filePath}</td>
                        <td>
                          <IssueCount count={page.issues.length} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
