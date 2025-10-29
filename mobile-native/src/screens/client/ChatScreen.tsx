import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {PaperAirplaneIcon} from 'react-native-heroicons/solid';
import {socketService} from '../../services';

export default function ChatScreen() {
  const route = useRoute();
  const {bookingId} = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    socketService.joinBookingRoom(bookingId);
    socketService.onMessage(handleNewMessage);

    return () => {
      socketService.leaveBookingRoom(bookingId);
    };
  }, []);

  const handleNewMessage = useCallback((message) => {
    setMessages((prev) => [message, ...prev]);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const message = inputText.trim();
    setInputText('');

    try {
      await socketService.sendMessage(bookingId, message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const renderMessage = ({item}) => {
    const isMe = item.sender_id === 'current_user_id'; // Replace with actual user ID
    return (
      <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
        <View
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${
            isMe ? 'bg-pink-500' : 'bg-gray-800'
          }`}
        >
          <Text className="text-white">{item.message}</Text>
          <Text className="text-gray-300 text-xs mt-1">
            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        inverted
        contentContainerStyle={{padding: 16}}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400">No messages yet</Text>
          </View>
        }
      />
      {isTyping && (
        <View className="px-6 py-2">
          <Text className="text-gray-400 text-sm">Stylist is typing...</Text>
        </View>
      )}
      <View className="flex-row items-center px-4 py-3 border-t border-gray-800">
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          className="flex-1 bg-gray-800 rounded-full px-4 py-3 text-white mr-3"
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          className="bg-pink-500 rounded-full p-3"
          disabled={!inputText.trim()}
        >
          <PaperAirplaneIcon size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
