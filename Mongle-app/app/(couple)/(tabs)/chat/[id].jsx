import { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';

export default function ChatRoomScreen() {
  const { id: chatId } = useLocalSearchParams();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatTitle, setChatTitle] = useState('채팅방');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);

  // 현재 유저 ID 가져오기
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // 채팅방 정보 & 메시지 초기 로드
  useEffect(() => {
    if (!chatId) return;

    const fetchChatData = async () => {
      setLoading(true);

      // 채팅방 제목
      const { data: chatData } = await supabase
        .from('chats')
        .select('title')
        .eq('id', chatId)
        .single();

      if (chatData?.title) setChatTitle(chatData.title);

      // 메시지 목록 (최신순 → FlatList inverted이므로)
      const { data: msgData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('메시지 조회 오류:', error.message);
      } else {
        setMessages(msgData ?? []);
      }

      setLoading(false);
    };

    fetchChatData();
  }, [chatId]);

  // 실시간 구독: 새 메시지 수신
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            // 이미 낙관적 업데이트로 추가된 경우 중복 방지
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // 메시지 전송
  const handleSend = async () => {
    if (!message.trim() || sending) return;

    const content = message.trim();
    setMessage('');
    setSending(true);

    // 낙관적 업데이트: 임시 ID로 먼저 화면에 표시
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      chat_id: chatId,
      sender: currentUserId ?? 'me',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [optimisticMsg, ...prev]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender: currentUserId ?? 'me',
        content,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      console.error('메시지 전송 오류:', error.message);
      // 실패 시 낙관적 메시지 제거
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      return;
    }

    // 낙관적 메시지를 실제 DB 메시지로 교체
    setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data : m)));

    // chats.updated_at 갱신
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    const isMe = item.sender === currentUserId || item.sender === 'me';
    const isOptimistic = item.id?.toString().startsWith('optimistic-');

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#8a7870" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
            isOptimistic && styles.bubbleOptimistic,
          ]}
        >
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {chatTitle}
        </Text>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color="#3a2e2a" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#c9a98e" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            inverted
          />
        )}

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

          {/* AI Button */}
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => router.push('/(couple)/chat/ai')}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={20} color="#c9a98e" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, message.trim() ? styles.sendBtnActive : {}]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color={message.trim() ? '#fff' : '#c9a98e'} />
            )}
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
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a2e2a',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  menuBtn: { padding: 8 },
  keyboardAvoiding: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
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
  bubbleOptimistic: {
    opacity: 0.7,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextMe: { color: '#fff' },
  messageTextOther: { color: '#3a2e2a' },
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
  attachBtn: { padding: 8, marginRight: 4 },
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
  sendBtnActive: { backgroundColor: '#c9a98e' },
  aiBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
