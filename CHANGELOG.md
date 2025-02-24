# Changelog

## [0.1.5] - Unreleased

### Added

- Model-agnostic architecture using LangChain v0.3
- Support for multiple LLM providers:
  - OpenAI (GPT models)
  - Anthropic (Claude models)
  - Google (Gemini models)
  - XAI (Grok models)
- Support for multiple embedding providers:
  - OpenAI embeddings
  - Google embeddings
  - Pinecone
- Automatic provider-specific package installation
- Provider-specific default configurations:
  - Default model selections per provider
  - Appropriate chunk sizes
  - Context window limits
  - Temperature settings
  - Batch sizes for embeddings
  - Task types for Google embeddings

### Changed

- Refactored type system for better maintainability
- Updated configuration structure to support multiple providers
- Maintained backward compatibility with existing OpenAI-only configuration
- Improved error messages with provider-specific configuration examples
- Updated embeddings generation to use provider-specific settings

### Developer Experience

- Added comprehensive provider configuration examples
- Improved type safety and developer autocomplete
- Added detailed documentation for each provider's capabilities
- Streamlined provider-specific package management
- Made provider packages optional peer dependencies

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
