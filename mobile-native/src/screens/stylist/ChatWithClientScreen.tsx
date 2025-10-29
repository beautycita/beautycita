/**
 * ChatWithClientScreen.tsx
 * Message client (stylist view)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, getBackgroundColor, getTextColor } from '../../theme';
import { socketService } from '../../services';

type Props = NativeStackScreenProps<any, 'ChatWithClient'>;

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'client';
  timestamp: Date;
}

export const ChatWithClientScreen: React.FC<Props> = ({ route }) => {
  const { bookingId } = route.params as { bookingId: number };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [darkMode] = useState(false);

  const backgroundColor = getBackgroundColor(darkMode ? 'dark' : 'light');
  const textColor = getTextColor(darkMode ? 'dark' : 'light');
  const textSecondary = getTextColor(darkMode ? 'dark' : 'light', 'secondary');

  useEffect(() => {
    // TODO: Load chat history
    // TODO: Connect to socket for real-time messages
    loadChatHistory();

    return () => {
      // Cleanup socket connection
    };
  }, [bookingId]);

  const loadChatHistory = async () => {
    // Mock messages for now
    setMessages([
      {
        id: '1',
        text: 'Hi! Looking forward to our appointment',
        sender: 'client',
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: '2',
        text: 'Great! See you then!',
        sender: 'me',
        timestamp: new Date(Date.now() - 3000000),
      },
    ]);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // TODO: Send via socket
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';

    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.clientMessage]}>
        <Text style={[styles.messageText, { color: isMe ? colors.white : textColor }]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, { color: isMe ? colors.white : textSecondary }]}>
          {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputContainer, darkMode && { backgroundColor: colors.gray800 }]}>
        <TextInput
          style={[styles.input, { color: textColor }, darkMode && { backgroundColor: colors.gray700 }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    padding: spacing.lg,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.pink500,
  },
  clientMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray200,
  },
  messageText: {
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: typography.fontFamilies.body,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: typography.fontFamilies.body,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: spacing.md,
    backgroundColor: colors.pink500,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodySemiBold,
  },
});

export default ChatWithClientScreen;
