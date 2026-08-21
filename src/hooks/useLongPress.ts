import { useRef, useCallback } from 'react';

export function useLongPress(callback: () => void, delay = 150) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    callback();
    intervalRef.current = setInterval(callback, delay);
  }, [callback, delay]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { onPressIn: start, onPressOut: stop };
}
