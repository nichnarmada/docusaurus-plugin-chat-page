// Store callbacks
const reloadCallbacks: (() => void)[] = []

// Register callback
export function registerReloadCallback(callback: () => void): () => void {
  reloadCallbacks.push(callback)
  return () => {
    const index = reloadCallbacks.indexOf(callback)
    if (index > -1) {
      reloadCallbacks.splice(index, 1)
    }
  }
}

// Notify all callbacks
export function notifyContentUpdate(): void {
  reloadCallbacks.forEach((callback) => callback())
}

// Add to window.docusaurus
if (typeof window !== "undefined") {
  // @ts-ignore
  window.docusaurus = window.docusaurus || {}
  // @ts-ignore
  window.docusaurus.registerReloadCallback = registerReloadCallback
}
