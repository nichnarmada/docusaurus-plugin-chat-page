// src/client.ts
import React from 'react';
import ReactDOM from 'react-dom';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import ChatButton from './theme/ChatButton'; // Adjust path if your ChatButton is elsewhere

if (ExecutionEnvironment.canUseDOM) {
  // Ensure this runs only in the browser

  // Create a div element to mount our ChatButton
  const chatButtonContainer = document.createElement('div');
  chatButtonContainer.id = 'docusaurus-chatgpt-container';
  document.body.appendChild(chatButtonContainer);

  // Render the ChatButton into the container
  // ChatButton, ChatWindow, and LLMService will use useThemeConfig()
  // to get their configurations, so no props need to be passed here explicitly
  // for the plugin options.
  ReactDOM.render(React.createElement(ChatButton), chatButtonContainer);
}

// Note: No explicit option passing needed here if components use useThemeConfig().
// The options provided to the plugin in docusaurus.config.js are automatically
// merged into the themeConfig by Docusaurus when the plugin is loaded.
// The components ChatButton, ChatWindow, and LLMService are already
// designed to retrieve their settings from `useThemeConfig().chatGpt`.
//
// If options were NOT available via useThemeConfig (e.g., if this were a standalone
// plugin not part of a theme, and options were not in themeConfig), alternative methods:
// 1. Global Variable (less ideal):
//    In plugin.ts, during some server-side hook, serialize options to a string.
//    In getClientModules, add a script tag or similar to set window.MY_PLUGIN_OPTIONS.
//    Client.ts reads window.MY_PLUGIN_OPTIONS.
// 2. Temporary File (build time):
//    Plugin's `configureWebpack` or a custom build step writes options to a .json file in .docusaurus.
//    Client.ts fetches this JSON file.
//
// However, for theme-integrated components or plugins placing options in themeConfig,
// useThemeConfig() is the simplest and recommended Docusaurus pattern.
