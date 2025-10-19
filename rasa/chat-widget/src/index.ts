// Main export for the BeautyCita Chat Widget
export { default as ChatWidget } from './components/ChatWidget';
export type { ChatWidgetProps } from './components/ChatWidget';

// Re-export for easy integration
import ChatWidget from './components/ChatWidget';
export default ChatWidget;