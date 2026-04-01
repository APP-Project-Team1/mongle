export function getApiErrorMessage(error, fallback = '요청 처리 중 오류가 발생했습니다.') {
  if (!error) return fallback;

  const responseData = error.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.detail) {
    if (typeof responseData.detail === 'string') return responseData.detail;
    if (Array.isArray(responseData.detail)) {
      return responseData.detail.map((item) => item.msg || item.message || '입력 오류').join(', ');
    }
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}