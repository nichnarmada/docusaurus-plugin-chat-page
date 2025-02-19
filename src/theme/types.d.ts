declare module "@theme/Layout" {
  import type { ReactNode } from "react"

  export interface Props {
    children: ReactNode
    title?: string
    description?: string
  }

  export default function Layout(props: Props): JSX.Element
}

declare module "@docusaurus/useGlobalData" {
  export function usePluginData<T = unknown>(pluginName: string): T
}

declare module "@docusaurus/useIsBrowser" {
  export default function useIsBrowser(): boolean
}

declare module "@docusaurus/types" {
  export interface Plugin<T = unknown> {
    name: string
    loadContent?(): Promise<T>
    contentLoaded?({ content, actions }: { content: T; actions: any }): void
    getPathsToWatch?(): string[]
    getThemePath?(): string
    getTypeScriptThemePath?(): string
    configureWebpack?(
      config: any,
      isServer: boolean,
      utils: any,
      content: T
    ): any
    postBuild?(props: any): void
    postStart?(props: any): void
    injectHtmlTags?(): {
      headTags?: any[]
      preBodyTags?: any[]
      postBodyTags?: any[]
    }
    getClientModules?(): string[]
  }

  export interface LoadContext {
    siteDir: string
    generatedFilesDir: string
    siteConfig: any
    outDir: string
    baseUrl: string
  }
}
