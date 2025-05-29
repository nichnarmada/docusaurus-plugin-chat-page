# Testing and Verifying the Docusaurus LLM Chat Plugin

This document outlines basic manual testing and verification steps to help you check if the Docusaurus LLM Chat Plugin is functioning as expected after installation and configuration.

## Prerequisites

*   The plugin has been installed as per `INTEGRATION.md`.
*   Your Docusaurus site is running (e.g., `npm run start` or `yarn start`).
*   You have configured the plugin with a valid API key and LLM endpoint.
*   Familiarity with your browser's Developer Tools (especially the Network tab) is helpful for some steps.

## Testing Steps

### 1. Verify Chat Button Appearance

*   **Action:** Open your Docusaurus site in a browser.
*   **Expected Result:**
    *   The chat button should appear on the page.
    *   **Position:** It should be in the position configured in `docusaurus.config.js` under `themeConfig.chatGpt.chatButton.position` (default is bottom-right).
    *   **Icon:** If you specified a custom `chatButton.icon`, that icon should be displayed. Otherwise, the default icon appears.
    *   **Label:** If you specified a `chatButton.label`, it should appear next to the icon.
    *   **Tooltip:** Hover over the button. The tooltip text from `chatButton.tooltip` (or the default) should appear.

### 2. Open Chat Window

*   **Action:** Click the chat button.
*   **Expected Result:**
    *   The chat window should open.
    *   **Title:** The title in the chat window header should match `chatWindow.title` from your configuration (default is "AI Assistant").
    *   **Initial Greeting:** If `chatWindow.initialGreeting` is configured, that message should be the first message displayed from the "assistant". If not configured, the message area might be empty or show a system-generated first message if the LLM service does that.
    *   **Placeholder:** The text input field should show the placeholder text from `chatWindow.placeholder` (default is "Type your message...").

### 3. Basic Interaction ("Hello")

*   **Action:**
    1.  Type a simple message like "Hello" or "Hi" into the input field.
    2.  Press Enter or click the Send button.
*   **Expected Result:**
    *   Your message ("Hello") should appear in the chat history, marked as "user".
    *   A response from the "assistant" should appear. This could be a simple greeting from the LLM (e.g., "Hello! How can I help you today?") or an echo, depending on your LLM's default behavior.
    *   The input field should clear after sending.

### 4. Check Streaming Response (If Enabled and Supported)

*   **Action:**
    1.  Ensure `streaming: true` (default) is in your plugin configuration.
    2.  Type a question that is likely to generate a longer response (e.g., "Can you explain [a complex topic from your documentation] in detail?").
    3.  Send the message.
*   **Expected Result:**
    *   The assistant's response should appear incrementally, word by word or phrase by phrase, rather than all at once after a delay.

### 5. Test Custom Headers (Requires Developer Tools)

*   **Action:**
    1.  Ensure you have `customHeaders` configured in `docusaurus.config.js` under `themeConfig.chatGpt.customHeaders`.
    2.  Open your browser's Developer Tools (usually by pressing F12).
    3.  Go to the "Network" tab. You might want to filter for "Fetch/XHR" requests.
    4.  In the chat window, send any message to trigger an API call to your LLM.
    5.  Find the request made to your LLM endpoint (e.g., `https://api.openai.com/v1/chat/completions` or your custom endpoint) in the Network tab.
    6.  Click on this request to view its details.
    7.  Examine the "Request Headers" section.
*   **Expected Result:**
    *   The custom headers you configured (e.g., `X-My-Custom-Header: custom-value`) should be present in the list of request headers being sent to the LLM.
    *   Standard headers like `Authorization: Bearer YOUR_API_KEY` and `Content-Type: application/json` should also be present.

### 6. Test Current Page Context (`context.behavior: 'currentPage'`)

*   **Action:**
    1.  Ensure `context.behavior` is set to `'currentPage'` (or `'both'`, though `'both'` implies search which is a future enhancement) in your plugin configuration.
    2.  Navigate to a specific documentation page that has a good amount of text content.
    3.  In the chat window, ask a question whose answer can *only* be found in the content of that specific page.
        *   Good example: "What are the main installation steps described on this page?" or "Summarize the 'Prerequisites' section of this current page."
        *   Bad example (too generic): "What is Docusaurus?" (unless the page is specifically about that).
*   **Expected Result:**
    *   The LLM's response should accurately answer your question using information drawn directly from the content of the current page.
    *   If the LLM cannot find the answer on the page, it should ideally indicate that, as per your system prompt's instructions (e.g., "I couldn't find that specific information on this page.").

### 7. Test System Prompt Influence

*   **Action:**
    1.  Review the `context.prompt` (system prompt) you have configured.
    2.  Try to interact with the chat assistant in a way that would elicit behavior defined by this prompt.
        *   If your prompt asks it to adopt a specific persona (e.g., "You are a friendly pirate assistant"), see if its language reflects that persona.
        *   If your prompt instructs it to always ask clarifying questions, see if it does so.
        *   If your prompt sets a specific tone (e.g., "Be very formal"), check if the responses match that tone.
*   **Expected Result:**
    *   The LLM's responses should generally align with the instructions and characteristics defined in the system prompt. This can be subtle and depends heavily on the LLM's capabilities and the clarity of your prompt.

### 8. Error Handling

*   **Action (API Key Error):**
    1.  In `docusaurus.config.js`, temporarily change `themeConfig.chatGpt.apiKey` to an invalid value (e.g., "INVALID_KEY").
    2.  Stop and restart your Docusaurus development server (`npm run start`).
    3.  Open the chat window and try to send a message.
*   **Expected Result (API Key Error):**
    *   A user-friendly error message should appear in the chat window (e.g., "Sorry, I couldn't connect to the assistant." or a message indicating an authentication error, depending on what the LLM API returns and how `LLMService` handles it). The exact message might vary.
*   **Action (Endpoint Error - if applicable):**
    1.  If you are using a custom `llmService.endpoint`, temporarily change it to a non-existent or incorrect URL.
    2.  Restart the Docusaurus server.
    3.  Open the chat window and try to send a message.
*   **Expected Result (Endpoint Error):**
    *   A user-friendly error message should appear, indicating a connection or network problem.

### 9. Configuration Changes

*   **Action:**
    1.  In `docusaurus.config.js`, make a noticeable but simple change to a configuration option. For example, change `themeConfig.chatGpt.chatWindow.title` to "My Test Chat Title".
    2.  Stop and restart your Docusaurus development server.
    3.  Clear your browser cache (or use a hard refresh) if necessary.
    4.  Open your Docusaurus site and click the chat button.
*   **Expected Result:**
    *   The change you made should be reflected. In the example above, the chat window's title should now be "My Test Chat Title".

---

These steps should help you confirm that the Docusaurus LLM Chat Plugin is integrated correctly and functioning as intended. If you encounter issues, double-check your configuration against `INTEGRATION.md` and look for any error messages in the browser's developer console.
