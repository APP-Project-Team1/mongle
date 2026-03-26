import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ── 유틸 ─────────────────────────────────────────────────
const fmt = (n) => (n / 10000).toLocaleString() + '만원';
const pct = (r, t) => (t === 0 ? 0 : Math.round((r / t) * 100));
const numOnly = (s) => s.replace(/[^0-9]/g, '');

// ── 초기 데이터 ──────────────────────────────────────────
const INIT_COUPLES = [
  {
    id: 'c1',
    name: '박지수 · 이현우',
    total: 38000000,
    received: 31500000,
    due: '4월 1일',
    payments: [
      { id: 'p1', label: '계약금', amount: 10000000, date: '2025년 11월 3일', paid: true },
      { id: 'p2', label: '중도금', amount: 15000000, date: '2026년 2월 10일', paid: true },
      { id: 'p3', label: '잔금', amount: 13000000, date: '2026년 4월 1일', paid: false },
    ],
    vendorCosts: [
      { id: 'v1', vendor: '일다스튜디오', amount: 5000000, paid: true },
      { id: 'v2', vendor: '르블랑 웨딩', amount: 8000000, paid: false },
      { id: 'v3', vendor: '더채플 청담', amount: 9000000, paid: false },
    ],
  },
  {
    id: 'c2',
    name: '최민정 · 강태준',
    total: 42000000,
    received: 21000000,
    due: '4월 8일',
    payments: [
      { id: 'p1', label: '계약금', amount: 10000000, date: '2025년 12월 5일', paid: true },
      { id: 'p2', label: '중도금', amount: 11000000, date: '2026년 2월 20일', paid: true },
      { id: 'p3', label: '중도금2', amount: 10000000, date: '2026년 4월 8일', paid: false },
      { id: 'p4', label: '잔금', amount: 11000000, date: '2026년 4월 8일', paid: false },
    ],
    vendorCosts: [
      { id: 'v1', vendor: '일다스튜디오', amount: 5500000, paid: true },
      { id: 'v2', vendor: '뷰티스튜디오K', amount: 3000000, paid: false },
      { id: 'v3', vendor: '롯데호텔 잠실', amount: 12000000, paid: false },
    ],
  },
  {
    id: 'c3',
    name: '윤서연 · 오민석',
    total: 35000000,
    received: 35000000,
    due: null,
    payments: [
      { id: 'p1', label: '계약금', amount: 10000000, date: '2026년 1월 8일', paid: true },
      { id: 'p2', label: '중도금', amount: 15000000, date: '2026년 3월 1일', paid: true },
      { id: 'p3', label: '잔금', amount: 10000000, date: '2026년 4월 20일', paid: true },
    ],
    vendorCosts: [
      { id: 'v1', vendor: '모먼트 스냅', amount: 4000000, paid: true },
      { id: 'v2', vendor: '그랜드 인터컨티', amount: 10000000, paid: true },
    ],
  },
  {
    id: 'c4',
    name: '정하린 · 김도윤',
    total: 28000000,
    received: 7000000,
    due: '5월 10일',
    payments: [
      { id: 'p1', label: '계약금', amount: 7000000, date: '2026년 2월 15일', paid: true },
      { id: 'p2', label: '중도금', amount: 11000000, date: '2026년 5월 10일', paid: false },
      { id: 'p3', label: '잔금', amount: 10000000, date: '2026년 5월 25일', paid: false },
    ],
    vendorCosts: [
      { id: 'v1', vendor: '페이퍼가든', amount: 800000, paid: false },
      { id: 'v2', vendor: '더베뉴 한남', amount: 8000000, paid: false },
    ],
  },
];

const TABS = ['수금 현황', '업체 지출'];

// ── 빈 폼 ────────────────────────────────────────────────
const EMPTY_RECV = { coupleId: '', label: '', amount: '', date: '', paid: false };
const EMPTY_VEND = { vendor: '', coupleId: '', amount: '', paid: false };
const EMPTY_COUPLE = { name: '', total: '', due: '' };

