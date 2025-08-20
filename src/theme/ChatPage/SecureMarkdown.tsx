import React from "react"
import ReactMarkdown from "react-markdown"
import DOMPurify from "dompurify"
import type { Components } from "react-markdown"

interface SecureMarkdownProps {
  children: string
  className?: string
}

// Configure DOMPurify with strict settings
const purifyConfig = {
  ALLOWED_TAGS: [
    // Text content
    "p",
    "span",
    "br",
    "hr",
    // Headings
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    // Lists
    "ul",
    "ol",
    "li",
    // Formatting
    "strong",
    "em",
    "b",
    "i",
    "u",
    "del",
    "mark",
    // Code
    "code",
    "pre",
    "kbd",
    "samp",
    // Quotes
    "blockquote",
    "q",
    // Tables (safe subset)
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    // Safe semantic elements
    "abbr",
    "address",
    "cite",
    "dfn",
    "sub",
    "sup",
  ],
  ALLOWED_ATTR: [
    // Only allow safe attributes
    "class",
    "id",
    "title",
    "lang",
    "dir",
    // Table attributes
    "colspan",
    "rowspan",
    "headers",
    "scope",
    // Accessibility
    "role",
    "aria-label",
    "aria-describedby",
    "aria-hidden",
  ],
  // Disallow all URI schemes except safe ones
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Remove dangerous elements and attributes
  FORBID_TAGS: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
  ],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
    "onblur",
  ],
  // Don't allow data URIs
  ALLOW_DATA_ATTR: false,
}

// Custom components with security in mind
const secureComponents: Components = {
  // Override link component to sanitize URLs
  a: ({ href, children, ...props }) => {
    // Sanitize the URL
    const sanitizedHref = href
      ? DOMPurify.sanitize(href, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          RETURN_DOM: false,
          RETURN_DOM_FRAGMENT: false,
        })
      : undefined

    // Check if URL is safe
    const isSafeUrl =
      sanitizedHref &&
      (sanitizedHref.startsWith("http://") ||
        sanitizedHref.startsWith("https://") ||
        sanitizedHref.startsWith("mailto:") ||
        sanitizedHref.startsWith("#"))

    if (!isSafeUrl) {
      // Render as plain text if URL is not safe
      return <span {...props}>{children}</span>
    }

    return (
      <a
        href={sanitizedHref}
        target="_blank"
        rel="noopener noreferrer nofollow"
        {...props}
      >
        {children}
      </a>
    )
  },

  // Override image component to prevent XSS via src attribute
  img: ({ src, alt, ...props }) => {
    // Only allow HTTPS images
    const isSafeImage =
      src && (src.startsWith("https://") || src.startsWith("/")) // Allow relative paths from same domain

    if (!isSafeImage) {
      // Return a placeholder for unsafe images
      return <span>[Image blocked for security]</span>
    }

    return <img src={src} alt={alt || ""} loading="lazy" {...props} />
  },

  // Disable HTML rendering completely
  html: () => null,
}

/**
 * SecureMarkdown component that safely renders markdown content
 * with XSS protection through DOMPurify and ReactMarkdown configuration
 */
export function SecureMarkdown({ children, className }: SecureMarkdownProps) {
  // Pre-sanitize the content before passing to ReactMarkdown
  const sanitizedContent = DOMPurify.sanitize(children, {
    ...purifyConfig,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  })

  return (
    <div className={className}>
      <ReactMarkdown
        components={secureComponents}
        // Security settings
        allowedElements={purifyConfig.ALLOWED_TAGS}
        unwrapDisallowed={true}
        skipHtml={true} // Skip any HTML in markdown
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  )
}
