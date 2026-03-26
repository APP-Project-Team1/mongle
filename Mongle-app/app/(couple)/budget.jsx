import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useBudgetItems,
  useCreateBudgetItem,
  useUpdateBudgetItem,
  useDeleteBudgetItem,
} from '../../hooks';
import { useProjectStore } from '../../stores';

export default function BudgetScreen() {
  const projectId = useProjectStore((state) => state.currentProjectId) || '1';

  const { data: budgetItems = [], isLoading, error, refetch } = useBudgetItems(projectId);
  const createBudgetItemMutation = useCreateBudgetItem();
  const updateBudgetItemMutation = useUpdateBudgetItem();
  const deleteBudgetItemMutation = useDeleteBudgetItem();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    memo: '',
  });

  const totalAmount = useMemo(() => {
    return budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [budgetItems]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      title: '',
      amount: '',
      category: '',
      memo: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title ?? '',
      amount: item.amount != null ? String(item.amount) : '',
      category: item.category ?? '',
      memo: item.memo ?? '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setForm({
      title: '',
      amount: '',
      category: '',
      memo: '',
    });
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('입력 확인', '항목명을 입력해주세요.');
      return;
    }

    if (!form.amount.trim()) {
      Alert.alert('입력 확인', '금액을 입력해주세요.');
      return;
    }

    const parsedAmount = Number(form.amount);
    if (Number.isNaN(parsedAmount)) {
      Alert.alert('입력 확인', '금액은 숫자로 입력해주세요.');
      return;
    }

    const payload = {
      project_id: projectId,
      title: form.title.trim(),
      amount: parsedAmount,
      category: form.category.trim(),
      memo: form.memo.trim(),
    };

    try {
      if (editingItem) {
        await updateBudgetItemMutation.mutateAsync({
          id: editingItem.id,
          ...payload,
        });
      } else {
        await createBudgetItemMutation.mutateAsync(payload);
      }

      closeModal();
      refetch();
    } catch (err) {
      Alert.alert('오류', err?.message || '저장에 실패했습니다.');
    }
  };

  const handleDelete = (item) => {
    Alert.alert('삭제', '이 항목을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudgetItemMutation.mutateAsync(item.id);
            refetch();
          } catch (err) {
            Alert.alert('오류', err?.message || '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemBox}
      activeOpacity={0.9}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemValue}>
          {item.category ? `${item.category} · ` : ''}
          {Number(item.amount || 0).toLocaleString()}원
        </Text>
        {!!item.memo && <Text style={styles.memoText}>{item.memo}</Text>}
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#C9716A" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <Text style={styles.error}>예산 데이터를 불러오지 못했습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>예산 관리</Text>
        <Text style={styles.sub}>총 예산: {totalAmount.toLocaleString()}원</Text>
      </View>

      <FlatList
        data={budgetItems}
        keyExtractor={(item, index) => item.id?.toString() ?? `budget-${index}`}
        renderItem={renderItem}
        contentContainerStyle={
          budgetItems.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={40} color="#C4B5AE" />
            <Text style={styles.emptyText}>등록된 예산 항목이 없습니다.</Text>
            <Text style={styles.emptySubText}>오른쪽 아래 버튼으로 추가해보세요.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? '예산 항목 수정' : '예산 항목 추가'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="항목명"
              value={form.title}
              onChangeText={(text) => handleChange('title', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="금액"
              value={form.amount}
              onChangeText={(text) => handleChange('amount', text)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="카테고리 (예: 식장, 스튜디오, 드레스)"
              value={form.category}
              onChangeText={(text) => handleChange('category', text)}
            />

            <TextInput
              style={[styles.input, styles.memoInput]}
              placeholder="메모"
              value={form.memo}
              onChangeText={(text) => handleChange('memo', text)}
              multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingItem ? '수정하기' : '저장하기'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EDE8',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2420',
  },
  sub: {
    fontSize: 14,
    color: '#6B5B55',
    marginTop: 4,
  },

  listContainer: {
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },

  itemBox: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  itemLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2420',
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 14,
    color: '#6B5B55',
  },
  memoText: {
    fontSize: 13,
    color: '#8A7C75',
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },

  empty: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B5B55',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9B8F89',
    marginTop: 6,
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#C9716A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2420',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2D7D1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  memoInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#C9716A',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#F5F1EE',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B5B55',
    fontSize: 15,
    fontWeight: '600',
  },

  error: {
    color: '#C9716A',
    marginBottom: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#C9716A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});