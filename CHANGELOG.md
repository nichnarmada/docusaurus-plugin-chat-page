# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-12-16

### Added
- **Development Mode**: New `development.mockData` configuration option that enables development without OpenAI API keys
  - Generate deterministic mock embeddings for documentation chunks
  - Provide mock chat responses for testing UI/UX
  - No API costs during development
  - Clear visual indicators when using mock data
  - Colored console output for better development experience
  - Simplified logging in development mode

### Changed
- API key is now optional when `development.mockData` is enabled
- Improved console output with color coding for different modes
- Enhanced error messages to guide users on configuration options

### Developer Experience
- Frontend developers can now work without backend credentials
- Faster build times in development (no API calls)
- CI/CD friendly - can build without secrets
- Team collaboration improved - no need to share API keys

## [0.1.8] - 2024-12-16

### Changed
- Migrated from Yarn to npm for package management
- Removed outdated documentation files
- Cleaned up repository structure

## [0.1.7] - 2024-12-14

### Fixed
- XSS security vulnerability with DOMPurify integration
- ESM/CommonJS compatibility issues with remark and strip-markdown
- TypeScript compilation errors in SecureMarkdown component

### Security
- Added secure markdown rendering to prevent XSS attacks
- Implemented content sanitization for user inputs

## [0.1.6] - 2024-12-13

### Fixed
- Build issues with incorrect imports
- Module resolution problems

## Previous Versions

For earlier versions, please refer to the git history.