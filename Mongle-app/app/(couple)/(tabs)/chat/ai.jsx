import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAi } from '../../../../hooks/useAi';
import ChatInput from '../../../../components/chat/ChatInput';
import MessageBubble from '../../../../components/chat/MessageBubble';

const QUICK_START_CHIPS = [
  '스튜디오 추천해줘',
  '예산 300만원 드레스',
  '플래너 추천해줘',
];

function WelcomeView({ onChipPress }) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="sparkles" size={32} color="#fff" />
      </View>
      <Text style={styles.welcomeTitle}>웨딩 AI 어시스턴트</Text>
      <Text style={styles.welcomeSubtitle}>
        스튜디오, 드레스, 웨딩홀, 플래너 등{'\n'}예산과 스타일에 맞는 업체를 추천해드려요
      </Text>
      <View style={styles.chipsRow}>
        {QUICK_START_CHIPS.map(chip => (
          <TouchableOpacity
            key={chip}
            style={styles.chip}
            onPress={() => onChipPress(chip)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function AiChatScreen() {
  const [inputText, setInputText] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages } = useAi();

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const renderItem = ({ item }) => <MessageBubble message={item} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>AI 어시스턴트</Text>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearMessages}
          disabled={messages.length === 0}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={messages.length > 0 ? '#8a7870' : '#e8e0dc'}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 에러 배너 - FlatList 밖에 배치해야 텍스트 미러링 없음 */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#c0392b" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 메시지가 없을 때 웰컴 뷰, 있을 때 FlatList */}
        {messages.length === 0 ? (
          <View style={styles.emptyArea}>
            <WelcomeView onChipPress={sendMessage} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            inverted
          />
        )}

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSubmit={handleSend}
          disabled={isLoading}
          placeholder="웨딩 관련 질문을 입력하세요..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fcfaf9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ee',
  },
  backBtn: { padding: 8 },
  clearBtn: { padding: 8 },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  emptyArea: {
    flex: 1,
    justifyContent: 'center',
  },
  messageList: {
    padding: 16,
    gap: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3a2e2a',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#8a7870',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c9a98e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#c9a98e',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0ee',
    borderRadius: 8,
    padding: 10,
    margin: 12,
    marginBottom: 0,
  },
  errorText: {
    fontSize: 13,
    color: '#c0392b',
    flex: 1,
  },
});
