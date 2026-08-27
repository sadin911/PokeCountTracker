import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'badge' | 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'badge',
}) => {
  const {
    canInstall,
    isInstalled,
    isIOS,
    showGuideModal,
    setShowGuideModal,
    promptInstall,
  } = usePWAInstall();

  // If already running as installed standalone app, hide button
  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <>
      {variant === 'badge' && (
        <button
          onClick={promptInstall}
          title="ติดตั้งเป็น App บนมือถือ / คอมพิวเตอร์"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${className}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-purple-400 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>ติดตั้ง App</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={promptInstall}
          title="ติดตั้งเป็น App"
          className={`w-9 h-9 flex items-center justify-center rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all active:scale-95 ${className}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={promptInstall}
          className={`w-full py-2 px-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700/80 to-indigo-700/80 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-semibold shadow-md transition-all active:scale-98 ${className}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>ติดตั้งเป็น App บนหน้าจอโฮม</span>
        </button>
      )}

      <PWAInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        isIOS={isIOS}
        onNativeInstall={promptInstall}
        canNativeInstall={true}
      />
    </>
  );
};
