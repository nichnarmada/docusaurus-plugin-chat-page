// src/theme/ChatButton/index.tsx
import React, { useState } from 'react';
import styles from './styles.module.css';
import { useThemeConfig } from '@docusaurus/theme-common';
import ChatWindow from '../ChatWindow'; // Import ChatWindow

// Interface for ChatButton's own props (if any were needed beyond theme config)
// interface ChatButtonProps {}

interface ChatButtonConfig {
  icon?: string;
  label?: string;
  tooltip?: string;
  position?: {
    bottom?: string;
    right?: string;
    left?: string;
    top?: string;
  };
}

// Default Icon for the chat button if no custom one is provided
const DefaultIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 9.25074 20.9404 6.74438 19.1674 4.9999M19.1674 4.9999C17.8311 3.67697 16.1697 2.76428 14.3427 2.34301" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 15.5C7.5 15.5 9.5 17.5 12 17.5C14.5 17.5 16.5 15.5 16.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 10.5C8.77614 10.5 9 10.2761 9 10C9 9.72386 8.77614 9.5 8.5 9.5C8.22386 9.5 8 9.72386 8 10C8 10.2761 8.22386 10.5 8.5 10.5Z" fill="currentColor"/>
    <path d="M15.5 10.5C15.7761 10.5 16 10.2761 16 10C16 9.72386 15.7761 9.5 15.5 9.5C15.2239 9.5 15 9.72386 15 10C15 10.2761 15.2239 10.5 15.5 10.5Z" fill="currentColor"/>
  </svg>
);

// Using 'React.FC' (FunctionComponent) is optional but can be good practice.
// No specific props are passed to ChatButton itself anymore, it uses themeConfig.
export default function ChatButton(): JSX.Element {
  const { chatGpt } = useThemeConfig();
  const buttonConfig = chatGpt?.chatButton as ChatButtonConfig || {};
  // ChatWindow also uses chatGpt from themeConfig, so no direct props needed here for it yet.

  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChatWindow = () => {
    setIsChatOpen(!isChatOpen);
  };

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: buttonConfig.position?.bottom || '20px',
    right: buttonConfig.position?.right || '20px',
    ...(buttonConfig.position?.left && { left: buttonConfig.position.left }),
    ...(buttonConfig.position?.top && { top: buttonConfig.position.top }),
  };

  // The ChatWindow will read its own configuration from useThemeConfig()
  // So we don't need to pass props like apiKey, endpoint etc. here.
  // It will get them directly.

  return (
    <>
      <button
        type="button"
        className={`${styles.chatButton} clean-btn`}
        onClick={toggleChatWindow}
        title={buttonConfig.tooltip || (isChatOpen ? 'Close chat' : 'Open chat')}
        style={buttonStyle}
        aria-label={buttonConfig.tooltip || (isChatOpen ? 'Close chat window' : 'Open chat window')}
        aria-expanded={isChatOpen}
      >
        {buttonConfig.icon ? <img src={buttonConfig.icon} alt="" className={styles.chatButtonIcon} /> : <DefaultIcon />}
        {buttonConfig.label && <span className={styles.chatButtonLabel}>{buttonConfig.label}</span>}
      </button>
      <ChatWindow isOpen={isChatOpen} onClose={toggleChatWindow} />
    </>
  );
}
