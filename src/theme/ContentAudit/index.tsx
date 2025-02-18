import React from "react"
import Layout from "@theme/Layout"
import type { ReactElement } from "react"

interface Props {
  content: {
    docs: {
      filePath: string
      content: string
      metadata: any
    }[]
    pages: {
      filePath: string
      content: string
      metadata: any
    }[]
  }
}

export default function ContentAudit({ content }: Props): ReactElement {
  return (
    <Layout title="Content Audit Dashboard">
      <div
        style={{
          padding: "2rem",
        }}
      >
        <h1>Content Audit Dashboard</h1>
        <div>
          <h2>Documentation Files</h2>
          <ul>
            {content.docs.map((doc, idx) => (
              <li key={idx}>
                <strong>{doc.filePath}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Pages</h2>
          <ul>
            {content.pages.map((page, idx) => (
              <li key={idx}>
                <strong>{page.filePath}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  )
}