export default function PlannerBudget() {
  const [couples, setCouples] = useState(INIT_COUPLES);
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState(null);

  // 통합 추가 모달 ('recv' | 'vend' | null)
  const [addModal, setAddModal] = useState(false);
  const [addType, setAddType] = useState('recv'); // 'recv' | 'vend'
  const [recvForm, setRecvForm] = useState(EMPTY_RECV);
  const [recvError, setRecvError] = useState('');
  const [vendForm, setVendForm] = useState(EMPTY_VEND);
  const [vendError, setVendError] = useState('');

  // 커플 추가 모달
  const [coupleModal, setCoupleModal] = useState(false);
  const [coupleForm, setCoupleForm] = useState(EMPTY_COUPLE);
  const [coupleError, setCoupleError] = useState('');

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  // ── 파생 계산 ──
  const totalReceived = couples.reduce((s, c) => s + c.received, 0);
  const totalUnpaid = couples.reduce((s, c) => s + (c.total - c.received), 0);
  const totalVendorUnpaid = couples.reduce(
    (s, c) => s + c.vendorCosts.filter((v) => !v.paid).reduce((a, v) => a + v.amount, 0),
    0,
  );

  const vendorGroups = useMemo(() => {
    const map = {};
    couples.forEach((c) => {
      c.vendorCosts.forEach((v) => {
        if (!map[v.vendor]) map[v.vendor] = { vendor: v.vendor, entries: [] };
        map[v.vendor].entries.push({
          couple: c.name,
          coupleId: c.id,
          amount: v.amount,
          paid: v.paid,
          id: v.id,
        });
      });
    });
    return Object.values(map)
      .map((g) => ({
        ...g,
        totalAmount: g.entries.reduce((s, e) => s + e.amount, 0),
        unpaidAmount: g.entries.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0),
        unpaidCount: g.entries.filter((e) => !e.paid).length,
      }))
      .sort((a, b) => b.unpaidAmount - a.unpaidAmount);
  }, [couples]);

  // ── 수금 항목 추가 ──
  const handleAddRecv = () => {
    if (!recvForm.coupleId) {
      setRecvError('커플을 선택해주세요.');
      return;
    }
    if (!recvForm.label.trim()) {
      setRecvError('항목명을 입력해주세요.');
      return;
    }
    if (!recvForm.amount) {
      setRecvError('금액을 입력해주세요.');
      return;
    }
    const amt = parseInt(recvForm.amount) * 10000;
    setCouples((prev) =>
      prev.map((c) =>
        c.id !== recvForm.coupleId
          ? c
          : {
              ...c,
              total: c.total + amt,
              payments: [
                ...c.payments,
                {
                  id: `p${Date.now()}`,
                  label: recvForm.label.trim(),
                  amount: amt,
                  date: recvForm.date.trim() || '-',
                  paid: recvForm.paid,
                },
              ],
              ...(recvForm.paid && { received: c.received + amt }),
            },
      ),
    );
    setAddModal(false);
    setRecvForm(EMPTY_RECV);
    setRecvError('');
  };

  // ── 업체 지출 추가 ──
  const handleAddVend = () => {
    if (!vendForm.vendor.trim()) {
      setVendError('업체명을 입력해주세요.');
      return;
    }
    if (!vendForm.coupleId) {
      setVendError('커플을 선택해주세요.');
      return;
    }
    if (!vendForm.amount) {
      setVendError('금액을 입력해주세요.');
      return;
    }
    const amt = parseInt(vendForm.amount) * 10000;
    setCouples((prev) =>
      prev.map((c) =>
        c.id !== vendForm.coupleId
          ? c
          : {
              ...c,
              vendorCosts: [
                ...c.vendorCosts,
                {
                  id: `v${Date.now()}`,
                  vendor: vendForm.vendor.trim(),
                  amount: amt,
                  paid: vendForm.paid,
                },
              ],
            },
      ),
    );
    setAddModal(false);
    setVendForm(EMPTY_VEND);
    setVendError('');
  };

  // ── 커플 추가 ──
  const handleAddCouple = () => {
    if (!coupleForm.name.trim()) {
      setCoupleError('커플 이름을 입력해주세요.');
      return;
    }
    if (!coupleForm.total) {
      setCoupleError('총 계약금액을 입력해주세요.');
      return;
    }
    setCouples((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        name: coupleForm.name.trim(),
        total: parseInt(coupleForm.total) * 10000,
        received: 0,
        due: coupleForm.due.trim() || null,
        payments: [],
        vendorCosts: [],
      },
    ]);
    setCoupleModal(false);
    setCoupleForm(EMPTY_COUPLE);
    setCoupleError('');
  };

  // ── 통합 추가 버튼 ──
  const openAddModal = () => {
    setRecvForm(EMPTY_RECV);
    setRecvError('');
    setVendForm(EMPTY_VEND);
    setVendError('');
    setAddType('recv');
    setAddModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf8f5" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#8b5e52" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>비용 현황</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#8b5e52" />
        </TouchableOpacity>
      </View>

      {/* 요약 KPI */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>수금 총액</Text>
          <Text style={[styles.kpiValue, { color: '#3a2e2a' }]}>{fmt(totalReceived)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>미수금</Text>
          <Text style={[styles.kpiValue, { color: '#c97b6e' }]}>{fmt(totalUnpaid)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>미지급 업체</Text>
          <Text style={[styles.kpiValue, { color: '#b07840' }]}>{fmt(totalVendorUnpaid)}</Text>
        </View>
      </View>

      {/* 탭 + 커플 추가 버튼 */}
      <View style={styles.tabRow}>
        <View style={styles.tabGroup}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, i === activeTab && styles.tabActive]}
              onPress={() => {
                setActiveTab(i);
                setExpanded(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, i === activeTab && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* <TouchableOpacity
          style={styles.addCoupleBtn}
          activeOpacity={0.7}
          onPress={() => {
            setCoupleForm(EMPTY_COUPLE);
            setCoupleError('');
            setCoupleModal(true);
          }}
        >
          <Ionicons name="people-outline" size={13} color="#8b5e52" />
          <Text style={styles.addCoupleBtnText}>커플 추가</Text>
        </TouchableOpacity> */}
      </View>

      {/* 리스트 */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listArea}>
        <View style={styles.section}>
          {/* ── 수금 현황 탭 ── */}
          {activeTab === 0 &&
            couples.map((c) => {
              const isOpen = expanded === c.id;
              const unpaid = c.total - c.received;
              const p = pct(c.received, c.total);
              const isComplete = unpaid === 0;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.coupleCard}
                  activeOpacity={0.85}
                  onPress={() => toggle(c.id)}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.coupleName}>{c.name}</Text>
                        {isComplete ? (
                          <View style={styles.completePill}>
                            <Text style={styles.completePillText}>완납</Text>
                          </View>
                        ) : (
                          <Text style={styles.unpaidAmt}>-{fmt(unpaid)}</Text>
                        )}
                      </View>
                      <View style={styles.progWrap}>
                        <View style={styles.progTrack}>
                          <View
                            style={[
                              styles.progFill,
                              {
                                width: `${p}%`,
                                backgroundColor: isComplete ? '#5a8c3a' : '#c97b6e',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progPct}>{p}%</Text>
                      </View>
                      <Text style={styles.amountSub}>
                        수금 {fmt(c.received)} / 총 {fmt(c.total)}
                      </Text>
                      {!isComplete && c.due && (
                        <Text style={styles.dueText}>{c.due}까지 납부 예정</Text>
                      )}
                    </View>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#c8bdb8"
                      style={{ marginLeft: 10, marginTop: 2 }}
                    />
                  </View>
                  {isOpen && (
                    <View style={styles.payList}>
                      {c.payments.map((pay, idx) => (
                        <View
                          key={`${c.id}-${pay.id}`}
                          style={[
                            styles.payRow,
                            idx === c.payments.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <View style={[styles.payDot, pay.paid && styles.payDotDone]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.payLabel, pay.paid && styles.payLabelDone]}>
                              {pay.label}
                            </Text>
                            <Text style={styles.payDate}>{pay.date}</Text>
                          </View>
                          <Text
                            style={[
                              styles.payAmt,
                              pay.paid ? styles.payAmtDone : styles.payAmtPending,
                            ]}
                          >
                            {fmt(pay.amount)}
                          </Text>
                          {pay.paid && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#5a8c3a"
                              style={{ marginLeft: 8 }}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          {/* ── 업체 지출 탭 ── */}
          {activeTab === 1 &&
            vendorGroups.map((g) => {
              const isOpen = expanded === g.vendor;
              const allPaid = g.unpaidCount === 0;
              return (
                <TouchableOpacity
                  key={g.vendor}
                  style={styles.coupleCard}
                  activeOpacity={0.85}
                  onPress={() => toggle(g.vendor)}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.coupleName}>{g.vendor}</Text>
                        {allPaid ? (
                          <View style={styles.completePill}>
                            <Text style={styles.completePillText}>완료</Text>
                          </View>
                        ) : (
                          <View style={styles.unpaidVendorPill}>
                            <Text style={styles.unpaidVendorPillText}>
                              미지급 {g.unpaidCount}건
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.amountSub}>
                        총 {fmt(g.totalAmount)}
                        {!allPaid && (
                          <Text style={{ color: '#b07840' }}> · 미지급 {fmt(g.unpaidAmount)}</Text>
                        )}
                      </Text>
                    </View>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#c8bdb8"
                      style={{ marginLeft: 10, marginTop: 2 }}
                    />
                  </View>
                  {isOpen && (
                    <View style={styles.payList}>
                      {g.entries.map((e, idx) => (
                        <View
                          key={`${g.vendor}-${e.coupleId}-${e.id}`}
                          style={[
                            styles.payRow,
                            idx === g.entries.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <View style={[styles.payDot, e.paid && styles.payDotDone]} />
                          <Text
                            style={[styles.payLabel, { flex: 1 }, e.paid && styles.payLabelDone]}
                          >
                            {e.couple}
                          </Text>
                          <Text
                            style={[
                              styles.payAmt,
                              e.paid ? styles.payAmtDone : styles.payAmtPending,
                            ]}
                          >
                            {fmt(e.amount)}
                          </Text>
                          {e.paid && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#5a8c3a"
                              style={{ marginLeft: 8 }}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ══════ 통합 추가 모달 ══════ */}
      <Modal
        visible={addModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAddModal(false)}
          />
          <View style={[styles.modalSheet, { flex: 1 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>항목 추가</Text>
              <TouchableOpacity onPress={() => setAddModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#a08880" />
              </TouchableOpacity>
            </View>

            {/* 유형 선택 탭 */}
            <View style={styles.typeTabRow}>
              <TouchableOpacity
                style={[styles.typeTab, addType === 'recv' && styles.typeTabActive]}
                onPress={() => {
                  setAddType('recv');
                  setRecvError('');
                  setVendError('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cash-outline"
                  size={14}
                  color={addType === 'recv' ? '#fff' : '#8a7870'}
                />
                <Text style={[styles.typeTabText, addType === 'recv' && styles.typeTabTextActive]}>
                  수금 항목
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeTab, addType === 'vend' && styles.typeTabActive]}
                onPress={() => {
                  setAddType('vend');
                  setRecvError('');
                  setVendError('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="storefront-outline"
                  size={14}
                  color={addType === 'vend' ? '#fff' : '#8a7870'}
                />
                <Text style={[styles.typeTabText, addType === 'vend' && styles.typeTabTextActive]}>
                  업체 지출
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {addType === 'recv' ? (
                <>
                  {/* 커플 선택 */}
                  <Text style={styles.fieldLabel}>
                    커플 <Text style={styles.required}>*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={styles.chipRow}
                  >
                    {couples.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.selectChip,
                          recvForm.coupleId === c.id && styles.selectChipActive,
                        ]}
                        onPress={() => {
                          setRecvForm((f) => ({ ...f, coupleId: c.id }));
                          setRecvError('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            recvForm.coupleId === c.id && styles.selectChipTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.fieldLabel}>
                    항목명 <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="예) 잔금, 중도금"
                    placeholderTextColor="#c8bdb8"
                    value={recvForm.label}
                    onChangeText={(v) => {
                      setRecvForm((f) => ({ ...f, label: v }));
                      setRecvError('');
                    }}
                  />
                  <Text style={styles.fieldLabel}>
                    금액 (만원) <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.amountInputWrap}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                      placeholder="예) 1300"
                      placeholderTextColor="#c8bdb8"
                      value={recvForm.amount}
                      keyboardType="number-pad"
                      onChangeText={(v) => {
                        setRecvForm((f) => ({ ...f, amount: numOnly(v) }));
                        setRecvError('');
                      }}
                    />
                    <Text style={styles.amountUnit}>만원</Text>
                  </View>
                  <View style={{ height: 16 }} />
                  <Text style={styles.fieldLabel}>납부 예정일</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="예) 2026년 4월 1일"
                    placeholderTextColor="#c8bdb8"
                    value={recvForm.date}
                    onChangeText={(v) => setRecvForm((f) => ({ ...f, date: v }))}
                  />
                  <TouchableOpacity
                    style={styles.toggleRow}
                    activeOpacity={0.7}
                    onPress={() => setRecvForm((f) => ({ ...f, paid: !f.paid }))}
                  >
                    <View style={[styles.toggleBox, recvForm.paid && styles.toggleBoxOn]}>
                      {recvForm.paid && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.toggleText}>이미 수금 완료</Text>
                  </TouchableOpacity>
                  {recvError !== '' && <ErrorBox msg={recvError} />}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    activeOpacity={0.8}
                    onPress={handleAddRecv}
                  >
                    <Text style={styles.saveBtnText}>추가하기</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* 업체명 */}
                  <Text style={styles.fieldLabel}>
                    업체명 <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="예) 일다스튜디오"
                    placeholderTextColor="#c8bdb8"
                    value={vendForm.vendor}
                    onChangeText={(v) => {
                      setVendForm((f) => ({ ...f, vendor: v }));
                      setVendError('');
                    }}
                  />
                  {/* 커플 선택 */}
                  <Text style={styles.fieldLabel}>
                    커플 <Text style={styles.required}>*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={styles.chipRow}
                  >
                    {couples.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.selectChip,
                          vendForm.coupleId === c.id && styles.selectChipActive,
                        ]}
                        onPress={() => {
                          setVendForm((f) => ({ ...f, coupleId: c.id }));
                          setVendError('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            vendForm.coupleId === c.id && styles.selectChipTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.fieldLabel}>
                    금액 (만원) <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.amountInputWrap}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                      placeholder="예) 800"
                      placeholderTextColor="#c8bdb8"
                      value={vendForm.amount}
                      keyboardType="number-pad"
                      onChangeText={(v) => {
                        setVendForm((f) => ({ ...f, amount: numOnly(v) }));
                        setVendError('');
                      }}
                    />
                    <Text style={styles.amountUnit}>만원</Text>
                  </View>
                  <View style={{ height: 16 }} />
                  <TouchableOpacity
                    style={styles.toggleRow}
                    activeOpacity={0.7}
                    onPress={() => setVendForm((f) => ({ ...f, paid: !f.paid }))}
                  >
                    <View style={[styles.toggleBox, vendForm.paid && styles.toggleBoxOn]}>
                      {vendForm.paid && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.toggleText}>이미 지급 완료</Text>
                  </TouchableOpacity>
                  {vendError !== '' && <ErrorBox msg={vendError} />}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    activeOpacity={0.8}
                    onPress={handleAddVend}
                  >
                    <Text style={styles.saveBtnText}>추가하기</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════ 커플 추가 모달 ══════ */}
      <Modal
        visible={coupleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCoupleModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCoupleModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>커플 추가</Text>
              <TouchableOpacity onPress={() => setCoupleModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#a08880" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>
              커플 이름 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="예) 박지수 · 이현우"
              placeholderTextColor="#c8bdb8"
              value={coupleForm.name}
              onChangeText={(v) => {
                setCoupleForm((f) => ({ ...f, name: v }));
                setCoupleError('');
              }}
            />
            <Text style={styles.fieldLabel}>
              총 계약금액 (만원) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputWrap}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder="예) 3800"
                placeholderTextColor="#c8bdb8"
                value={coupleForm.total}
                keyboardType="number-pad"
                onChangeText={(v) => {
                  setCoupleForm((f) => ({ ...f, total: numOnly(v) }));
                  setCoupleError('');
                }}
              />
              <Text style={styles.amountUnit}>만원</Text>
            </View>
            <View style={{ height: 16 }} />
            <Text style={styles.fieldLabel}>첫 납부 기한</Text>
            <TextInput
              style={styles.textInput}
              placeholder="예) 4월 30일"
              placeholderTextColor="#c8bdb8"
              value={coupleForm.due}
              onChangeText={(v) => setCoupleForm((f) => ({ ...f, due: v }))}
            />
            {coupleError !== '' && <ErrorBox msg={coupleError} />}
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleAddCouple}>
              <Text style={styles.saveBtnText}>추가하기</Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
  headerCenter: { flex: 1, alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#3a2e2a' },

  kpiRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  kpiLabel: { fontSize: 10, color: '#a08880' },
  kpiValue: { fontSize: 13, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  tabGroup: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F0F0' },
  tabActive: { backgroundColor: '#3a2e2a' },
  tabText: { fontSize: 13, color: '#8a7870', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  addCoupleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addCoupleBtnText: { fontSize: 12, color: '#8b5e52', fontWeight: '500' },

  listArea: { flex: 1 },
  section: { paddingHorizontal: 20 },

  coupleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  coupleName: { fontSize: 14, fontWeight: '600', color: '#3a2e2a' },
  unpaidAmt: { fontSize: 13, fontWeight: '600', color: '#c97b6e' },
  completePill: {
    backgroundColor: '#eaf3de',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  completePillText: { fontSize: 11, fontWeight: '500', color: '#3B6D11' },
  unpaidVendorPill: {
    backgroundColor: '#fdf6ee',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: '#f0dcc8',
  },
  unpaidVendorPillText: { fontSize: 11, fontWeight: '500', color: '#b07840' },
  progWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  progTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0e8e3',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: { height: '100%', borderRadius: 2 },
  progPct: { fontSize: 11, color: '#a08880', minWidth: 28, textAlign: 'right' },
  amountSub: { fontSize: 11, color: '#a08880' },
  dueText: { fontSize: 11, color: '#b07840', marginTop: 3 },

  payList: {
    borderTopWidth: 0.5,
    borderTopColor: '#f0e8e3',
    paddingHorizontal: 14,
    backgroundColor: '#faf8f5',
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0e8e3',
  },
  payDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f0d8d0',
    borderWidth: 1.5,
    borderColor: '#e8c8c0',
  },
  payDotDone: { backgroundColor: '#9aba7a', borderColor: '#7aaa50' },
  payLabel: { fontSize: 13, fontWeight: '500', color: '#3a2e2a' },
  payLabelDone: { color: '#b8aca8' },
  payDate: { fontSize: 11, color: '#a08880', marginTop: 1 },
  payAmt: { fontSize: 13, fontWeight: '500' },
  payAmtDone: { color: '#b8aca8' },
  payAmtPending: { color: '#c97b6e' },

  // 모달
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
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#3a2e2a' },

  typeTabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F0F0',
  },
  typeTabActive: { backgroundColor: '#3a2e2a' },
  typeTabText: { fontSize: 13, fontWeight: '500', color: '#8a7870' },
  typeTabTextActive: { color: '#fff' },

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

  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 16 },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    backgroundColor: '#fff',
  },
  selectChipActive: { backgroundColor: '#3a2e2a', borderColor: '#3a2e2a' },
  selectChipText: { fontSize: 12, color: '#8a7870' },
  selectChipTextActive: { color: '#fff', fontWeight: '500' },

  amountInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountUnit: { fontSize: 14, color: '#a08880', marginBottom: 0, paddingBottom: 4 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8ccc6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleBoxOn: { backgroundColor: '#c97b6e', borderColor: '#c97b6e' },
  toggleText: { fontSize: 14, color: '#3a2e2a' },

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
