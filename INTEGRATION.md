# Integrating the Docusaurus LLM Chat Plugin

This guide explains how to integrate the Docusaurus LLM Chat Plugin into your Docusaurus v2/v3 project. This plugin adds a chat interface that can connect to an OpenAI-compatible Large Language Model (LLM) to answer user questions based on your documentation content.

## 1. Installation

Since this is a local plugin and not yet an npm package, you'll need to manually add the plugin files to your Docusaurus project.

1.  **Create a Plugin Directory (if you don't have one):**
    It's a common practice to place local plugins in a `plugins` directory at the root of your Docusaurus project. If you don't have this directory, create it:
    ```bash
    mkdir plugins
    ```

2.  **Copy Plugin Files:**
    Copy the entire `src` directory of this plugin into a new directory within your `plugins` folder. For example, name it `docusaurus-llm-chat`:
    ```
    my-docusaurus-project/
    ├── plugins/
    │   └── docusaurus-llm-chat/
    │       ├── client.ts
    │       ├── plugin.ts
    │       ├── services/
    │       │   └── LLMService.ts
    │       └── theme/
    │           ├── ChatButton/
    │           │   ├── index.tsx
    │           │   └── styles.module.css
    │           └── ChatWindow/
    │               ├── index.tsx
    │               └── styles.module.css
    ├── docusaurus.config.js
    ├── sidebars.js
    ├── src/
    │   ├── css/
    │   ├── pages/
    │   └── ...
    └── ...
    ```
    **Note:** The exact contents of the plugin's `src` directory might vary slightly, but it will generally contain `plugin.ts`, `client.ts`, and `theme/` and `services/` subdirectories. Ensure you copy the entire structure.

## 2. Configuration (`docusaurus.config.js`)

After placing the plugin files, you need to add it to your Docusaurus configuration file (`docusaurus.config.js` or `docusaurus.config.ts`).

### A. Add Plugin to `plugins` Array

You'll reference the local plugin by its path.

```javascript
// docusaurus.config.js

module.exports = {
  // ... other configurations (title, tagline, favicon, etc.)

  plugins: [
    // ... other plugins
    [
      './plugins/docusaurus-llm-chat/src/plugin', // Path to the plugin.ts file
      {
        // Plugin options are placed here, but we'll put them in themeConfig for easier access by components
      },
    ],
  ],

  themeConfig: {
    // ... other theme configurations (navbar, footer, prism, etc.)

    chatGpt: { // This is where our plugin options will reside
      apiKey: 'YOUR_LLM_API_KEY', // REQUIRED
      llmService: {
        // type: 'openai', // Default: 'openai'. Options: 'openai', 'custom', 'azure_openai'
        endpoint: 'https://api.openai.com/v1/chat/completions', // Default for OpenAI type
        // For 'custom' or 'azure_openai', set the endpoint accordingly.
      },
      model: 'gpt-3.5-turbo', // Optional: LLM model to use
      chatButton: {
        // icon: '/img/custom-chat-icon.svg', // Optional: Path to custom SVG icon for the button
        // label: 'AI Chat', // Optional: Text label next to the icon
        tooltip: 'Chat with our AI Assistant', // Optional: Tooltip for the button
        position: { // Optional: Fine-tune button position
          bottom: '30px',
          right: '30px',
        },
      },
      chatWindow: {
        title: 'AI Documentation Helper', // Optional: Title for the chat window header
        height: '550px', // Optional: Height of the chat window
        width: '420px', // Optional: Width of the chat window
        initialGreeting: "Hello! I'm here to help. Ask me anything about our documentation.", // Optional: First message from assistant
        placeholder: "Type your question here...", // Optional: Placeholder for the text input
      },
      context: {
        behavior: 'currentPage', // 'currentPage' (default), 'docusaurusSearch', 'both', 'none'
        prompt: "You are a helpful assistant for our documentation website. Please answer questions based on the provided context from the current page. If the answer isn't in the context or you are unsure, please say so rather than making up information. Be friendly and concise.", // Optional: System prompt
        maxChars: 6000, // Optional: Max characters of page content to send as context (default: 5000)
      },
      streaming: true, // Optional: Defaults to true. Set to false to disable streaming responses.
      customHeaders: { // Optional: Custom headers for the API request to the LLM
        // 'X-My-Custom-Header': 'custom-value',
        // 'Authorization': 'Bearer YOUR_SPECIFIC_TOKEN_IF_NEEDED_SEPARATELY'
      },
      // rateLimit: { // Optional: Basic client-side rate limiting (Not yet fully implemented)
      //   maxMessages: 10,
      //   perMinutes: 5,
      // },
      logging: { // Optional: Client-side logging preferences for debugging
        level: 'info', // 'debug', 'info', 'warn', 'error', 'none' (Not yet fully implemented)
      }
    },
  },
};
```

### B. Detailed Configuration Options

All plugin options are configured under `themeConfig.chatGpt`.

*   **`apiKey`** (string, **Required**)
    *   Your API key for the LLM service.
    *   Example: `apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

*   **`llmService.type`** (string, Optional)
    *   Specifies the type of LLM service. Currently, primarily supports 'openai' compatible APIs.
    *   Options: `'openai'` (default), `'custom'`, `'azure_openai'` (Azure may require specific headers/parameters not fully abstracted yet).
    *   Example: `type: 'openai'`

*   **`llmService.endpoint`** (string, Optional)
    *   The API endpoint for the LLM service.
    *   Defaults to `'https://api.openai.com/v1/chat/completions'` if `llmService.type` is `'openai'`.
    *   Required if `llmService.type` is `'custom'` or for Azure OpenAI.
    *   Example (for a custom proxy or different OpenAI-compatible API): `endpoint: 'https://my-llm-proxy.example.com/v1/chat/completions'`

*   **`model`** (string, Optional)
    *   The specific LLM model to use.
    *   Defaults to `'gpt-3.5-turbo'`.
    *   Example: `model: 'gpt-4'`

*   **`chatButton.icon`** (string, Optional)
    *   Path to a custom SVG icon for the chat button (e.g., in your `static/img` directory).
    *   If not provided, a default icon is used.
    *   Example: `icon: '/img/my-chat-icon.svg'`

*   **`chatButton.label`** (string, Optional)
    *   A text label to display next to the chat button icon.
    *   Example: `label: 'Help Chat'`

*   **`chatButton.tooltip`** (string, Optional)
    *   Tooltip text that appears when hovering over the chat button.
    *   Example: `tooltip: 'Ask our documentation AI!'`

*   **`chatButton.position`** (object, Optional)
    *   Allows fine-tuning of the chat button's position.
    *   Properties: `bottom`, `right`, `left`, `top` (use CSS string values).
    *   Example: `position: { bottom: '25px', right: '25px' }`

*   **`chatWindow.title`** (string, Optional)
    *   The title displayed in the header of the chat window.
    *   Defaults to `'AI Assistant'`.
    *   Example: `title: 'Doc Helper'`

*   **`chatWindow.height`** (string, Optional)
    *   The height of the chat window (CSS value).
    *   Defaults to `'500px'`.
    *   Example: `height: '600px'`

*   **`chatWindow.width`** (string, Optional)
    *   The width of the chat window (CSS value).
    *   Defaults to `'400px'`.
    *   Example: `width: '350px'`

*   **`chatWindow.initialGreeting`** (string, Optional)
    *   The first message displayed by the assistant when the chat window is opened.
    *   Example: `initialGreeting: "Hi there! How can I assist you with our docs today?"`

*   **`chatWindow.placeholder`** (string, Optional)
    *   Placeholder text for the user input field in the chat window.
    *   Example: `placeholder: "Ask a question..."`

*   **`context.behavior`** (string, Optional)
    *   Determines how context is provided to the LLM:
        *   `'currentPage'`: (Default) The plugin will extract text content from the current Docusaurus page and send it to the LLM along with the user's query.
        *   `'docusaurusSearch'`: (Future Enhancement) Integrate with Docusaurus's built-in search to provide context.
        *   `'both'`: (Future Enhancement) Combine both `currentPage` and `docusaurusSearch` context.
        *   `'none'`: No automatic context will be sent beyond the system prompt and conversation history.
    *   Example: `behavior: 'currentPage'`

*   **`context.prompt`** (string, Optional)
    *   The system prompt that guides the LLM's behavior, persona, and response style. It's prepended to the LLM request.
    *   Example: `prompt: "You are an expert on our product. Answer questions based on the provided page content. Be brief and helpful."`

*   **`context.maxChars`** (number, Optional)
    *   The maximum number of characters to extract from the current page when `context.behavior` is `'currentPage'` or `'both'`.
    *   Defaults to `5000`.
    *   Example: `maxChars: 8000`

*   **`streaming`** (boolean, Optional)
    *   Whether to use streaming for LLM responses. If `true` (default), text appears incrementally. If `false`, the full response is shown after it's generated.
    *   Example: `streaming: true`

*   **`customHeaders`** (object, Optional)
    *   An object containing custom HTTP headers to be sent with the API request to the LLM.
    *   Useful for authentication tokens (if not using the standard `Authorization: Bearer apiKey`), versioning, or other custom needs.
    *   Example: `customHeaders: { 'X-API-Version': '2023-10-01-preview', 'My-Custom-Auth': 'some_token' }`

*   **`logging.level`** (string, Optional, *Not yet fully implemented*)
    *   Client-side logging level for debugging the plugin in the browser console.
    *   Options: `'debug'`, `'info'`, `'warn'`, `'error'`, `'none'`.
    *   Example: `level: 'debug'`

## 3. Usage

Once the plugin is installed and configured:

1.  **Start your Docusaurus development server:**
    ```bash
    npm run start
    # or
    yarn start
    ```
2.  **Open your site in a browser.**
3.  The chat button (with your configured icon/label or the default) will appear in the configured position (usually bottom-right).
4.  Click the button to open the chat window.
5.  Interact with the AI assistant by typing messages and sending them. The assistant will use the configured LLM and context strategy to respond.

## 4. Swizzling (Advanced Customization)

Docusaurus provides a feature called "Swizzling" that allows you to replace a theme component with your own implementation for deep customization.

The following components from this plugin can be swizzled:

*   `ChatButton`: The floating button that opens the chat window.
*   `ChatWindow`: The main chat interface, including the header, message list, and input area.

To swizzle a component:

1.  **Eject the component:**
    ```bash
    # For Yarn users
    yarn swizzle docusaurus-chatgpt-plugin ChatButton --danger
    yarn swizzle docusaurus-chatgpt-plugin ChatWindow --danger

    # For npm users
    npm run swizzle docusaurus-chatgpt-plugin ChatButton -- --danger
    npm run swizzle docusaurus-chatgpt-plugin ChatWindow -- --danger
    ```
    (The plugin name `docusaurus-chatgpt-plugin` is based on the `name` field in `plugin.ts`. If you changed it, use your custom name.)
    The `--danger` flag is used because you are copying unversioned code.

2.  This will copy the component (e.g., `ChatButton/index.tsx` and `ChatButton/styles.module.css`) into your site's `src/theme/` directory (e.g., `src/theme/ChatButton/`).

3.  Modify the copied files in `src/theme/` as needed. These local versions will now override the plugin's default components.

Refer to the official [Docusaurus Swizzling Documentation](https://docusaurus.io/docs/swizzling) for more details on how swizzling works.

---

This completes the integration of the Docusaurus LLM Chat Plugin. Ensure your API key and endpoint are correctly configured for the LLM service to function.
