/**
 * Chat Screen (Shared)
 * Individual conversation view with real-time messaging
 * Features:
 * - Real-time message sending/receiving via Socket.IO
 * - Typing indicators
 * - Message read receipts
 * - Auto-scroll to bottom
 * - Message timestamps
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';
import socketService, { ChatMessage, TypingStatus } from '../../services/socketService';

interface ChatScreenProps {
  // These would come from navigation params
  conversationId: string;
  otherUserId: number;
  otherUserName: string;
  currentUserId: number;
}

/**
 * Chat Screen Component
 */
export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  otherUserId,
  otherUserName,
  currentUserId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection and load messages
  useEffect(() => {
    // Connect socket if not already connected
    if (!socketService.isConnected()) {
      // TODO: Get auth token from AsyncStorage
      const authToken = 'mock_token'; // Replace with actual token
      socketService.connect(currentUserId, authToken);
    }

    // Join conversation room
    socketService.joinConversation(conversationId);

    // Load initial messages (TODO: API call)
    loadMessages();

    // Setup socket listeners
    const unsubscribeMessage = socketService.onMessage(handleNewMessage);
    const unsubscribeTyping = socketService.onTyping(handleTypingStatus);
    const unsubscribeConnect = socketService.onConnect(() => setConnected(true));
    const unsubscribeDisconnect = socketService.onDisconnect(() => setConnected(false));

    // Mark conversation as read
    socketService.markConversationRead(conversationId);

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeConnect();
      unsubscribeDisconnect();
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId, currentUserId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      // TODO: API call to load conversation messages
      // For now, use mock data
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          conversationId,
          senderId: otherUserId,
          receiverId: currentUserId,
          message: 'Hi! Thanks for booking with me!',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true,
        },
        {
          id: '2',
          conversationId,
          senderId: currentUserId,
          receiverId: otherUserId,
          message: 'Hi! Looking forward to my appointment tomorrow.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: true,
        },
        {
          id: '3',
          conversationId,
          senderId: otherUserId,
          receiverId: currentUserId,
          message: 'Great! See you at 10am. Let me know if you need to reschedule.',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          read: true,
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setConnected(socketService.isConnected());
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    if (message.conversationId === conversationId) {
      setMessages((prev) => [...prev, message]);

      // Mark as read if we received it
      if (message.senderId === otherUserId) {
        socketService.markMessageRead(message.id);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTypingStatus = (status: TypingStatus) => {
    if (
      status.conversationId === conversationId &&
      status.userId === otherUserId
    ) {
      setOtherUserTyping(status.isTyping);
    }
  };

  const handleSendMessage = () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || !connected) {
      return;
    }

    // Send message via socket
    socketService.sendMessage(conversationId, otherUserId, trimmedText);

    // Optimistically add to local state
    const newMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      receiverId: otherUserId,
      message: trimmedText,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Clear input and stop typing indicator
    setInputText('');
    setIsTyping(false);
    socketService.sendTyping(conversationId, false);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendTyping(conversationId, false);
    }, 2000);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}>
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}>
            {formatTimestamp(item.timestamp)}
            {isOwnMessage && item.read && ' • Read'}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>{otherUserName} is typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.otherUserName}>{otherUserName}</Text>
            <Text style={styles.connectionStatus}>
              {connected ? 'Active' : 'Connecting...'}
            </Text>
          </View>
        </View>

        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.pink500} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderTypingIndicator}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray400}
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || !connected) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !connected}>
            <Text style={styles.sendIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  otherUserName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
  },
  connectionStatus: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.green500,
    marginTop: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages List
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },

  // Message
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: colors.pink500,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.gray900,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    marginTop: spacing.xs,
  },
  ownMessageTime: {
    color: colors.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.gray500,
  },

  // Typing Indicator
  typingContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  typingBubble: {
    backgroundColor: colors.gray100,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: colors.gray400,
  },
  typingDot1: {
    // Animation would be added here
  },
  typingDot2: {
    // Animation would be added here
  },
  typingDot3: {
    // Animation would be added here
  },
  typingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    fontStyle: 'italic',
  },

  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray900,
    maxHeight: 100,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: colors.pink500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendIcon: {
    fontSize: 20,
  },
});

export default ChatScreen;
