import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterBallIcon } from '../icons/MasterBallIcon';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  pullThreshold?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  pullThreshold = 75,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const hasTriggeredHapticRef = useRef(false);

  const isAtTop = () => {
    return (
      window.scrollY <= 2 &&
      document.documentElement.scrollTop <= 2 &&
      document.body.scrollTop <= 2
    );
  };

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing || e.touches.length !== 1) return;
      if (!isAtTop()) return;

      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = false;
      hasTriggeredHapticRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - startXRef.current;

      // Only handle downward vertical pulls at the top of the page
      if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2 && isAtTop()) {
        isPullingRef.current = true;
        // Non-linear damping curve for natural elastic feel
        const damping = 0.42;
        const damped = Math.min(deltaY * damping, 120);
        pullDistanceRef.current = damped;
        setPullDistance(damped);

        // Haptic feedback when crossing the threshold
        if (damped >= pullThreshold && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(18);
            } catch (_) {}
          }
        } else if (damped < pullThreshold) {
          hasTriggeredHapticRef.current = false;
        }

        // Prevent native rubber-band conflict if pulling
        if (e.cancelable && damped > 10) {
          e.preventDefault();
        }
      } else if (!isPullingRef.current) {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistanceRef.current >= pullThreshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(56); // Hold at header height during refresh

        try {
          await onRefresh();
          setIsSuccess(true);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([10, 30, 20]);
            } catch (_) {}
          }
          await new Promise((r) => setTimeout(r, 600));
        } catch (err) {
          console.error('Pull-to-refresh error:', err);
        } finally {
          setIsRefreshing(false);
          setIsSuccess(false);
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, isRefreshing, onRefresh, pullThreshold]);

  const isReadyToRelease = pullDistance >= pullThreshold;

  return (
    <div className="relative w-full min-h-full">
      {/* Pull-To-Refresh Visual Indicator Banner */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              height: pullDistance > 0 ? pullDistance : 56,
            }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full flex items-center justify-center overflow-hidden z-20 pointer-events-none select-none"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
          >
            <div
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 ${
                isSuccess
                  ? 'bg-emerald-500/90 text-white border-emerald-300 dark:border-emerald-400/50 shadow-emerald-500/30'
                  : isReadyToRelease || isRefreshing
                  ? 'bg-purple-600/95 dark:bg-purple-900/95 text-white border-purple-300 dark:border-yellow-400/50 shadow-purple-600/30'
                  : 'bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 shadow-slate-900/10'
              }`}
            >
              {/* Spinning/Rotating MasterBall or Check Icon */}
              <div
                className={`w-6 h-6 flex items-center justify-center transition-transform ${
                  isRefreshing
                    ? 'animate-spin'
                    : isSuccess
                    ? 'scale-110'
                    : ''
                }`}
                style={{
                  transform: isRefreshing
                    ? undefined
                    : `rotate(${pullDistance * 3.6}deg) scale(${Math.min(0.8 + pullDistance / 100, 1.15)})`,
                }}
              >
                {isSuccess ? (
                  <span className="text-sm font-black text-white">✓</span>
                ) : (
                  <MasterBallIcon className="w-full h-full drop-shadow" />
                )}
              </div>

              {/* Status Message */}
              <span className="text-xs font-bold tracking-tight">
                {isSuccess
                  ? 'รีเฟรชและล้าง Filter สำเร็จ!'
                  : isRefreshing
                  ? 'กำลังรีเฟรชและล้าง Filter...'
                  : isReadyToRelease
                  ? 'ปล่อยเพื่อรีเฟรชและล้าง Filter'
                  : 'ดึงลงเพื่อรีเฟรชและล้าง Filter'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content wrapper */}
      <div
        className="w-full min-h-full transition-transform duration-75"
        style={{
          transform:
            pullDistance > 0 && !isRefreshing
              ? `translateY(${Math.min(pullDistance * 0.35, 30)}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
