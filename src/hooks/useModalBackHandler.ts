import { useEffect, useRef } from 'react';

/**
 * Custom hook to intercept browser / mobile "Back" button / swipe back gesture when a modal is open.
 * - Pushes a history entry with { modalOpen: true, modalId } preserving current full URL.
 * - When user presses Back, popstate fires, we close the modal (onClose) without navigating away.
 * - When user closes via UI button (✕, backdrop, Escape), we cleanly pop the modal history entry.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const isBackTriggeredRef = useRef(false);
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    isBackTriggeredRef.current = false;

    // Push history state preserving current full URL
    try {
      window.history.pushState({ modalOpen: true, modalId }, '', window.location.href);
      isPushedRef.current = true;
    } catch (e) {
      isPushedRef.current = false;
    }

    const handlePopState = () => {
      // The back button was pressed - close the modal
      isBackTriggeredRef.current = true;
      isPushedRef.current = false;
      onCloseRef.current();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);

      // If closed manually by UI (not via back button), roll back the modal history entry
      if (isPushedRef.current && !isBackTriggeredRef.current) {
        isPushedRef.current = false;
        try {
          if (window.history.state?.modalOpen) {
            window.history.back();
          }
        } catch (e) {}
      }
    };
  }, [isOpen, modalId]);
}
