import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../../hooks';
import { useProjectStore } from '../../stores';

const CATEGORY_OPTIONS = ['전체', '식장', '스튜디오', '드레스', '메이크업', '사진', '기타'];

export default function VendorsScreen() {
  const active_id = useProjectStore((state) => state.active_id) || '1';

  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    location: '',
    price_range: '',
    contact_info: '',
    memo: '',
    recommended: false,
  });

  const {
    data: vendors = [],
    isLoading,
    error,
    refetch,
  } = useVendors({ project_id: active_id });

  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();
  const deleteVendorMutation = useDeleteVendor();

  const filteredVendors = useMemo(() => {
    if (selectedCategory === '전체') return vendors;
    return vendors.filter((item) => item.category === selectedCategory);
  }, [vendors, selectedCategory]);

  const recommendedCount = useMemo(() => {
    return vendors.filter((item) => item.recommended || item.is_recommended).length;
  }, [vendors]);

  const openCreateModal = () => {
    setEditingVendor(null);
    setForm({
      name: '',
      category: '',
      location: '',
      price_range: '',
      contact_info: '',
      memo: '',
      recommended: false,
    });
    setModalVisible(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name ?? '',
      category: vendor.category ?? '',
      location: vendor.location ?? '',
      price_range: vendor.price_range ?? '',
      contact_info: vendor.contact_info ?? vendor.contact ?? '',
      memo: vendor.memo ?? '',
      recommended: Boolean(vendor.recommended || vendor.is_recommended),
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingVendor(null);
    setForm({
      name: '',
      category: '',
      location: '',
      price_range: '',
      contact_info: '',
      memo: '',
      recommended: false,
    });
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('입력 확인', '업체명을 입력해주세요.');
      return;
    }

    if (!form.category.trim()) {
      Alert.alert('입력 확인', '카테고리를 입력해주세요.');
      return;
    }

    const payload = {
      project_id: active_id,
      name: form.name.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      price_range: form.price_range.trim(),
      contact_info: { phone: form.contact_info.trim() },
      memo: form.memo.trim(),
      recommended: form.recommended,
    };

    try {
      if (editingVendor) {
        await updateVendorMutation.mutateAsync({
          id: editingVendor.id,
          ...payload,
        });
      } else {
        await createVendorMutation.mutateAsync(payload);
      }

      closeModal();
      refetch();
    } catch (err) {
      Alert.alert('오류', err?.message || '업체 저장에 실패했습니다.');
    }
  };

  const handleDelete = (vendor) => {
    Alert.alert('삭제', '이 업체를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVendorMutation.mutateAsync(vendor.id);
            refetch();
          } catch (err) {
            Alert.alert('오류', err?.message || '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const renderCategoryChip = (category) => {
    const active = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const isRecommended = item.recommended || item.is_recommended;

    return (
      <TouchableOpacity
        style={styles.itemBox}
        activeOpacity={0.9}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.itemLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            {isRecommended && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>추천</Text>
              </View>
            )}
          </View>

          <Text style={styles.itemValue}>
            {item.category || '미분류'}
            {item.price_range ? ` · ${item.price_range}` : ''}
          </Text>

          {!!item.location && (
            <Text style={styles.subText}>위치: {item.location}</Text>
          )}

          {!!item.contact_info && (
            <Text style={styles.subText}>연락처: {typeof item.contact_info === 'object' ? item.contact_info.phone : item.contact_info}</Text>
          )}

          {!!item.memo && (
            <Text style={styles.memoText}>{item.memo}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#C9716A" />
        </TouchableOpacity>
      </TouchableOpacity>
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
        <Text style={styles.error}>업체 데이터를 불러오지 못했습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>업체 관리</Text>
        <Text style={styles.sub}>
          총 {vendors.length}개 · 추천 {recommendedCount}개
        </Text>
      </View>

      <View style={styles.chipRow}>
        {CATEGORY_OPTIONS.map(renderCategoryChip)}
      </View>

      <FlatList
        data={filteredVendors}
        keyExtractor={(item, index) => item.id?.toString() ?? `vendor-${index}`}
        renderItem={renderItem}
        contentContainerStyle={
          filteredVendors.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={40} color="#C4B5AE" />
            <Text style={styles.emptyText}>등록된 업체가 없습니다.</Text>
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
              {editingVendor ? '업체 수정' : '업체 추가'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="업체명"
              value={form.name}
              onChangeText={(text) => handleChange('name', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="카테고리 (예: 식장, 드레스, 스튜디오)"
              value={form.category}
              onChangeText={(text) => handleChange('category', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="위치 (예: 서울 강남구)"
              value={form.location}
              onChangeText={(text) => handleChange('location', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="연락처"
              value={form.contact_info}
              onChangeText={(text) => handleChange('contact_info', text)}
            />

            <TextInput
              style={[styles.input, styles.memoInput]}
              placeholder="메모"
              value={form.memo}
              onChangeText={(text) => handleChange('memo', text)}
              multiline
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>추천 업체로 표시</Text>
              <Switch
                value={form.recommended}
                onValueChange={(value) => handleChange('recommended', value)}
                trackColor={{ false: '#D8CEC8', true: '#E7BBB6' }}
                thumbColor={form.recommended ? '#C9716A' : '#F4F3F4'}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingVendor ? '수정하기' : '저장하기'}
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

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EFE6E1',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#C9716A',
  },
  chipText: {
    fontSize: 13,
    color: '#6B5B55',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2420',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#F6D8D4',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#A3544D',
    fontWeight: '700',
  },
  itemValue: {
    fontSize: 14,
    color: '#6B5B55',
  },
  subText: {
    fontSize: 13,
    color: '#7D706A',
    marginTop: 6,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 15,
    color: '#4B3E39',
    fontWeight: '500',
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