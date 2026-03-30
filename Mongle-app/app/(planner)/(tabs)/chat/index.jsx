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
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../../../lib/supabase';

export default function ChatScreen() {
  const [rooms, setRooms] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // 초대 코드로 입장 모달
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // 초대 코드 보기 모달
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteRoomTitle, setInviteRoomTitle] = useState('');

  // 제목 변경 모달
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameRoomId, setRenameRoomId] = useState('');
  const [renameRoomTitle, setRenameRoomTitle] = useState('');

  // ── 채팅방 목록: chat_members 기반으로 내가 속한 방만 조회 ──
  const fetchRooms = async () => {
    setLoading(true);

    try {
      // chats 기본 조회 (messages 포함)
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
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('채팅방 조회 오류:', error.message);
        return;
      }

      // chat_members 별도 조회해서 멤버 수 계산
      const chatIds = (data ?? []).map((r) => r.id);
      let memberCountMap = {};

      if (chatIds.length > 0) {
        const { data: memberData, error: memberError } = await supabase
          .from('chat_members')
          .select('chat_id')
          .in('chat_id', chatIds);

        if (memberError) {
          console.error('멤버 수 조회 오류:', memberError.message);
        } else {
          memberData?.forEach((m) => {
            memberCountMap[m.chat_id] = (memberCountMap[m.chat_id] ?? 0) + 1;
          });
        }
      }

      const roomsWithLastMessage = (data ?? []).map((room) => {
        const sortedMessages = (room.messages ?? []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        return {
          ...room,
          lastMessage: sortedMessages[0]?.content ?? '채팅방이 생성되었습니다.',
          memberCount: memberCountMap[room.id] ?? 1,
          isMuted: false,
        };
      });

      setRooms(roomsWithLastMessage);
    } catch (e) {
      console.error('fetchRooms 예외:', e);
    } finally {
      setLoading(false);
    }
  };

  // 화면 포커스 시 인증 확인 + 목록 갱신
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
        setCurrentUserId(user.id);
        await fetchRooms();
      };

      load();
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // 실시간 구독: chats 변경 감지
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('chats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        fetchRooms();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // ── 채팅방 생성 (생성자를 owner로 chat_members에 등록) ──
  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      Alert.alert('알림', '채팅방 제목을 입력해주세요.');
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 유저의 가장 최근 프로젝트 조회
      let pid = null;
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      pid = projectData?.id;

      if (!pid) {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({ user_id: user.id, title: '내 웨딩 플랜' })
          .select()
          .single();

        if (projectError) {
          Alert.alert('오류', '프로젝트 생성에 실패했습니다.');
          console.error('프로젝트 생성 오류:', projectError.message);
          return;
        }
        pid = newProject.id;
      }

      // 채팅방 생성
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({ project_id: pid, title: newRoomTitle.trim() })
        .select()
        .single();

      if (chatError) {
        Alert.alert('오류', '채팅방 생성에 실패했습니다.');
        console.error('채팅방 생성 오류:', chatError.message);
        return;
      }

      // 생성자를 owner로 chat_members에 추가
      // chat_members 테이블이 없어도 채팅방 생성은 완료 처리
      const { error: memberError } = await supabase.from('chat_members').insert({
        chat_id: chatData.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) {
        console.error('멤버 등록 오류 (chat_members 테이블 확인 필요):', memberError.message);
      }

      setRooms((prev) => [
        { ...chatData, lastMessage: '채팅방이 생성되었습니다.', memberCount: 1, isMuted: false },
        ...prev,
      ]);
      setCreateModalVisible(false);
      setNewRoomTitle('');
    } catch (e) {
      console.error('handleCreateRoom 예외:', e);
      Alert.alert('오류', '채팅방 생성 중 문제가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  // 초대 코드로 채팅방 참여
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      Alert.alert('알림', '초대 코드를 입력해주세요.');
      return;
    }

    setJoining(true);

    try {
      // 초대 코드로 채팅방 조회
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id, title')
        .eq('invite_code', joinCode.trim())
        .maybeSingle();

      if (chatError || !chatData) {
        Alert.alert('오류', '유효하지 않은 초대 코드입니다.');
        return;
      }

      // 이미 참여 중인지 확인
      const { data: existing } = await supabase
        .from('chat_members')
        .select('id')
        .eq('chat_id', chatData.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existing) {
        Alert.alert('알림', '이미 참여 중인 채팅방입니다.');
        setJoinModalVisible(false);
        setJoinCode('');
        router.push(`/(planner)/chat/${chatData.id}`);
        return;
      }

      // chat_members에 추가
      const { error: memberError } = await supabase
        .from('chat_members')
        .insert({ chat_id: chatData.id, user_id: currentUserId, role: 'member' });

      if (memberError) {
        Alert.alert('오류', '채팅방 참여에 실패했습니다.');
        console.error('참여 오류:', memberError.message);
        return;
      }

      setJoinModalVisible(false);
      setJoinCode('');
      await fetchRooms();
      router.push(`/(planner)/chat/${chatData.id}`);
    } catch (e) {
      console.error('handleJoinByCode 예외:', e);
      Alert.alert('오류', '채팅방 참여 중 문제가 발생했습니다.');
    } finally {
      setJoining(false);
    }
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
      return;
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === renameRoomId ? { ...r, title: renameRoomTitle.trim() } : r)),
    );
    setRenameModalVisible(false);
    setRenameRoomId('');
    setRenameRoomTitle('');
  };

  // 채팅방 나가기 (chat_members에서 본인 제거)
  const handleLeaveRoom = (room) => {
    const isOwner = room.chat_members?.some(
      (m) => m.user_id === currentUserId && m.role === 'owner',
    );

    Alert.alert(
      '채팅방 나가기',
      isOwner
        ? '방장이 나가면 채팅방이 삭제됩니다. 계속하시겠습니까?'
        : '정말로 이 채팅방에서 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            if (isOwner) {
              // 방장이면 채팅방 전체 삭제 (CASCADE로 chat_members, messages도 삭제)
              const { error } = await supabase.from('chats').delete().eq('id', room.id);
              if (error) {
                Alert.alert('오류', '채팅방 삭제에 실패했습니다.');
                return;
              }
            } else {
              // 일반 멤버면 본인만 chat_members에서 제거
              const { error } = await supabase
                .from('chat_members')
                .delete()
                .eq('chat_id', room.id)
                .eq('user_id', currentUserId);
              if (error) {
                Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
                return;
              }
            }
            setRooms((prev) => prev.filter((r) => r.id !== room.id));
          },
        },
      ],
    );
  };

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
        text: '초대 코드 보기',
        onPress: async () => {
          const { data } = await supabase
            .from('chats')
            .select('invite_code, title')
            .eq('id', room.id)
            .single();
          if (data?.invite_code) {
            setInviteCode(data.invite_code);
            setInviteRoomTitle(data.title ?? room.title);
            setInviteModalVisible(true);
          } else {
            Alert.alert('오류', '초대 코드를 불러오지 못했습니다.');
          }
        },
      },
      {
        text: '채팅방 나가기',
        style: 'destructive',
        onPress: () => handleLeaveRoom(room),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => router.push(`/(planner)/chat/${item.id}`)}
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
          {/* 멤버 수 뱃지 */}
          {item.memberCount > 1 && (
            <View style={styles.memberBadge}>
              <Ionicons name="people" size={11} color="#8a7870" />
              <Text style={styles.memberBadgeText}>{item.memberCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.roomMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ── 인증 확인 중 ──
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

  // ── 미로그인 ──
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#e8e0dc" />
              <Text style={styles.emptyText}>참여 중인 채팅방이 없습니다.</Text>
            </View>
          }
        />
      )}

      {/* 코드로 입장 버튼 */}
      <TouchableOpacity
        style={styles.joinBtn}
        activeOpacity={0.8}
        onPress={() => setJoinModalVisible(true)}
      >
        <Ionicons name="enter-outline" size={22} color="#c9a98e" />
      </TouchableOpacity>

      {/* FAB */}
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
      {/* 초대 코드 보기 모달 */}
      <Modal
        visible={isInviteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>초대 코드</Text>
            <Text style={styles.inviteRoomName}>{inviteRoomTitle}</Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeText}>{inviteCode}</Text>
              <TouchableOpacity
                onPress={() => {
                  Clipboard.setStringAsync(inviteCode);
                  Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다.');
                }}
                style={styles.copyBtn}
              >
                <Ionicons name="copy-outline" size={20} color="#c9a98e" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inviteGuide}>위 코드를 상대방에게 공유하세요.</Text>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalCreateBtn, { alignSelf: 'flex-end' }]}
              onPress={() => setInviteModalVisible(false)}
            >
              <Text style={styles.modalCreateBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 초대 코드로 입장 모달 */}
      <Modal
        visible={isJoinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>초대 코드로 입장</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={16} color="#8a7870" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="초대 코드 입력"
                placeholderTextColor="#8a7870"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="none"
                autoFocus={true}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setJoinModalVisible(false);
                  setJoinCode('');
                }}
              >
                <Text style={styles.modalCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCreateBtn]}
                onPress={handleJoinByCode}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateBtnText}>입장</Text>
                )}
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#3a2e2a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  unauthTitle: { fontSize: 16, fontWeight: '600', color: '#3a2e2a', marginTop: 4 },
  unauthSubtitle: { fontSize: 14, color: '#8a7870' },
  listContainer: { padding: 16 },
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
  roomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  roomTitle: { fontSize: 16, fontWeight: '600', color: '#3a2e2a' },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ee',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    gap: 3,
  },
  memberBadgeText: { fontSize: 11, color: '#8a7870' },
  roomMessage: { fontSize: 14, color: '#8a7870' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#8a7870' },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#3a2e2a', marginBottom: 8 },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
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
  joinBtn: {
    position: 'absolute',
    bottom: 100,
    right: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  inviteRoomName: {
    fontSize: 14,
    color: '#8a7870',
    marginBottom: 12,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ee',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3a2e2a',
    letterSpacing: 6,
  },
  copyBtn: {
    padding: 4,
  },
  inviteGuide: {
    fontSize: 13,
    color: '#8a7870',
    textAlign: 'center',
    marginTop: 4,
  },
});
