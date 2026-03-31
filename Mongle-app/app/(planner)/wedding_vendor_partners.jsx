import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ── 상수 ─────────────────────────────────────────────────
const VENDOR_TYPES = [
  '전체',
  '스튜디오',
  '드레스',
  '메이크업',
  '웨딩홀',
  '허니문',
  '청첩장',
  '영상·스냅',
  '기타',
];

const STATUS_STYLE = {
  '계약 완료': { color: '#3B6D11', bg: '#eaf3de' },
  '피팅 조율': { color: '#854F0B', bg: '#faeeda' },
  '잔금 미납': { color: '#c97b6e', bg: '#fff5f3' },
  '견적 협의': { color: '#185FA5', bg: '#e6f1fb' },
  '발주 완료': { color: '#3B6D11', bg: '#eaf3de' },
  '미팅 예정': { color: '#534AB7', bg: '#eeedfe' },
  '계약 검토': { color: '#854F0B', bg: '#faeeda' },
  '촬영 완료': { color: '#3B6D11', bg: '#eaf3de' },
};

const STATUS_OPTIONS = [
  '계약 완료',
  '피팅 조율',
  '잔금 미납',
  '견적 협의',
  '발주 완료',
  '미팅 예정',
  '계약 검토',
  '촬영 완료',
];

const EMPTY_FORM = {
  name: '',
  type: '스튜디오',
  contact: '',
  manager: '',
  status: '견적 협의',
  memo: '',
};

