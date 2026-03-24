import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CURRENT_USER_ID = 'me';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  
  // Dummy messages for demonstration
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: '안녕하세요! 채팅방 구조를 잡았습니다.',
      sender: 'partner',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      text: '채팅방 생성이 완료되었습니다.',
      sender: 'system',
      timestamp: new Date().toISOString(),
    }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: CURRENT_USER_ID,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [newMessage, ...prev]);
    setMessage('');
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.sender === CURRENT_USER_ID;

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#8a7870" />
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>채팅방</Text>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color="#3a2e2a" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          inverted
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={24} color="#8a7870" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="메시지 입력..."
            placeholderTextColor="#8a7870"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, message.trim() ? styles.sendBtnActive : {}]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons 
              name="send" 
              size={18} 
              color={message.trim() ? "#fff" : "#c9a98e"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fcfaf9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a2e2a',
  },
  menuBtn: { padding: 8 },
  keyboardAvoiding: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f0ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#c9a98e',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f5f0ee',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#3a2e2a',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#8a7870',
    backgroundColor: '#f5f0ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f0ee',
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f0ee',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#3a2e2a',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f0ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnActive: {
    backgroundColor: '#c9a98e',
  },
});
