# Changelog

## [0.1.7] - 2024-12-13

### Fixed

- Fixed ESM/CommonJS compatibility issue with `remark` and `strip-markdown` packages
- Resolved `Error [ERR_REQUIRE_ESM]` when using the plugin with ESM-only dependencies
- Changed static imports to dynamic imports using Function constructor to prevent TypeScript transformation
- Ensures compatibility with both older and newer versions of remark ecosystem packages

## [0.1.4] - 2024-03-22

### Security

- Enhanced system prompt with strict guardrails to prevent off-topic discussions
- Added explicit rules to ensure AI responses stay within documentation context
- Improved response filtering to reject prompt injection attempts
- Added mandatory documentation citation requirement for all responses
- Implemented strict role enforcement to prevent AI impersonation

## [0.1.3] - 2024-03-22

### Added

- Added persistent chat storage using localStorage
- Multiple chat instances now persist across page refreshes
- Chat history and active chat selection are preserved
- Added error handling for storage operations
- Improved state initialization to handle SSR correctly
- Added chat grouping by date (Today, Yesterday, Month/Year)
- Added timestamps (createdAt, updatedAt) to chat instances
- Chats are now sorted by most recent activity
- Improved chat deletion UX with always-visible delete buttons

### Changed

- Updated chat list UI with date-based grouping headers
- Modified delete button visibility for better discoverability
- Improved TypeScript type declarations for CSS modules

## [0.1.2] - 2024-03-21

### Added

- Added markdown rendering support for chat messages using react-markdown
- Added comprehensive styling for markdown elements in chat messages:
  - Proper formatting for headings, paragraphs, and lists
  - Code blocks and inline code with syntax highlighting
  - Blockquotes with theme-aware styling
  - Links and emphasis (bold/italic) text
  - Theme-aware colors and spacing

## [0.1.1] - 2024-03-21

### Performance Improvements

- Reduced memory usage during build time to prevent Out of Memory (OOM) errors
- Increased default chunk size from 1000 to 1500 characters
- Limited maximum chunks per file to 10
- Reduced embedding batch size from 20 to 10
- Implemented sequential file processing instead of parallel processing
- Added memory usage tracking in progress logs
- Added garbage collection optimizations

## [0.1.0] - Initial Release

### Added

- Initial release of the Docusaurus Chat Page plugin
- AI-powered chat interface for documentation
- OpenAI integration for embeddings and chat
- Build-time content processing
- Client-side similarity search
