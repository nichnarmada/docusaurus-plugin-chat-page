# Security Measures

This document outlines the security measures implemented in the Docusaurus Chat Page plugin to prevent Cross-Site Scripting (XSS) and other security vulnerabilities.

## XSS Protection

### Overview
The plugin implements multiple layers of defense against XSS attacks when rendering markdown content from documentation or AI responses.

### Security Layers

#### 1. DOMPurify Sanitization
- All content is sanitized using DOMPurify before rendering
- Strict configuration with allowlisted tags and attributes only
- Dangerous elements like `<script>`, `<iframe>`, `<object>` are blocked
- Event handlers (onclick, onerror, etc.) are stripped

#### 2. ReactMarkdown Security Configuration
- `skipHtml: true` - Ignores any raw HTML in markdown
- `unwrapDisallowed: true` - Unwraps disallowed elements
- `allowedElements` - Explicit allowlist of safe HTML elements
- No `rehype-raw` or dangerous plugins used

#### 3. Custom Component Security
- **Links**: 
  - Only allow `https://`, `http://`, `mailto:`, and `#` URLs
  - Block `javascript:`, `data:`, and other dangerous schemes
  - Add `rel="noopener noreferrer nofollow"` to external links
  
- **Images**:
  - Only allow HTTPS images and relative paths
  - Block data URIs and other potentially dangerous sources
  - Add lazy loading for performance

#### 4. Content Security Policy (Recommended)
For additional protection, configure CSP headers in your Docusaurus site:

```javascript
// docusaurus.config.js
module.exports = {
  // ...
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:;"
      }
    }
  ]
}
```

## Testing XSS Protection

The following attack vectors are blocked:

```markdown
<!-- Script injection -->
<script>alert('XSS')</script>

<!-- Event handler injection -->
<img src=x onerror="alert('XSS')">
<div onclick="alert('XSS')">Click me</div>

<!-- JavaScript URL -->
[Click me](javascript:alert('XSS'))

<!-- Data URI with script -->
<img src="data:text/html,<script>alert('XSS')</script>">

<!-- SVG with embedded script -->
<svg onload="alert('XSS')"></svg>

<!-- iframe injection -->
<iframe src="javascript:alert('XSS')"></iframe>

<!-- Style injection -->
<style>body { background: url('javascript:alert("XSS")'); }</style>
```

## Regular Security Audits

Run security audits regularly:

```bash
# Check for known vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly instead of creating a public issue. Include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

## Additional Recommendations

1. **Keep Dependencies Updated**: Regularly update DOMPurify, ReactMarkdown, and other dependencies
2. **Monitor Security Advisories**: Watch for security advisories for all dependencies
3. **Test with OWASP ZAP**: Use security testing tools to verify protection
4. **Enable CSP**: Configure Content Security Policy headers
5. **Limit API Permissions**: Ensure OpenAI API key has minimal required permissions

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [ReactMarkdown Security](https://github.com/remarkjs/react-markdown#security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
