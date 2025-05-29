// src/theme/ChatWindow/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { useThemeConfig } from '@docusaurus/theme-common';
import LLMService from '../../services/LLMService'; // Will be created later

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatWindowConfig {
  title?: string;
  height?: string;
  width?: string;
  initialGreeting?: string;
  placeholder?: string;
}

interface LLMConfig {
    apiKey: string;
    llmService?: {
        type?: 'openai' | 'custom' | 'azure_openai';
        endpoint?: string;
    };
    model?: string;
    streaming?: boolean;
    customHeaders?: Record<string, string>;
    context?: {
        behavior?: 'currentPage' | 'docusaurusSearch' | 'both' | 'none';
        prompt?: string;
        maxChars?: number;
    };
}


const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export default function ChatWindow({ isOpen, onClose }: ChatWindowProps): JSX.Element | null {
  const { chatGpt } = useThemeConfig();
  const windowConfig = chatGpt?.chatWindow as ChatWindowConfig || {};
  const llmConfig = chatGpt as LLMConfig; // Asserting the top-level chatGpt is LLMConfig

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [llmService, setLlmService] = useState<LLMService | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (llmConfig?.apiKey) {
        const service = new LLMService({
            apiKey: llmConfig.apiKey,
            endpoint: llmConfig.llmService?.endpoint,
            model: llmConfig.model,
            streaming: llmConfig.streaming !== undefined ? llmConfig.streaming : true,
            customHeaders: llmConfig.customHeaders,
            systemPrompt: llmConfig.context?.prompt,
            contextBehavior: llmConfig.context?.behavior || 'currentPage',
            maxContextChars: llmConfig.context?.maxChars,
        });
        setLlmService(service);
    } else {
        console.error("Chat Plugin: API key is missing in docusaurus.config.js");
    }
  }, [llmConfig]);

  useEffect(() => {
    if (windowConfig.initialGreeting && messages.length === 0 && isOpen) {
      setMessages([
        {
          id: 'init-greet',
          text: windowConfig.initialGreeting,
          sender: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }
  }, [windowConfig.initialGreeting, messages.length, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async () => {
    if (!userInput.trim() || !llmService) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    const currentAssistantMessageId = `asst-${Date.now()}`;
    // Add a placeholder for the assistant's message
    setMessages((prevMessages) => [
        ...prevMessages,
        {
            id: currentAssistantMessageId,
            text: '...', // Placeholder text
            sender: 'assistant',
            timestamp: new Date(),
        },
    ]);

    try {
        if (llmService.isStreaming) {
            await llmService.sendMessageStream(
              [...messages, newUserMessage], // Send current conversation history including new user message
              (chunk) => { // onStreamChunk
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === currentAssistantMessageId
                      ? { ...m, text: m.text === '...' ? chunk : m.text + chunk } // Replace placeholder or append
                      : m
                  )
                );
              },
              () => { // onStreamEnd
                setIsLoading(false);
              },
              (error) => { // onStreamError
                console.error("Streaming Error:", error);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === currentAssistantMessageId
                      ? { ...m, text: "Sorry, I encountered an error." }
                      : m
                  )
                );
                setIsLoading(false);
              }
            );
        } else {
            const assistantResponse = await llmService.sendMessage(
                [...messages, newUserMessage] // Send current conversation history
            );
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === currentAssistantMessageId
                        ? { ...m, text: assistantResponse }
                        : m
                )
            );
            setIsLoading(false);
        }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) =>
        prev.map((m) =>
            m.id === currentAssistantMessageId
                ? { ...m, text: "Sorry, I couldn't connect to the assistant." }
                : m
        )
      );
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const windowStyle: React.CSSProperties = {
    height: windowConfig.height || '500px',
    width: windowConfig.width || '400px',
    // Position can be handled by a wrapper or specific CSS if needed
  };

  return (
    <div className={styles.chatWindow} style={windowStyle}>
      <div className={styles.chatHeader}>
        <h3>{windowConfig.title || 'AI Assistant'}</h3>
        <button onClick={onClose} className={styles.closeButton} aria-label="Close chat window">
          <CloseIcon />
        </button>
      </div>
      <div className={styles.messageList}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
            <div className={styles.messageBubble}>
              <p>{msg.text}</p>
            </div>
            <span className={styles.messageTimestamp}>
              {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.chatInputArea}>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={windowConfig.placeholder || 'Type your message...'}
          className={styles.chatInput}
          rows={2}
          disabled={isLoading || !llmService}
        />
        <button onClick={handleSendMessage} className={styles.sendButton} disabled={isLoading || !userInput.trim() || !llmService}>
          {isLoading ? <div className={styles.loader}></div> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}
