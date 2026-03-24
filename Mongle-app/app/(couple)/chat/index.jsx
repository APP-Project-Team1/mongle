import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Dummy user ID to mock authentication
const CURRENT_USER_ID = 'me';

export default function ChatScreen() {
  const [rooms, setRooms] = useState([
    {
      id: '1',
      title: 'Our Wedding Plan',
      participants: ['me', 'partner'],
      isMuted: false,
      lastMessage: 'Did you check the venue?',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [inviteeId, setInviteeId] = useState('');

  // 제목 변경 모달 상태 관리
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameRoomId, setRenameRoomId] = useState('');
  const [renameRoomTitle, setRenameRoomTitle] = useState('');

  // 1. 초대받은 사람만 접근 가능: 나와 관련된 방만 필터링
  const visibleRooms = rooms.filter(room => room.participants.includes(CURRENT_USER_ID));

  const handleCreateRoom = () => {
    if (!newRoomTitle.trim()) {
      Alert.alert('알림', '채팅방 제목을 입력해주세요.');
      return;
    }

    // Create new room structure
    const newRoom = {
      id: Date.now().toString(),
      title: newRoomTitle,
      participants: [CURRENT_USER_ID],
      isMuted: false,
      lastMessage: '채팅방이 생성되었습니다.',
      createdAt: new Date().toISOString(),
    };

    if (inviteeId.trim()) {
      newRoom.participants.push(inviteeId.trim());
    }

    setRooms(prev => [newRoom, ...prev]);
    setCreateModalVisible(false);
    setNewRoomTitle('');
    setInviteeId('');
  };

  const handleLongPress = (room) => {
    Alert.alert(
      '채팅방 설정',
      `'${room.title}' 방의 설정을 변경합니다.`,
      [
        {
          text: '제목 변경',
          onPress: () => handleChangeTitle(room.id, room.title),
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
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  const handleChangeTitle = (roomId, currentTitle) => {
    setRenameRoomId(roomId);
    setRenameRoomTitle(currentTitle);
    setRenameModalVisible(true);
  };

  const handleToggleMute = (roomId) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isMuted: !r.isMuted } : r));
  };

  const handleLeaveRoom = (roomId) => {
    Alert.alert('채팅방 나가기', '정말로 이 채팅방에서 나가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: () => {
          setRooms(prev => prev.map(r => {
            if (r.id === roomId) {
              return { ...r, participants: r.participants.filter(p => p !== CURRENT_USER_ID) };
            }
            return r;
          }));
        }
      }
    ]);
  };

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
          <Text style={styles.roomTitle} numberOfLines={1}>{item.title}</Text>
          {item.isMuted && <Ionicons name="volume-mute" size={16} color="#c9a98e" style={{ marginLeft: 4 }} />}
        </View>
        <Text style={styles.roomMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {visibleRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#e8e0dc" />
          <Text style={styles.emptyText}>참여 중인 채팅방이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={visibleRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContainer}
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

      {/* 방 생성 및 초대 모달 */}
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

            <View style={styles.inputWrap}>
              <Ionicons name="person-add-outline" size={16} color="#8a7870" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="초대할 사용자 ID (선택)"
                placeholderTextColor="#8a7870"
                value={inviteeId}
                onChangeText={setInviteeId}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewRoomTitle('');
                  setInviteeId('');
                }}
              >
                <Text style={styles.modalCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCreateBtn]}
                onPress={handleCreateRoom}
              >
                <Text style={styles.modalCreateBtnText}>만들기</Text>
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
                onPress={() => {
                  if (renameRoomTitle && renameRoomTitle.trim()) {
                    setRooms(prev => prev.map(r => r.id === renameRoomId ? { ...r, title: renameRoomTitle.trim() } : r));
                  }
                  setRenameModalVisible(false);
                  setRenameRoomId('');
                  setRenameRoomTitle('');
                }}
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
  roomInfo: {
    flex: 1,
  },
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
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8a7870',
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
  },
  modalCancelBtn: {
    backgroundColor: '#f5f0ee',
  },
  modalCancelBtnText: {
    color: '#8a7870',
    fontWeight: '600',
  },
  modalCreateBtn: {
    backgroundColor: '#c9a98e',
  },
  modalCreateBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
