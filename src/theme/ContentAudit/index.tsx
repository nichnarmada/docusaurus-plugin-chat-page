import React from "react"
import Layout from "@theme/Layout"
import type { ReactNode } from "react"

export default function ContentAudit(): ReactNode {
  return (
    <Layout title="Content Audit" description="Content Audit Dashboard">
      <div className="container margin-vert--lg">
        <h1>Hello from Content Audit Plugin!</h1>
        <p>The plugin is working!</p>
      </div>
    </Layout>
  )
}
