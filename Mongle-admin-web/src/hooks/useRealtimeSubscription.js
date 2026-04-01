import { useEffect, useRef } from 'react';

export function useRealtimeSubscription(createSubscription, deps = []) {
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const cleanup = createSubscription?.();

    if (typeof cleanup === 'function') {
      cleanupRef.current = cleanup;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}