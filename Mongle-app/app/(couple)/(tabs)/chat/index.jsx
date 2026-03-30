import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';

export default function ChatScreen() {
  const [rooms, setRooms] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = 확인 중, true/false

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // 제목 변경 모달 상태
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameRoomId, setRenameRoomId] = useState('');
  const [renameRoomTitle, setRenameRoomTitle] = useState('');

  // 현재 유저의 project_id 가져오기
  const fetchProjectId = async (userId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('프로젝트 조회 오류:', error.message);
      return null;
    }
    return data?.id ?? null;
  };

  // 채팅방 목록 불러오기
  const fetchRooms = async (pid) => {
    if (!pid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('chats')
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        messages (
          content,
          created_at
        )
      `,
      )
      .eq('project_id', pid)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('채팅방 조회 오류:', error.message);
      setLoading(false);
      return;
    }

    const roomsWithLastMessage = (data ?? []).map((room) => {
      const sortedMessages = (room.messages ?? []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      return {
        ...room,
        lastMessage: sortedMessages[0]?.content ?? '채팅방이 생성되었습니다.',
        isMuted: false,
      };
    });

    setRooms(roomsWithLastMessage);
    setLoading(false);
  };

  // 화면 포커스될 때마다 인증 확인 후 목록 갱신
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const load = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        const pid = await fetchProjectId(user.id);
        if (!isMounted) return;
        setProjectId(pid);
        await fetchRooms(pid);
      };

      load();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  // 실시간 구독: chats 테이블 변경 감지
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats', filter: `project_id=eq.${projectId}` },
        () => {
          fetchRooms(projectId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // 채팅방 생성
  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      Alert.alert('알림', '채팅방 제목을 입력해주세요.');
      return;
    }

    setCreating(true);

    // projectId가 없으면 조회 후 없을 시 자동 생성
    let pid = projectId;
    if (!pid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        pid = await fetchProjectId(user.id);

        // 프로젝트가 없으면 기본 프로젝트 자동 생성
        if (!pid) {
          const { data: newProject, error: projectError } = await supabase
            .from('projects')
            .insert({ user_id: user.id, title: '내 웨딩 플랜' })
            .select()
            .single();

          if (projectError) {
            console.error('프로젝트 생성 오류:', projectError.message);
            setCreating(false);
            Alert.alert('오류', '프로젝트 생성에 실패했습니다.');
            return;
          }

          pid = newProject.id;
          setProjectId(pid);
        }
      }
    }

    if (!pid) {
      setCreating(false);
      Alert.alert('오류', '프로젝트 정보를 찾을 수 없습니다.');
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .insert({ project_id: pid, title: newRoomTitle.trim() })
      .select()
      .single();

    setCreating(false);

    if (error) {
      Alert.alert('오류', '채팅방 생성에 실패했습니다.');
      console.error(error.message);
      return;
    }

    setRooms((prev) => [
      { ...data, lastMessage: '채팅방이 생성되었습니다.', isMuted: false },
      ...prev,
    ]);
    setCreateModalVisible(false);
    setNewRoomTitle('');
  };

  // 채팅방 제목 변경
  const handleRenameConfirm = async () => {
    if (!renameRoomTitle.trim()) return;

    const { error } = await supabase
      .from('chats')
      .update({ title: renameRoomTitle.trim(), updated_at: new Date().toISOString() })
      .eq('id', renameRoomId);

    if (error) {
      Alert.alert('오류', '제목 변경에 실패했습니다.');
      console.error(error.message);
      return;
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === renameRoomId ? { ...r, title: renameRoomTitle.trim() } : r)),
    );
    setRenameModalVisible(false);
    setRenameRoomId('');
    setRenameRoomTitle('');
  };

  // 채팅방 나가기 (삭제)
  const handleLeaveRoom = (roomId) => {
    Alert.alert('채팅방 나가기', '정말로 이 채팅방에서 나가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('chats').delete().eq('id', roomId);

          if (error) {
            Alert.alert('오류', '채팅방 삭제에 실패했습니다.');
            console.error(error.message);
            return;
          }

          setRooms((prev) => prev.filter((r) => r.id !== roomId));
        },
      },
    ]);
  };

  // 알림 음소거 (로컬 상태 토글)
  const handleToggleMute = (roomId) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, isMuted: !r.isMuted } : r)));
  };

  const handleLongPress = (room) => {
    Alert.alert('채팅방 설정', `'${room.title}' 방의 설정을 변경합니다.`, [
      {
        text: '제목 변경',
        onPress: () => {
          setRenameRoomId(room.id);
          setRenameRoomTitle(room.title);
          setRenameModalVisible(true);
        },
      },
      {
        text: room.isMuted ? '알림 켜기' : '알림 음소거',
        onPress: () => handleToggleMute(room.id),
      },
      {
        text: '채팅방 나가기',
        style: 'destructive',
        onPress: () => handleLeaveRoom(room.id),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const AIAssistantEntry = () => (
    <TouchableOpacity
      style={styles.aiRoomItem}
      onPress={() => router.push('/(couple)/chat/ai')}
      activeOpacity={0.7}
    >
      <View style={styles.aiRoomIcon}>
        <Ionicons name="sparkles" size={20} color="#fff" />
      </View>
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomTitle}>AI 어시스턴트</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
        <Text style={styles.roomMessage}>스튜디오, 드레스, 웨딩홀, 플래너를 추천해드려요</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => router.push(`/(couple)/chat/${item.id}`)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.roomIcon}>
        <Ionicons name="chatbubbles" size={24} color="#8a7870" />
      </View>
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.isMuted && (
            <Ionicons name="volume-mute" size={16} color="#c9a98e" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={styles.roomMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ── 인증 확인 중 (초기 스피너) ──
  if (isAuthenticated === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#c9a98e" />
        </View>
      </SafeAreaView>
    );
  }

  // ── 미로그인 안내 ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#e8e0dc" />
          <Text style={styles.unauthTitle}>로그인이 필요한 서비스입니다</Text>
          <Text style={styles.unauthSubtitle}>채팅 기능은 로그인 후 이용할 수 있어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── 로그인 상태 ──
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#c9a98e" />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={<AIAssistantEntry />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#e8e0dc" />
              <Text style={styles.emptyText}>참여 중인 채팅방이 없습니다.</Text>
            </View>
          }
        />
      )}

      {/* FAB - 방 생성 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* 방 생성 모달 */}
      <Modal
        visible={isCreateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 채팅방 만들기</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="pencil-outline" size={16} color="#8a7870" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="채팅방 제목"
                placeholderTextColor="#8a7870"
                value={newRoomTitle}
                onChangeText={setNewRoomTitle}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewRoomTitle('');
                }}
              >
                <Text style={styles.modalCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCreateBtn]}
                onPress={handleCreateRoom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateBtnText}>만들기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 방 제목 변경 모달 */}
      <Modal
        visible={isRenameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>채팅방 제목 변경</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="pencil-outline" size={16} color="#8a7870" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="새로운 채팅방 제목"
                placeholderTextColor="#8a7870"
                value={renameRoomTitle}
                onChangeText={setRenameRoomTitle}
                autoFocus={true}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setRenameModalVisible(false);
                  setRenameRoomId('');
                  setRenameRoomTitle('');
                }}
              >
                <Text style={styles.modalCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCreateBtn]}
                onPress={handleRenameConfirm}
              >
                <Text style={styles.modalCreateBtnText}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3a2e2a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  unauthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2e2a',
    marginTop: 4,
  },
  unauthSubtitle: {
    fontSize: 14,
    color: '#8a7870',
  },
  listContainer: {
    padding: 16,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
  },
  roomIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f0ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomInfo: { flex: 1 },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  roomMessage: {
    fontSize: 14,
    color: '#8a7870',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8a7870',
  },
  aiRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
    marginBottom: 4,
  },
  aiRoomIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiBadge: {
    backgroundColor: '#f5f0ee',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#c9a98e',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 46, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a2e2a',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ee',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#3a2e2a' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  modalCancelBtn: { backgroundColor: '#f5f0ee' },
  modalCancelBtnText: { color: '#8a7870', fontWeight: '600' },
  modalCreateBtn: { backgroundColor: '#c9a98e' },
  modalCreateBtnText: { color: '#fff', fontWeight: '600' },
});
