import { useEffect, useRef } from 'react';

/**
 * Custom hook to intercept browser / mobile "Back" button / swipe back gesture when a modal is open.
 * - When the modal opens, it pushes a history state.
 * - If the user presses "Back", popstate fires and calls onClose() without navigating away from the page.
 * - If the modal is closed via UI button (✕, backdrop, Escape), it cleanly reverts the pushed history entry.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const isBackTriggeredRef = useRef(false);
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    isBackTriggeredRef.current = false;

    // Push history state for the modal
    window.history.pushState({ modalOpen: true, modalId }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      // Back button was pressed
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

      // If closed manually by UI (not via back button), roll back the pushed history entry
      if (isPushedRef.current && !isBackTriggeredRef.current) {
        isPushedRef.current = false;
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      }
    };
  }, [isOpen, modalId]);
}
