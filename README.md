# docusaurus-plugin-chat-page

A Docusaurus plugin that adds an AI-powered chat interface to your documentation site. Built on top of LangChain, this plugin allows you to use various AI providers (OpenAI, Anthropic, Google, etc.) to power your documentation's chat interface. Users can ask questions about your documentation and receive contextually relevant answers from their preferred AI model.

## Features

- 🤖 AI-powered documentation assistant with multiple provider support (via LangChain)
- 🔄 Model-agnostic architecture supporting OpenAI, Anthropic, Google, and more
- 🔍 Semantic search using embeddings from various providers
- 💨 Fast client-side similarity search
- 🏗️ Build-time content processing
- 🔒 Secure (API keys only used at build time)
- 💅 Beautiful UI that matches your Docusaurus theme
- ⚡ Real-time streaming responses
- 📱 Responsive design

## How It Works

1. **Build Time:**

   - Processes your documentation content
   - Splits content into manageable chunks
   - Generates embeddings using your chosen provider (OpenAI, Google, or Pinecone)
   - Creates a static JSON file with content and embeddings

2. **Runtime:**
   - Performs client-side similarity search to find relevant documentation
   - Uses your configured LLM provider (via LangChain) to generate contextual answers
   - Streams responses in real-time for better UX

## Technical Details

This plugin uses [LangChain](https://js.langchain.com) under the hood to provide a model-agnostic architecture. LangChain's abstractions allow the plugin to:

- Support multiple LLM providers without changing the core logic
- Handle different embedding models consistently
- Provide streaming responses across different providers
- Manage context windows and token limits appropriately for each model
- Ensure consistent API interfaces across providers

## Installation

```bash
npm install docusaurus-plugin-chat-page
# or
yarn add docusaurus-plugin-chat-page
```

## Configuration

Add the plugin to your `docusaurus.config.js`. You can configure it in two ways:

### 1. Simple Configuration (OpenAI only)

For basic usage with OpenAI (backward compatible):

```js
module.exports = {
  // ...
  plugins: [
    [
      "docusaurus-plugin-chat-page",
      {
        path: "chat", // URL path for the chat page
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: "gpt-4o-mini", // optional, defaults to gpt-4o-mini
        },
      },
    ],
  ],
}
```

### 2. Advanced Configuration (Multiple Providers)

For using different providers for chat and embeddings:

```js
const {
  LLMProviderType,
  EmbeddingProviderType,
} = require("docusaurus-plugin-chat-page")

module.exports = {
  // ...
  plugins: [
    [
      "docusaurus-plugin-chat-page",
      {
        path: "chat",
        // Configure the LLM (chat) provider
        llm: {
          provider: LLMProviderType.ANTHROPIC,
          config: {
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: "claude-3-5-haiku-latest", // optional
          },
        },
        // Configure the embeddings provider
        embeddings: {
          provider: EmbeddingProviderType.GOOGLE_GENAI,
          config: {
            apiKey: process.env.GOOGLE_API_KEY,
            model: "text-embedding-004", // optional
          },
        },
      },
    ],
  ],
}
```

### Available Providers

#### LLM Providers (Chat)

- `LLMProviderType.OPENAI` - OpenAI's GPT models (default: `gpt-4-turbo-preview`)
- `LLMProviderType.ANTHROPIC` - Anthropic's Claude models (default: `claude-3-haiku-20240307`)
- `LLMProviderType.GOOGLE_GENAI` - Google's Gemini models (default: `gemini-pro`)
- `LLMProviderType.XAI` - XAI's models (default: `xai-chat-latest`)

#### Embedding Providers

- `EmbeddingProviderType.OPENAI` - OpenAI's embedding models (default: `text-embedding-3-small`)
- `EmbeddingProviderType.GOOGLE_GENAI` - Google's embedding models (default: `embedding-001`)
- `EmbeddingProviderType.PINECONE` - Pinecone's embedding service (default: `text-embedding-ada-002`)

The plugin will automatically:

1. Install the required packages for your chosen providers
2. Use the default models if none are specified
3. Apply optimal chunk sizes and context windows for each provider

### Adding to Navigation

To add the chat page to your site's navigation bar, update the `themeConfig` in your `docusaurus.config.js`:

```js
module.exports = {
  // ...
  themeConfig: {
    navbar: {
      items: [
        // ... your other navbar items
        {
          to: "/chat", // Make sure this matches your plugin's path configuration
          label: "Chat",
          position: "left",
        },
        // ...
      ],
    },
  },
}
```

## Environment Variables

Create a `.env` file in your project root with the API keys for your chosen providers:

```env
# OpenAI (if using OpenAI)
OPENAI_API_KEY=your-openai-key-here

# Anthropic (if using Anthropic)
ANTHROPIC_API_KEY=your-anthropic-key-here

# Google (if using Google)
GOOGLE_API_KEY=your-google-key-here

# XAI (if using XAI)
XAI_API_KEY=your-xai-key-here

# Pinecone (if using Pinecone)
PINECONE_API_KEY=your-pinecone-key-here
PINECONE_ENVIRONMENT=your-environment-here
PINECONE_INDEX=your-index-name-here
```

## Usage

Once installed and configured, the plugin will:

1. Add a chat page to your documentation site at `/chat` (or your configured path)
2. Process your documentation during the build phase
3. Enable users to ask questions about your documentation

Users can:

- Ask questions in natural language
- Get AI-generated answers based on your documentation content
- See source references for the answers
- View conversation history

## Requirements

- Docusaurus v2 or higher
- Node.js 16 or higher
- API key(s) for your chosen provider(s)

## Security

- API keys are only used at build time for generating embeddings
- No sensitive data is exposed to the client
- All API calls are made with appropriate security headers

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

MIT

## Support

If you encounter any issues or have questions, please file an issue on GitHub.
