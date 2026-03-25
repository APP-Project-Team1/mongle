import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../lib/api';

const MAX_HISTORY = 10;
const VENDOR_DELIMITER = '\n---VENDORS_JSON---\n';

function parseResponse(fullText) {
  const parts = fullText.split(VENDOR_DELIMITER);
  if (parts.length < 2) return { displayText: fullText, vendors: [] };
  try {
    const vendors = JSON.parse(parts[1]);
    return { displayText: parts[0], vendors: Array.isArray(vendors) ? vendors : [] };
  } catch {
    return { displayText: parts[0], vendors: [] };
  }
}

export function useAi() {
  // FlatList inverted 기준: index 0 = 최신 메시지
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    if (isLoading || !text.trim()) return;

    // 최근 N개 → 시간순(오래된 것 먼저)으로 OpenAI 포맷 변환
    const history = [...messages]
      .slice(0, MAX_HISTORY)
      .reverse()
      .map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.displayText || m.text || '',
      }));

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      displayText: text.trim(),
      isStreaming: false,
      vendors: [],
    };

    const aiMsgId = `ai-${Date.now() + 1}`;
    const aiMsgPlaceholder = {
      id: aiMsgId,
      role: 'ai',
      text: '',
      displayText: '',
      isStreaming: true,
      vendors: [],
    };

    setMessages(prev => [aiMsgPlaceholder, userMsg, ...prev]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, text: accumulated, displayText: accumulated }
              : m
          )
        );
      }

      const { displayText, vendors } = parseResponse(accumulated);
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, text: accumulated, displayText, vendors, isStreaming: false }
            : m
        )
      );
    } catch (err) {
      setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
      setMessages(prev => prev.filter(m => m.id !== aiMsgId));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
