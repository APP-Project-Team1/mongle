import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';

// ── DB 필드 접근 헬퍼 ─────────────────────────────────────
const ICON_BY_TYPE = {
  info_consultation: 'calendar-outline',
  info_wedding: 'heart-outline',
  info_message: 'chatbubble-outline',
  info_payment: 'card-outline',
};

function getIcon(n) { return n.icon || ICON_BY_TYPE[n.type] || 'notifications-outline'; }
function getIconColor(n) { return n.icon_color ?? '#c97b6e'; }
function getIconBg(n) { return n.icon_bg ?? '#fdf4f3'; }
function getIsRead(n) { return n.is_read; }
function getTime(n) {
  if (!n.created_at) return '';
  return new Date(n.created_at).toLocaleString('ko-KR', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotif } = useNotifications();
  const [selectedNotif, setSelectedNotif] = useState(null);
  const detailSlideAnim = useRef(new Animated.Value(300)).current;

  const openDetail = (notif) => {
    setSelectedNotif(notif);
    markAsRead(notif.id); // ← Context 함수로 읽음 처리
    detailSlideAnim.setValue(300);
    Animated.spring(detailSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeDetail = () => {
    Animated.timing(detailSlideAnim, {
      toValue: 300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedNotif(null));
  };

  const handleDelete = (id) => {
    closeDetail();
    setTimeout(() => {
      deleteNotif(id); // ← Context 함수로 삭제
    }, 230);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf8f5" />

      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#8b5e52" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>모두 읽음</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllBtn} />
        )}
      </View>

      {/* ── 알림 목록 ── */}
      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={48} color="#d8ccc6" />
          <Text style={styles.emptyText}>알림이 없습니다</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {/* 읽지 않은 알림 */}
          {notifications.some((n) => !getIsRead(n)) && (
            <>
              <Text style={styles.sectionLabel}>읽지 않은 알림</Text>
              {notifications
                .filter((n) => !getIsRead(n))
                .map((n, idx, arr) => (
                  <NotifItem
                    key={n.id}
                    item={n}
                    isLast={idx === arr.length - 1}
                    onPress={() => openDetail(n)}
                  />
                ))}
            </>
          )}

          {/* 읽은 알림 */}
          {notifications.some((n) => getIsRead(n)) && (
            <>
              <Text style={styles.sectionLabel}>읽은 알림</Text>
              {notifications
                .filter((n) => getIsRead(n))
                .map((n, idx, arr) => (
                  <NotifItem
                    key={n.id}
                    item={n}
                    isLast={idx === arr.length - 1}
                    onPress={() => openDetail(n)}
                  />
                ))}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── 알림 상세 모달 ── */}
      <Modal
        visible={!!selectedNotif}
        animationType="none"
        transparent
        onRequestClose={closeDetail}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDetail}>
          <Animated.View
            style={[styles.detailSheet, { transform: [{ translateY: detailSlideAnim }] }]}
          >
            <Pressable onPress={() => { }}>
              {/* 핸들 바 */}
              <View style={styles.sheetHandle} />

              {/* 상세 헤더 */}
              <View style={styles.detailHeader}>
                <TouchableOpacity
                  onPress={closeDetail}
                  activeOpacity={0.7}
                  style={styles.detailBackBtn}
                >
                  <Ionicons name="chevron-back" size={18} color="#776d6a" />
                  <Text style={styles.detailBackText}>알림 목록</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeDetail} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#776d6a" />
                </TouchableOpacity>
              </View>

              {/* 상세 내용 */}
              {selectedNotif && (
                <View style={styles.detailBody}>
                  {/* 아이콘 + 제목 */}
                  <View style={styles.detailTitleRow}>
                    <View
                      style={[styles.detailIconWrap, { backgroundColor: getIconBg(selectedNotif) }]}
                    >
                      <Ionicons
                        name={getIcon(selectedNotif)}
                        size={22}
                        color={getIconColor(selectedNotif)}
                      />
                    </View>
                    <Text style={styles.detailTitle}>{selectedNotif.title}</Text>
                  </View>

                  {/* 시간 */}
                  <Text style={styles.detailTime}>{getTime(selectedNotif)}</Text>

                  {/* 구분선 */}
                  <View style={styles.detailDivider} />

                  {/* 본문 */}
                  <Text style={styles.detailContent}>{selectedNotif.body}</Text>

                  {/* 삭제 버튼 */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.8}
                    onPress={() => handleDelete(selectedNotif.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#c97b6e" />
                    <Text style={styles.deleteBtnText}>알림 삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── 알림 아이템 컴포넌트 ──────────────────────────────────
function NotifItem({ item, isLast, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.notifItem, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: getIconBg(item) }]}>
        <Ionicons name={getIcon(item)} size={18} color={getIconColor(item)} />
      </View>
      <View style={styles.notifBody}>
        <View style={styles.notifTitleRow}>
          <Text
            style={[styles.notifItemTitle, !getIsRead(item) && styles.notifItemTitleBold]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!getIsRead(item) && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBodyText} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notifTime}>{getTime(item)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#c8beba" style={{ marginTop: 2 }} />
    </TouchableOpacity>
  );
}

// ── 스타일 ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  markAllBtn: {
    width: 64,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 13,
    color: '#c97b6e',
    fontWeight: '500',
  },

  // 목록
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#a08880',
    marginBottom: 8,
    marginTop: 4,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0e8e3',
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifBody: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  notifItemTitle: {
    fontSize: 13,
    color: '#3a2e2a',
    flex: 1,
  },
  notifItemTitleBold: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#c97b6e',
    flexShrink: 0,
  },
  notifBodyText: {
    fontSize: 12,
    color: '#776d6a',
    lineHeight: 17,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: '#a08880',
  },

  // 빈 상태
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#a08880',
  },

  // 상세 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#faf8f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8ccc6',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ede5de',
  },
  detailBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailBackText: {
    fontSize: 13,
    color: '#776d6a',
    fontWeight: '500',
  },
  detailBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  detailIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2e2a',
    flex: 1,
    lineHeight: 22,
  },
  detailTime: {
    fontSize: 12,
    color: '#a08880',
    marginBottom: 16,
    marginLeft: 56,
  },
  detailDivider: {
    height: 0.5,
    backgroundColor: '#ede5de',
    marginBottom: 16,
  },
  detailContent: {
    fontSize: 14,
    color: '#4a3e3a',
    lineHeight: 22,
    marginBottom: 28,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e8c8c4',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fdf4f3',
  },
  deleteBtnText: {
    fontSize: 14,
    color: '#c97b6e',
    fontWeight: '500',
  },
});