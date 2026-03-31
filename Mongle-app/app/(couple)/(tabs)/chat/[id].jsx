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
  Modal,
  Alert,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';

// 6자리 랜덤 초대 코드 생성
const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ChatRoomScreen() {
  const { id: chatId } = useLocalSearchParams();
  const normalizedChatId = Array.isArray(chatId) ? chatId[0] : chatId;
  const hasValidChatId = typeof normalizedChatId === 'string' && UUID_PATTERN.test(normalizedChatId);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatTitle, setChatTitle] = useState('채팅방');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState([]);

  // 초대 모달
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // 메뉴 모달
  const [isMenuVisible, setMenuVisible] = useState(false);

  const flatListRef = useRef(null);

  // 현재 유저 ID
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // 채팅방 정보 & 메시지 & 멤버 초기 로드
  useEffect(() => {
    if (!normalizedChatId) return;
    if (!hasValidChatId) {
      router.replace('/(couple)/chat');
      return;
    }

    const fetchChatData = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const uid = user?.id;

        // 채팅방 제목 + 기존 초대 코드 함께 조회
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('title, invite_code')
          .eq('id', normalizedChatId)
          .single();

        if (chatError) console.error('채팅방 조회 오류:', chatError.message);
        if (chatData?.title) setChatTitle(chatData.title);
        if (chatData?.invite_code) setInviteCode(chatData.invite_code);

        // 멤버 목록 조회
        const { data: memberData, error: memberError } = await supabase
          .from('chat_members')
          .select('user_id, role')
          .eq('chat_id', normalizedChatId);

        if (memberError) {
          console.error('멤버 조회 오류:', memberError.message);
        } else if (memberData) {
          setMembers(memberData);
          const myRole = memberData.find((m) => m.user_id === uid)?.role;
          setIsOwner(myRole === 'owner');
        }

        // 메시지 목록 (최신순 → FlatList inverted)
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', normalizedChatId)
          .order('created_at', { ascending: false });

        if (msgError) {
          console.error('메시지 조회 오류:', msgError.message);
        } else {
          setMessages(msgData ?? []);
        }
      } catch (e) {
        console.error('fetchChatData 예외:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [normalizedChatId, hasValidChatId]);

  // 실시간 구독: 새 메시지
  useEffect(() => {
    if (!normalizedChatId || !hasValidChatId) return;

    const channel = supabase
      .channel(`messages-${normalizedChatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${normalizedChatId}` },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [normalizedChatId, hasValidChatId]);

  // ── 메시지 전송 ──
  const handleSend = async () => {
    if (!message.trim() || sending) return;

    const content = message.trim();
    setMessage('');
    setSending(true);

    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((prev) => [{ id: optimisticId, content, sender: currentUserId ?? 'me' }, ...prev]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ chat_id: normalizedChatId, sender: currentUserId || 'me', content })
        .select();

      if (error) throw error;

      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data[0] : m)));
    } catch (e) {
      console.error('메시지 전송 오류:', e);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  // ── 초대 코드 생성 ──
  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    const code = generateInviteCode();

    const { error } = await supabase.from('chats').update({ invite_code: code }).eq('id', normalizedChatId);

    if (error) {
      Alert.alert('오류', '초대 코드 생성에 실패했습니다.');
      console.error(error.message);
      setGeneratingCode(false);
      return;
    }

    setInviteCode(code);
    setGeneratingCode(false);
  };

  // ── 초대 코드 공유 ──
  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `채팅방 초대 코드: ${inviteCode}\n앱에서 '초대 코드 입력'을 통해 참여하세요.`,
        title: `${chatTitle} 초대`,
      });
    } catch (e) {
      console.error('공유 오류:', e);
    }
  };

  // ── 멤버 강퇴 (owner만) ──
  const handleKickMember = (member) => {
    Alert.alert('멤버 강퇴', '이 멤버를 채팅방에서 내보내시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '내보내기',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('chat_members')
            .delete()
            .eq('chat_id', normalizedChatId)
            .eq('user_id', member.user_id);

          if (error) {
            Alert.alert('오류', '강퇴에 실패했습니다.');
            return;
          }

          await supabase.from('messages').insert({
            chat_id: normalizedChatId,
            sender: 'system',
            content: '멤버가 채팅방에서 나갔습니다.',
          });

          setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
        },
      },
    ]);
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatTitle}
          </Text>
          {members.length > 0 && (
            <Text style={styles.headerSubtitle}>{members.length}명 참여 중</Text>
          )}
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
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

        {/* Input */}
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

      {/* ── 메뉴 모달 ── */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            <Text style={styles.menuRoomTitle}>{chatTitle}</Text>
            <Text style={styles.menuMemberCount}>멤버 {members.length}명</Text>

            {/* 멤버 목록 */}
            <View style={styles.memberList}>
              {members.map((m) => (
                <View key={m.user_id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={16} color="#8a7870" />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {m.user_id === currentUserId ? '나' : '멤버'}
                    </Text>
                    {m.role === 'owner' && <Text style={styles.ownerLabel}>방장</Text>}
                  </View>
                  {isOwner && m.user_id !== currentUserId && (
                    <TouchableOpacity onPress={() => handleKickMember(m)}>
                      <Ionicons name="person-remove-outline" size={18} color="#e07070" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.menuDivider} />

            {/* 초대 버튼 */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setInviteModalVisible(true);
              }}
            >
              <Ionicons name="person-add-outline" size={20} color="#c9a98e" />
              <Text style={styles.menuItemText}>멤버 초대</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Ionicons name="close-outline" size={20} color="#8a7870" />
              <Text style={[styles.menuItemText, { color: '#8a7870' }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── 초대 코드 모달 ── */}
      <Modal
        visible={isInviteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inviteOverlay}
        >
          <View style={styles.inviteSheet}>
            <View style={styles.inviteHeader}>
              <Text style={styles.inviteTitle}>멤버 초대</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#3a2e2a" />
              </TouchableOpacity>
            </View>

            <View style={styles.codeSection}>
              <Text style={styles.codeDesc}>
                초대 코드를 생성해 공유하세요.{'\n'}코드를 받은 사람은 앱에서 코드를 입력해 참여할
                수 있습니다.
              </Text>

              {inviteCode ? (
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{inviteCode}</Text>
                  <Text style={styles.codeHint}>이 코드를 상대방에게 공유하세요</Text>
                </View>
              ) : (
                <View style={styles.codeEmptyBox}>
                  <Ionicons name="key-outline" size={32} color="#e8e0dc" />
                  <Text style={styles.codeEmptyText}>아직 코드가 없습니다</Text>
                </View>
              )}

              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={[styles.codeBtn, styles.codeGenerateBtn]}
                  onPress={handleGenerateCode}
                  disabled={generatingCode}
                >
                  {generatingCode ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={16} color="#fff" />
                      <Text style={styles.codeBtnText}>
                        {inviteCode ? '코드 재생성' : '코드 생성'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {inviteCode && (
                  <TouchableOpacity
                    style={[styles.codeBtn, styles.codeShareBtn]}
                    onPress={handleShareCode}
                  >
                    <Ionicons name="share-outline" size={16} color="#c9a98e" />
                    <Text style={[styles.codeBtnText, { color: '#c9a98e' }]}>공유</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.codeWarning}>⚠️ 코드를 재생성하면 기존 코드는 무효화됩니다.</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fcfaf9' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#3a2e2a' },
  headerSubtitle: { fontSize: 12, color: '#8a7870', marginTop: 1 },
  menuBtn: { padding: 8 },

  // Messages
  keyboardAvoiding: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
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
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  bubbleMe: { backgroundColor: '#c9a98e', borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f5f0ee',
  },
  bubbleOptimistic: { opacity: 0.7 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextMe: { color: '#fff' },
  messageTextOther: { color: '#3a2e2a' },
  systemMessageContainer: { alignItems: 'center', marginVertical: 12 },
  systemMessageText: {
    fontSize: 12,
    color: '#8a7870',
    backgroundColor: '#f5f0ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Input
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

  // Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 46, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  menuRoomTitle: { fontSize: 18, fontWeight: 'bold', color: '#3a2e2a' },
  menuMemberCount: { fontSize: 13, color: '#8a7870', marginTop: 2, marginBottom: 16 },
  memberList: { maxHeight: 200, marginBottom: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f0ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 15, color: '#3a2e2a' },
  ownerLabel: {
    fontSize: 11,
    color: '#c9a98e',
    backgroundColor: '#fdf5ee',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuDivider: { height: 1, backgroundColor: '#f5f0ee', marginVertical: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  menuItemText: { fontSize: 16, color: '#c9a98e', fontWeight: '500' },

  // Invite Modal
  inviteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 46, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  inviteSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inviteTitle: { fontSize: 18, fontWeight: 'bold', color: '#3a2e2a' },
  codeSection: { gap: 16 },
  codeDesc: { fontSize: 14, color: '#8a7870', lineHeight: 20 },
  codeBox: {
    backgroundColor: '#fdf5ee',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#f5e0cc',
    borderStyle: 'dashed',
  },
  codeText: { fontSize: 32, fontWeight: 'bold', color: '#c9a98e', letterSpacing: 6 },
  codeHint: { fontSize: 13, color: '#8a7870' },
  codeEmptyBox: {
    backgroundColor: '#f5f0ee',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  codeEmptyText: { fontSize: 14, color: '#8a7870' },
  codeActions: { flexDirection: 'row', gap: 10 },
  codeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
  },
  codeGenerateBtn: { backgroundColor: '#c9a98e' },
  codeShareBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#c9a98e' },
  codeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  codeWarning: { fontSize: 12, color: '#8a7870', textAlign: 'center' },
});
