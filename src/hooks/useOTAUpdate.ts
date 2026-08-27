import { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

export interface OTAUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  isChecking: boolean;
  isUpdating: boolean;
  statusMessage: string | null;
  checkForUpdates: () => Promise<void>;
  updateNow: () => Promise<void>;
  dismissNotification: () => void;
}

// Global state holders for multi-component subscription
type Listener = () => void;
let globalNeedRefresh = false;
let globalOfflineReady = false;
let globalIsChecking = false;
let globalIsUpdating = false;
let globalStatusMessage: string | null = null;
const listeners = new Set<Listener>();

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

// Initialize SW registration once
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    updateSWFn = registerSW({
      immediate: true,
      onNeedRefresh() {
        globalNeedRefresh = true;
        globalStatusMessage = 'มีเวอร์ชันใหม่พร้อมใช้งาน!';
        notify();
      },
      onOfflineReady() {
        globalOfflineReady = true;
        notify();
      },
      onRegistered(registration) {
        if (registration) {
          // Check for updates every 15 minutes
          setInterval(() => {
            registration.update().catch(() => {});
          }, 15 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.warn('PWA SW registration error:', error);
      },
    });
  } catch (err) {
    console.warn('Could not initialize registerSW:', err);
  }

  // Check for updates on window visibility focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    }
  });
}

export function useOTAUpdate(): OTAUpdateState {
  const [, setTick] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const listener = () => {
      if (isMounted.current) {
        setTick((t) => t + 1);
      }
    };
    listeners.add(listener);
    return () => {
      isMounted.current = false;
      listeners.delete(listener);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    globalIsChecking = true;
    globalStatusMessage = null;
    notify();

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            globalNeedRefresh = true;
            globalStatusMessage = 'ตรวจพบอัปเดตใหม่! พร้อมติดตั้งทันที';
            globalIsChecking = false;
            notify();
            return;
          }
        }
      }

      // Check if server returns new content
      const res = await fetch(window.location.href, {
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });

      if (res.ok) {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg?.waiting) {
          globalNeedRefresh = true;
          globalStatusMessage = 'ตรวจพบอัปเดตใหม่! พร้อมติดตั้งทันที';
        } else {
          globalStatusMessage = '✓ แอปของคุณเป็นเวอร์ชันล่าสุดแล้ว';
          setTimeout(() => {
            if (globalStatusMessage?.includes('ล่าสุด')) {
              globalStatusMessage = null;
              notify();
            }
          }, 3500);
        }
      }
    } catch (err) {
      console.warn('Error checking OTA update:', err);
      globalStatusMessage = 'ไม่สามารถตรวจสอบการอัปเดตได้ในขณะนี้';
      setTimeout(() => {
        globalStatusMessage = null;
        notify();
      }, 3500);
    } finally {
      globalIsChecking = false;
      notify();
    }
  }, []);

  const updateNow = useCallback(async () => {
    globalIsUpdating = true;
    notify();

    try {
      if (updateSWFn) {
        await updateSWFn(true);
      } else if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.warn('Error updating SW:', err);
      window.location.reload();
    }
  }, []);

  const dismissNotification = useCallback(() => {
    globalNeedRefresh = false;
    globalStatusMessage = null;
    notify();
  }, []);

  return {
    needRefresh: globalNeedRefresh,
    offlineReady: globalOfflineReady,
    isChecking: globalIsChecking,
    isUpdating: globalIsUpdating,
    statusMessage: globalStatusMessage,
    checkForUpdates,
    updateNow,
    dismissNotification,
  };
}
