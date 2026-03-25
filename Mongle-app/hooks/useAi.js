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

// 스트리밍 중에도 구분자 이전 텍스트만 표시
function extractDisplayText(accumulated) {
  const delimIdx = accumulated.indexOf(VENDOR_DELIMITER);
  return delimIdx >= 0 ? accumulated.slice(0, delimIdx) : accumulated;
}

// React Native에서 response.body.getReader()가 미지원 → XMLHttpRequest로 스트리밍
function streamXHR(url, body, onChunk, onDone, onError) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json');

  let lastLength = 0;

  xhr.onprogress = () => {
    const full = xhr.responseText;
    if (full.length > lastLength) {
      lastLength = full.length;
      onChunk(full);
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      onDone(xhr.responseText);
    } else {
      onError(new Error(`서버 오류 (${xhr.status})`));
    }
  };

  xhr.onerror = () => onError(new Error('네트워크 오류가 발생했습니다.'));
  xhr.ontimeout = () => onError(new Error('응답 시간이 초과되었습니다.'));
  xhr.timeout = 60000;

  xhr.send(JSON.stringify(body));
  return xhr;
}

export function useAi() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback((text) => {
    if (isLoading || !text.trim()) return;

    // 히스토리: displayText(clean)만 사용, vendor JSON 오염 방지
    const history = [...messages]
      .slice(0, MAX_HISTORY)
      .reverse()
      .map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.displayText || '',
      }))
      .filter(m => m.content.trim().length > 0);

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

    streamXHR(
      API_ENDPOINTS.chat,
      { message: text.trim(), history },
      // onChunk: 스트리밍 중 — 구분자 이전 텍스트만 표시
      (accumulated) => {
        const displayText = extractDisplayText(accumulated);
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, text: accumulated, displayText }
              : m
          )
        );
      },
      // onDone: 완료 후 업체 파싱
      (fullText) => {
        const { displayText, vendors } = parseResponse(fullText);
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, text: fullText, displayText, vendors, isStreaming: false }
              : m
          )
        );
        setIsLoading(false);
      },
      // onError
      (err) => {
        setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
        setMessages(prev => prev.filter(m => m.id !== aiMsgId));
        setIsLoading(false);
      }
    );
  }, [isLoading, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
