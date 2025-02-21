# docusaurus-plugin-chat-page

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
- OpenAI API key

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
