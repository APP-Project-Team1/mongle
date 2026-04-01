export function createSSEClient({ url, token, onMessage, onError, onOpen }) {
  let eventSource = null;

  const connect = () => {
    const finalUrl = token
      ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
      : url;

    eventSource = new EventSource(finalUrl);

    eventSource.onopen = () => {
      if (onOpen) onOpen();
    };

    eventSource.onmessage = (event) => {
      if (!onMessage) return;

      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch {
        onMessage(event.data);
      }
    };

    eventSource.onerror = (error) => {
      if (onError) onError(error);
      if (eventSource) {
        eventSource.close();
      }
    };

    return eventSource;
  };

  const close = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  return {
    connect,
    close,
    get instance() {
      return eventSource;
    },
  };
}