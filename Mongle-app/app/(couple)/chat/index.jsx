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
import { useChats, useCreateChat, useCurrentUser } from '../../../hooks';
import { useProjectStore } from '../../../stores';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorView from '../../../components/common/ErrorView';

export default function ChatScreen() {
  const projectId = useProjectStore((state) => state.currentProjectId) || '1';
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id || 'me';

  const { data: rooms = [], isLoading, error, refetch } = useChats(projectId);
  const createChatMutation = useCreateChat();

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');

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

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      Alert.alert('알림', '채팅방 제목을 입력해주세요.');
      return;
    }

    try {
      await createChatMutation.mutateAsync({
        project_id: projectId,
        title: newRoomTitle.trim()
      });
      setCreateModalVisible(false);
      setNewRoomTitle('');
    } catch (err) {
      Alert.alert('오류', '채팅방 생성에 실패했습니다.');
    }
  };

  const handleLongPress = (room) => {
    Alert.alert(
      '채팅방 설정',
      `'${room.title || '새 채팅'}' 방의 설정을 변경하시겠습니까? (API 미구현)`,
      [
        { text: '취소', style: 'cancel' }
      ]
    );
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
          <Text style={styles.roomTitle} numberOfLines={1}>{item.title || '새 채팅'}</Text>
        </View>
        <Text style={styles.roomMessage} numberOfLines={1}>{(item.last_message || '메시지가 없습니다.')}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="채팅방 목록을 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message="채팅방을 불러올 수 없습니다" subMessage={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
                disabled={createChatMutation.isPending}
              >
                <Text style={styles.modalCreateBtnText}>
                  {createChatMutation.isPending ? '생성 중...' : '만들기'}
                </Text>
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
});