export default function WeddingVendorPartners() {
  const { planner_id } = useAuth();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeType, setActiveType] = useState(0);

  // 추가 모달
  const [addVisible, setAddVisible] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState('');

  // 상세/수정 모달
  const [detailVisible, setDetailVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');

  // ── 데이터 로드 + Realtime ─────────────────────────────
  useEffect(() => {
    if (!planner_id) return;
    fetchVendors();

    const channel = supabase
      .channel(`vendors-${planner_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planner_vendors',
          filter: `planner_id=eq.${planner_id}`,
        },
        fetchVendors,
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [planner_id]);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('planner_vendors')
      .select('id, name, type, contact, manager, status, memo')
      .eq('planner_id', planner_id)
      .order('created_at', { ascending: false });
    if (!error && data) setVendors(data);
    setLoading(false);
  };

  // ── 추가 ──
  const openAdd = () => {
    setAddForm(EMPTY_FORM);
    setAddError('');
    setAddVisible(true);
  };
  const closeAdd = () => {
    setAddVisible(false);
    setAddError('');
  };
  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      setAddError('업체명을 입력해주세요.');
      return;
    }
    const { error } = await supabase.from('planner_vendors').insert({
      planner_id: planner_id,
      name: addForm.name.trim(),
      type: addForm.type,
      contact: addForm.contact.trim(),
      manager: addForm.manager.trim(),
      status: addForm.status,
      memo: addForm.memo.trim(),
    });
    if (error) {
      setAddError('추가 중 오류가 발생했습니다.');
      return;
    }
    closeAdd(); // Realtime이 자동 갱신
  };

  // ── 상세/수정 ──
  const openDetail = (v) => {
    setSelected(v);
    setIsEditing(false);
    setDetailVisible(true);
  };
  const closeDetail = () => {
    setDetailVisible(false);
    setIsEditing(false);
    setEditError('');
  };
  const startEdit = () => {
    setEditForm({
      name: selected.name,
      type: selected.type,
      contact: selected.contact,
      manager: selected.manager,
      status: selected.status,
      memo: selected.memo,
    });
    setEditError('');
    setIsEditing(true);
  };
  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      setEditError('업체명을 입력해주세요.');
      return;
    }
    const { error } = await supabase
      .from('planner_vendors')
      .update({
        name: editForm.name.trim(),
        type: editForm.type,
        contact: editForm.contact.trim(),
        manager: editForm.manager.trim(),
        status: editForm.status,
        memo: editForm.memo.trim(),
      })
      .eq('id', selected.id);
    if (error) {
      setEditError('수정 중 오류가 발생했습니다.');
      return;
    }
    setSelected((prev) => ({ ...prev, ...editForm, name: editForm.name.trim() }));
    setIsEditing(false);
    // Realtime이 목록 자동 갱신
  };
  const handleDelete = () => {
    Alert.alert('업체 삭제', `${selected.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('planner_vendors').delete().eq('id', selected.id);
          closeDetail();
          // Realtime이 자동 갱신
        },
      },
    ]);
  };

  // ── 필터링 ──
  const filtered = vendors.filter((v) => {
    const ms =
      searchText.trim() === '' ||
      (v.name ?? '').includes(searchText) ||
      (v.manager ?? '').includes(searchText);
    const mt = activeType === 0 ? true : v.type === VENDOR_TYPES[activeType];
    return ms && mt;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#c97b6e" style={{ marginTop: 120 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf8f5" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#8b5e52" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>협력 업체</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#8b5e52" />
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#c8bdb8" />
          <TextInput
            style={styles.searchInput}
            placeholder="업체명, 담당자 검색"
            placeholderTextColor="#c8bdb8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={15} color="#c8bdb8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 업체 유형 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.typeFilterRow}
      >
        {VENDOR_TYPES.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, i === activeType && styles.typeChipActive]}
            onPress={() => setActiveType(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeChipText, i === activeType && styles.typeChipTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 건수 */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>총 {filtered.length}개 업체</Text>
      </View>

      {/* 업체 리스트 */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listArea}>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="business-outline" size={48} color="#d8ccc6" />
            <Text style={styles.emptyText}>검색 결과가 없어요</Text>
          </View>
        ) : (
          filtered.map((v) => {
            const ss = STATUS_STYLE[v.status] ?? { color: '#8a7870', bg: '#f5f0f0' };
            return (
              <TouchableOpacity
                key={v.id}
                style={styles.vendorCard}
                activeOpacity={0.85}
                onPress={() => openDetail(v)}
              >
                <View style={styles.cardTop}>
                  {/* 유형 아이콘 자리 */}
                  <View style={styles.typeIcon}>
                    <Text style={styles.typeIconText}>{v.type[0]}</Text>
                  </View>
                  <View style={styles.vendorInfo}>
                    <View style={styles.vendorNameRow}>
                      <Text style={styles.vendorName}>{v.name}</Text>
                      <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                        <Text style={[styles.statusText, { color: ss.color }]}>{v.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.vendorType}>{v.type}</Text>
                    {v.memo !== '' && (
                      <Text style={styles.vendorMemo} numberOfLines={1}>
                        {v.memo}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <Ionicons name="person-outline" size={12} color="#c8bdb8" />
                  <Text style={styles.cardBottomText}>{v.manager || '담당자 없음'}</Text>
                  <Ionicons
                    name="call-outline"
                    size={12}
                    color="#c8bdb8"
                    style={{ marginLeft: 12 }}
                  />
                  <Text style={styles.cardBottomText}>{v.contact || '-'}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#d8ccc6"
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ══════════ 추가 모달 ══════════ */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={closeAdd}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeAdd} />
          <View style={[styles.modalSheet, { flex: 1 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>업체 추가</Text>
              <TouchableOpacity onPress={closeAdd} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#a08880" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VendorForm form={addForm} setForm={setAddForm} setError={setAddError} />
              {addError !== '' && <ErrorBox msg={addError} />}
              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>추가하기</Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════ 상세/수정 모달 ══════════ */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={closeDetail}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDetail} />
          <View style={[styles.modalSheet, { flex: 1 }]}>
            <View style={styles.modalHandle} />
            {selected &&
              (() => {
                const ss = STATUS_STYLE[selected.status] ?? { color: '#8a7870', bg: '#f5f0f0' };
                return (
                  <>
                    <View style={styles.modalHeader}>
                      {isEditing ? (
                        <>
                          <TouchableOpacity onPress={() => setIsEditing(false)} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={20} color="#a08880" />
                          </TouchableOpacity>
                          <Text style={styles.modalTitle}>업체 수정</Text>
                          <TouchableOpacity onPress={closeDetail} activeOpacity={0.7}>
                            <Ionicons name="close" size={20} color="#a08880" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Text style={styles.modalTitle}>업체 상세</Text>
                          <View style={styles.detailHeaderBtns}>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={startEdit}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="pencil-outline" size={15} color="#8b5e52" />
                              <Text style={styles.editBtnText}>수정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={handleDelete}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={15} color="#e87070" />
                              <Text style={styles.deleteBtnText}>삭제</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {isEditing ? (
                        <>
                          <VendorForm
                            form={editForm}
                            setForm={setEditForm}
                            setError={setEditError}
                          />
                          {editError !== '' && <ErrorBox msg={editError} />}
                          <TouchableOpacity
                            style={styles.saveBtn}
                            activeOpacity={0.8}
                            onPress={handleUpdate}
                          >
                            <Text style={styles.saveBtnText}>수정 완료</Text>
                          </TouchableOpacity>
                          <View style={{ height: 16 }} />
                        </>
                      ) : (
                        <>
                          {/* 상세 히어로 */}
                          <View style={styles.detailHero}>
                            <View style={styles.detailTypeIcon}>
                              <Text style={styles.detailTypeIconText}>{selected.type[0]}</Text>
                            </View>
                            <Text style={styles.detailName}>{selected.name}</Text>
                            <Text style={styles.detailTypeBadge}>{selected.type}</Text>
                            <View
                              style={[styles.statusPill, { backgroundColor: ss.bg, marginTop: 8 }]}
                            >
                              <Text style={[styles.statusText, { color: ss.color }]}>
                                {selected.status}
                              </Text>
                            </View>
                          </View>

                          {/* 정보 카드 */}
                          <View style={styles.detailCard}>
                            <DetailRow
                              icon="person-outline"
                              label="담당자"
                              value={selected.manager || '없음'}
                            />
                            <DetailRow
                              icon="call-outline"
                              label="연락처"
                              value={selected.contact || '없음'}
                            />
                            <DetailRow
                              icon="create-outline"
                              label="메모"
                              value={selected.memo || '없음'}
                              isLast
                            />
                          </View>

                          <View style={{ height: 16 }} />
                        </>
                      )}
                    </ScrollView>
                  </>
                );
              })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── 업체 폼 컴포넌트 ─────────────────────────────────────
function VendorForm({ form, setForm, setError }) {
  const f = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError('');
  };
  const TYPES = [
    '스튜디오',
    '드레스',
    '메이크업',
    '웨딩홀',
    '허니문',
    '청첩장',
    '영상·스냅',
    '기타',
  ];
  return (
    <>
      <Text style={styles.fieldLabel}>
        업체명 <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="예) 일다스튜디오"
        placeholderTextColor="#c8bdb8"
        value={form.name}
        onChangeText={(v) => f('name', v)}
      />

      <Text style={styles.fieldLabel}>업체 유형</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chipScrollRow}
      >
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.selectChip, form.type === t && styles.selectChipActive]}
            onPress={() => f('type', t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectChipText, form.type === t && styles.selectChipTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.fieldLabel}>담당자</Text>
      <TextInput
        style={styles.textInput}
        placeholder="예) 김실장"
        placeholderTextColor="#c8bdb8"
        value={form.manager}
        onChangeText={(v) => f('manager', v)}
      />

      <Text style={styles.fieldLabel}>연락처</Text>
      <TextInput
        style={styles.textInput}
        placeholder="예) 02-1234-5678"
        placeholderTextColor="#c8bdb8"
        value={form.contact}
        onChangeText={(v) => f('contact', v)}
        keyboardType="phone-pad"
      />

      <Text style={styles.fieldLabel}>계약 상태</Text>
      <View style={styles.statusSelectGrid}>
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.selectChip, form.status === s && styles.selectChipActive]}
            onPress={() => f('status', s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectChipText, form.status === s && styles.selectChipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>메모</Text>
      <TextInput
        style={[styles.textInput, styles.textInputMemo]}
        placeholder="업체 특이사항, 스타일 등"
        placeholderTextColor="#c8bdb8"
        value={form.memo}
        onChangeText={(v) => f('memo', v)}
        multiline
      />
    </>
  );
}

function ErrorBox({ msg }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={13} color="#e87070" />
      <Text style={styles.errorText}>{msg}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, isLast }) {
  return (
    <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={15} color="#c8bdb8" style={{ marginTop: 1 }} />
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
    </View>
  );
}

// ── 스타일 ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8f5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#3a2e2a' },

  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ede5de',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#3a2e2a', paddingVertical: 0 },

  typeFilterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    backgroundColor: '#fff',
  },
  typeChipActive: { backgroundColor: '#3a2e2a', borderColor: '#3a2e2a' },
  typeChipText: { fontSize: 12, color: '#8a7870' },
  typeChipTextActive: { color: '#fff', fontWeight: '500' },

  countRow: { paddingHorizontal: 20, paddingBottom: 10 },
  countText: { fontSize: 12, color: '#a08880' },

  listArea: { flex: 1 },

  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  typeIconText: { fontSize: 18, color: '#8b5e52' },
  vendorInfo: { flex: 1 },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  vendorName: { fontSize: 14, fontWeight: '600', color: '#3a2e2a', flex: 1, marginRight: 8 },
  vendorType: { fontSize: 11, color: '#a08880', marginBottom: 3 },
  vendorMemo: { fontSize: 11, color: '#c8bdb8' },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#f5f0eb',
    paddingTop: 10,
  },
  cardBottomText: { fontSize: 12, color: '#a08880' },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: '#b8aca8' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(58,46,42,0.4)' },
  modalSheet: {
    backgroundColor: '#faf8f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8ccc6',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#3a2e2a' },

  detailHeaderBtns: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editBtnText: { fontSize: 13, color: '#8b5e52', fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#f0cece',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteBtnText: { fontSize: 13, color: '#e87070', fontWeight: '500' },

  detailHero: { alignItems: 'center', paddingVertical: 20 },
  detailTypeIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F5F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTypeIconText: { fontSize: 32, color: '#8b5e52' },
  detailName: { fontSize: 18, fontWeight: '600', color: '#3a2e2a', marginBottom: 4 },
  detailTypeBadge: { fontSize: 13, color: '#a08880' },

  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f0eb',
  },
  detailRowLabel: { fontSize: 13, color: '#a08880', width: 52 },
  detailRowValue: { fontSize: 13, color: '#3a2e2a', fontWeight: '500', flex: 1 },

  fieldLabel: { fontSize: 12, fontWeight: '500', color: '#a08880', marginBottom: 8 },
  required: { color: '#e87070' },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ede5de',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#3a2e2a',
    marginBottom: 16,
  },
  textInputMemo: { minHeight: 80, textAlignVertical: 'top' },

  chipScrollRow: { flexDirection: 'row', gap: 8, paddingBottom: 16 },
  statusSelectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    backgroundColor: '#fff',
  },
  selectChipActive: { backgroundColor: '#3a2e2a', borderColor: '#3a2e2a' },
  selectChipText: { fontSize: 13, color: '#8a7870' },
  selectChipTextActive: { color: '#fff', fontWeight: '500' },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#f0cece',
    padding: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, color: '#e87070' },

  saveBtn: {
    backgroundColor: '#3a2e2a',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
