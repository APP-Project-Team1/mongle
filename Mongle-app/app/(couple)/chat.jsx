import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useChatMessages, useSendMessage, useCreateChat } from '../../hooks';

export default function ChatScreen() {
  const [chatId, setChatId] = useState('1');
  const [message, setMessage] = useState('');
  const { data: messages = [], isLoading, error } = useChatMessages(chatId);
  const sendMessageMutation = useSendMessage();
  const createChatMutation = useCreateChat();

  useEffect(() => {
    if (!chatId) {
      createChatMutation.mutate({ projectId: '1', title: '기본 채팅방' }, {
        onSuccess: (newChat) => setChatId(newChat.id),
      });
    }
  }, [chatId]);

  const onSend = async () => {
    if (!message.trim()) return;
    await sendMessageMutation.mutateAsync({ chatId, sender: 'user', content: message });
    setMessage('');
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C9716A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>채팅 불러오기 실패: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>채팅방 ID: {chatId}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.sender === 'ai' && styles.aiMessage]}>
            <Text style={styles.sender}>{item.sender}</Text>
            <Text style={styles.message}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="메시지를 입력하세요"
        />
        <TouchableOpacity style={styles.button} onPress={onSend}>
          <Text style={styles.buttonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F2EDE8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  messageRow: { marginBottom: 8, padding: 8, backgroundColor: '#FFF', borderRadius: 8 },
  aiMessage: { backgroundColor: '#ECEFF1' },
  sender: { fontSize: 11, color: '#6B5B55', marginBottom: 2 },
  message: { fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#C4B5AE', borderRadius: 10, padding: 10, backgroundColor: '#FFF' },
  button: { marginLeft: 8, backgroundColor: '#C9716A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  buttonText: { color: '#FFF' },
  error: { color: '#C9716A' },
});