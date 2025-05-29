// src/services/LLMService.ts

interface MessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LLMServiceConfig {
  apiKey: string;
  endpoint?: string; // Defaults to OpenAI
  model?: string; // Defaults to gpt-3.5-turbo
  streaming?: boolean;
  customHeaders?: Record<string, string>;
  systemPrompt?: string; // Predefined system prompt
  contextBehavior?: 'currentPage' | 'docusaurusSearch' | 'both' | 'none';
  maxContextChars?: number;
}

const DEFAULT_OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-3.5-turbo';

export default class LLMService {
  private config: LLMServiceConfig;
  public isStreaming: boolean;

  constructor(config: LLMServiceConfig) {
    if (!config.apiKey) {
      throw new Error('LLMService: API key is required.');
    }
    this.config = {
      ...config,
      endpoint: config.endpoint || DEFAULT_OPENAI_ENDPOINT,
      model: config.model || DEFAULT_MODEL,
      streaming: config.streaming !== undefined ? config.streaming : true,
      maxContextChars: config.maxContextChars || 5000,
    };
    this.isStreaming = this.config.streaming!;
  }

  private getCurrentPageContent(): string {
    if (typeof window === 'undefined' || this.config.contextBehavior === 'none') {
        return '';
    }
    // Try to find the main content area of a Docusaurus page
    // These selectors might need to be adjusted based on theme structure
    const selectors = [
        'article[itemtype="http://schema.org/Article"]', // Common for Docusaurus blog posts
        'main[role="main"]', // Common for Docusaurus pages
        '.markdown', // Common class for rendered markdown
        'article', // Generic article
        'main', // Generic main
    ];
    let mainContentElement: HTMLElement | null = null;
    for (const selector of selectors) {
        mainContentElement = document.querySelector(selector);
        if (mainContentElement) break;
    }

    if (mainContentElement) {
        let text = mainContentElement.innerText || mainContentElement.textContent || '';
        text = text.replace(/\s\s+/g, ' ').trim(); // Clean up whitespace
        return text.substring(0, this.config.maxContextChars);
    }
    console.warn('LLMService: Could not find main content element to extract context.');
    return '';
  }

  private async buildPayload(conversationHistory: Array<{ text: string; sender: 'user' | 'assistant' }>): Promise<object> {
    const messages: MessagePayload[] = [];

    // Add system prompt if configured
    if (this.config.systemPrompt) {
      messages.push({ role: 'system', content: this.config.systemPrompt });
    }

    // Add page context if behavior is 'currentPage' or 'both'
    if (this.config.contextBehavior === 'currentPage' || this.config.contextBehavior === 'both') {
        const pageContent = this.getCurrentPageContent();
        if (pageContent) {
            // Add it as a system message or a specific user message before the main history
            messages.push({ role: 'system', content: `Context from the current page:\n${pageContent}` });
        }
    }
    // TODO: Add 'docusaurusSearch' or 'both' behavior integration here in the future

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({ role: msg.sender, content: msg.text });
    });

    return {
      model: this.config.model,
      messages: messages,
      stream: this.isStreaming,
    };
  }

  // For non-streaming responses
  public async sendMessage(
    conversationHistory: Array<{ text: string; sender: 'user' | 'assistant' }>
  ): Promise<string> {
    if (this.isStreaming) {
        console.warn("LLMService: sendMessage called, but service is configured for streaming. Use sendMessageStream instead or set streaming to false in config.");
        // Fallback or throw error - for now, we'll try to make a non-streaming call if possible
    }

    const payload = await this.buildPayload(conversationHistory);
    (payload as any).stream = false; // Ensure stream is false for this method

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...this.config.customHeaders,
    };

    try {
      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`LLMService API Error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorBody}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LLMService Network/Request Error:', error);
      throw error; // Re-throw for the caller to handle
    }
  }


  // For streaming responses
  public async sendMessageStream(
    conversationHistory: Array<{ text: string; sender: 'user' | 'assistant' }>,
    onChunk: (chunk: string) => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.isStreaming) {
        onError(new Error("LLMService: sendMessageStream called, but service is configured for non-streaming. Use sendMessage instead or set streaming to true in config."));
        return;
    }
    const payload = await this.buildPayload(conversationHistory);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Accept': 'text/event-stream', // Important for SSE
      ...this.config.customHeaders,
    };

    try {
      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`LLMService API Error (Streaming): ${response.status} ${response.statusText}`, errorBody);
        onError(new Error(`API request failed: ${response.status} ${response.statusText}. ${errorBody}`));
        return;
      }

      if (!response.body) {
        onError(new Error('Response body is null'));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.length > 0) { // Process any remaining data in buffer
            // This case might not be strictly necessary for well-formed SSE but good for robustness
            console.warn("LLMService: Stream ended with unprocessed buffer content:", buffer);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process Server-Sent Events (SSE)
        // SSE are typically formatted as:
        // data: {"id":"...","object":"chat.completion.chunk","created":...,"model":"...","choices":[{"delta":{"content":"..."}}]}
        //
        // data: [DONE] (for OpenAI)
        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n\n')) !== -1) {
            const line = buffer.substring(0, eolIndex).trim();
            buffer = buffer.substring(eolIndex + 2);

            if (line.startsWith('data: ')) {
                const dataContent = line.substring(6);
                if (dataContent === '[DONE]') {
                    // Stream finished
                } else {
                    try {
                        const parsed = JSON.parse(dataContent);
                        const chunkText = parsed.choices?.[0]?.delta?.content;
                        if (chunkText) {
                            onChunk(chunkText);
                        }
                    } catch (e) {
                        console.error('LLMService: Error parsing stream data chunk:', e, "Chunk:", dataContent);
                        // onError(new Error('Error parsing stream data.')); // Decide if this is fatal
                    }
                }
            }
        }
      }
      onEnd();
    } catch (error) {
      console.error('LLMService Network/Request Error (Streaming):', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
