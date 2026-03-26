import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '../../stores';
import { useBudget, useBudgetItems, useCreateBudgetItem, useUpdateBudgetItem, useDeleteBudgetItem } from '../../hooks';
import ProjectSelector from './components/ProjectSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

export default function BudgetScreen() {
  const projectId = useProjectStore((state) => state.currentProjectId) || '1';
  const { data: budget, isLoading: isBudgetLoading, error: budgetError } = useBudget(projectId);
  const { data: items = [], isLoading: isItemsLoading, error: itemsError } = useBudgetItems(projectId);

  const createBudgetItemMutation = useCreateBudgetItem();
  const updateBudgetItemMutation = useUpdateBudgetItem();
  const deleteBudgetItemMutation = useDeleteBudgetItem();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ category: '', amount: '', spent: '' });

  const handleAddItem = async () => {
    if (!formData.category.trim() || !formData.amount) return;

    try {
      await createBudgetItemMutation.mutateAsync({
        budget_id: budget.id,
        category: formData.category,
        amount: parseInt(formData.amount),
        spent: parseInt(formData.spent) || 0
      });
      setShowAddModal(false);
      setFormData({ category: '', amount: '', spent: '' });
    } catch (error) {
      console.error('예산 항목 추가 실패:', error);
    }
  };

  if (isBudgetLoading || isItemsLoading) {
    return <LoadingSpinner message="예산 데이터를 불러오는 중입니다..." />;
  }

  if (budgetError || itemsError) {
    return (
      <View style={styles.center}>
        <ErrorView 
          message="예산을 불러올 수 없습니다" 
          subMessage={(budgetError || itemsError)?.message} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 프로젝트 선택기 */}
      <View style={{ marginBottom: 16 }}>
        <ProjectSelector />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>예산 관리</Text>
        <Text style={styles.sub}>
          {budget.total_budget?.toLocaleString()}원 중 {budget.spent?.toLocaleString()}원 사용
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.category}</Text>
              <Text style={styles.itemValue}>
                {item.spent.toLocaleString()}원 / {item.amount.toLocaleString()}원
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('삭제', '이 항목을 삭제하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                { text: '삭제', style: 'destructive', onPress: () => console.log('삭제:', item.id) }
              ])}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#C9716A" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>예산 항목이 없습니다</Text>
          </View>
        }
      />

      {/* 플로팅 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 추가 모달 */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>예산 항목 추가</Text>

            <TextInput
              style={styles.input}
              placeholder="카테고리 (예: 웨딩홀)"
              value={formData.category}
              onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="예상 금액"
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="사용 금액 (선택)"
              value={formData.spent}
              onChangeText={(text) => setFormData(prev => ({ ...prev, spent: text }))}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddItem}
              disabled={createBudgetItemMutation.isPending}
            >
              <Text style={styles.saveButtonText}>
                {createBudgetItemMutation.isPending ? '추가 중...' : '추가'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddModal(false);
                setFormData({ category: '', amount: '', spent: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F2EDE8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  sub: { fontSize: 14, color: '#666' },
  error: { color: '#C9716A', fontSize: 16 },

  itemBox: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemValue: { fontSize: 14, color: '#666' },
  deleteButton: { padding: 8 },

  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#666' },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9716A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2420',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#C9716A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F2EDE8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B5B55',
    fontSize: 16,
  },
});
  sub: { color: '#6B5B55', marginTop: 4 },
  itemBox: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemValue: { color: '#6B5B55' },
  error: { color: '#C9716A' },
});
