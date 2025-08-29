# 🦖 🤖 docusaurus-plugin-chat-page

A Docusaurus plugin that adds an AI-powered chat interface to your documentation site. Users can ask questions about your documentation and receive contextually relevant answers powered by OpenAI's GPT models.

## Features

- 🤖 AI-powered documentation assistant
- 🔍 Semantic search using embeddings
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
   - Generates embeddings using OpenAI's API
   - Creates a static JSON file with content and embeddings

2. **Runtime:**

   - Performs client-side similarity search to find relevant documentation
   - Uses OpenAI's Chat API to generate contextual answers
   - Streams responses in real-time for better UX

## Installation

```bash
npm install docusaurus-plugin-chat-page
# or
yarn add docusaurus-plugin-chat-page
```

## Configuration

Add the plugin to your `docusaurus.config.js`:

```js
module.exports = {
  // ...
  plugins: [
    [
      "docusaurus-plugin-chat-page",
      {
        path: "chat", // URL path for the chat page
        openai: {
          apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API key
        },
      },
    ],
  ],
}
```

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

## Development Mode

To develop and test the chat interface without incurring OpenAI API costs, you can enable development mode:

```js
module.exports = {
  // ...
  plugins: [
    [
      "docusaurus-plugin-chat-page",
      {
        path: "chat",
        development: {
          mockData: true, // Enable mock data for development
        },
      },
    ],
  ],
}
```

### What Development Mode Does

When `mockData: true` is set:

- **No API key required**: The plugin works without an OpenAI API key
- **Mock embeddings**: Generates deterministic fake embeddings for documentation
- **Mock responses**: Returns development-mode responses instead of real AI answers
- **Visual indicator**: Shows a banner indicating development mode is active
- **Cost-free**: No OpenAI API calls are made

### Use Cases

- **Local development**: Test UI/UX without API costs
- **Team collaboration**: Developers can work without sharing API keys
- **CI/CD**: Build and test in pipelines without secrets
- **Demos**: Create screenshots and demos without real API calls

### Important Notes

- Development mode is for testing only - responses are not real AI answers
- A warning banner appears in the UI when mock data is enabled
- Console warnings will indicate when mock services are being used
- Production builds with `mockData: true` will show a warning

## Environment Variables

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your-api-key-here
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
- OpenAI API key (required for production; optional in development mode)

## Security

- OpenAI API key is only used at build time for generating embeddings
- No sensitive data is exposed to the client
- All API calls are made with appropriate security headers

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

MIT

## Support

If you encounter any issues or have questions, please file an issue on GitHub.
