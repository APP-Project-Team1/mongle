import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../../hooks';
import { useProjectStore } from '../../stores/projectStore';
import ProjectSelector from '../components/ProjectSelector';
import { Plus, Edit, Trash2 } from 'lucide-react-native';

export default function VendorsScreen() {
  const { selectedProjectId } = useProjectStore();
  const { data: vendors = [], isLoading, error, refetch } = useVendors({ projectId: selectedProjectId });
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', region: '' });

  const openModal = (vendor = null) => {
    setEditingVendor(vendor);
    setFormData(vendor ? { name: vendor.name, category: vendor.category, region: vendor.region } : { name: '', category: '', region: '' });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingVendor(null);
    setFormData({ name: '', category: '', region: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.region.trim()) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      const data = { ...formData, projectId: selectedProjectId };
      if (editingVendor) {
        await updateVendor.mutateAsync({ id: editingVendor.id, ...data });
      } else {
        await createVendor.mutateAsync(data);
      }
      closeModal();
      refetch();
    } catch (error) {
      Alert.alert('오류', '저장 실패: ' + error.message);
    }
  };

  const handleDelete = (vendor) => {
    Alert.alert(
      '삭제 확인',
      `${vendor.name}을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendor.mutateAsync(vendor.id);
              refetch();
            } catch (error) {
              Alert.alert('오류', '삭제 실패: ' + error.message);
            }
          },
        },
      ]
    );
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
        <Text style={styles.error}>업체 조회 실패: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProjectSelector />

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.category} • {item.region}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
                <Edit size={20} color="#6B5B55" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                <Trash2 size={20} color="#C9716A" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 업체가 없습니다.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingVendor ? '업체 수정' : '업체 추가'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="업체명"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="카테고리"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="지역"
              value={formData.region}
              onChangeText={(text) => setFormData({ ...formData, region: text })}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#F2EDE8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemMeta: { fontSize: 14, color: '#666' },
  itemActions: { flexDirection: 'row' },
  actionButton: { padding: 8 },

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
