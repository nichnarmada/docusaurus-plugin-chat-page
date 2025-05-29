// src/plugin.ts
import type { LoadContext, Plugin } from '@docusaurus/types';
import path from 'path';

// Define a type for your plugin options.
// This should match the structure in docusaurus.config.js themeConfig.chatGpt
export interface ChatGptPluginOptions {
  apiKey: string;
  llmService?: {
    type?: 'openai' | 'custom' | 'azure_openai';
    endpoint?: string;
  };
  model?: string;
  chatButton?: {
    icon?: string;
    label?: string;
    tooltip?: string;
    position?: {
      bottom?: string;
      right?: string;
      left?: string;
      top?: string;
    };
  };
  chatWindow?: {
    title?: string;
    height?: string;
    width?: string;
    initialGreeting?: string;
    placeholder?: string;
  };
  context?: {
    behavior?: 'currentPage' | 'docusaurusSearch' | 'both' | 'none';
    prompt?: string;
    maxChars?: number;
  };
  streaming?: boolean;
  customHeaders?: Record<string, string>;
  rateLimit?: {
    maxMessages?: number;
    perMinutes?: number;
  };
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error' | 'none';
  }
}


export default function chatGptPlugin(
  context: LoadContext,
  options: ChatGptPluginOptions,
): Plugin<void> {
  // The 'options' parameter here are the plugin options from docusaurus.config.js
  // Docusaurus automatically makes these options available via useThemeConfig()
  // if the plugin is part of a theme or if the options are placed under themeConfig.pluginName
  // Our components (ChatButton, ChatWindow, LLMService) already use useThemeConfig().chatGpt
  // So, we just need to ensure the config is structured correctly in docusaurus.config.js

  // Basic validation (optional, but good practice)
  if (!options || !options.apiKey) {
    // console.warn('ChatGptPlugin: API key is missing in plugin options.');
    // Depending on strictness, you might throw an error or allow it to proceed
    // throw new Error("ChatGptPlugin: API key is required. Please configure it in docusaurus.config.js");
  }


  return {
    name: 'docusaurus-chatgpt-plugin',

    getThemePath() {
      // Point to the directory containing our theme components
      return path.resolve(__dirname, './theme');
    },

    getClientModules() {
      // Return the path to the client module that will inject the ChatButton
      return [path.resolve(__dirname, './client')];
    },

    // Content-Security-Policy (CSP) for fetching from LLM endpoint
    // This is important if you have a CSP defined for your site.
    // TODO: Make the endpoint configurable for CSP. For now, allowing connect-src to common LLM hosts.
    //       Ideally, this should be more specific based on the actual LLM endpoint configured.
    // getCsp(defaultCsp) {
    //   const { endpoint } = options.llmService || {};
    //   const connectSrc = defaultCsp['connect-src'] || [];
      
    //   // Add default OpenAI endpoint
    //   if (!endpoint || endpoint.includes('api.openai.com')) {
    //       connectSrc.push('https://api.openai.com');
    //   } else if (endpoint) {
    //       // Add the custom endpoint if provided
    //       try {
    //           const url = new URL(endpoint);
    //           connectSrc.push(url.origin);
    //       } catch (e) {
    //           console.warn(`ChatGptPlugin: Invalid LLM endpoint URL for CSP: ${endpoint}`);
    //       }
    //   }
      
    //   return {
    //     ...defaultCsp,
    //     'connect-src': connectSrc,
    //   };
    // }
    // Commenting out CSP for now as it might be too restrictive without proper configuration UI/docs yet.
    // Users will need to configure their own CSP if they have one.
  };
}

// Re-export types for users who might want to import them
export type { ChatGptPluginOptions as Options };
export { ChatGptPluginOptions }; // For convenience if imported directly
