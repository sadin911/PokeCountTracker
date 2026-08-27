import { useOTAUpdate } from '../../hooks/useOTAUpdate';

interface Props {
  variant?: 'toolbar' | 'menu' | 'badge';
  className?: string;
}

export function OTAUpdateButton({ variant = 'toolbar', className = '' }: Props) {
  const {
    needRefresh,
    isChecking,
    isUpdating,
    checkForUpdates,
    updateNow,
  } = useOTAUpdate();

  const handleClick = () => {
    if (needRefresh) {
      updateNow();
    } else {
      checkForUpdates();
    }
  };

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isChecking || isUpdating}
        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer ${
          needRefresh
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white animate-pulse'
            : isChecking
            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
            : 'bg-indigo-50/70 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className={isChecking || isUpdating ? 'animate-spin' : ''}>
            {needRefresh ? '🚀' : '⚡'}
          </span>
          <span>
            {isUpdating
              ? 'กำลังอัปเดตแอป...'
              : isChecking
              ? 'กำลังตรวจหาเวอร์ชันใหม่...'
              : needRefresh
              ? 'มีเวอร์ชันใหม่! แตะเพื่ออัปเดต'
              : 'ตรวจหาอัปเดต OTA'}
          </span>
        </div>
        {needRefresh ? (
          <span className="text-[10px] bg-white text-indigo-700 px-1.5 py-0.5 rounded-full font-black">
            NEW
          </span>
        ) : (
          <span className="text-[10px] opacity-70">
            {isChecking ? 'Checking...' : 'OTA'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isChecking || isUpdating}
        title={needRefresh ? 'มีเวอร์ชันใหม่! แตะเพื่ออัปเดต' : 'ตรวจหาอัปเดต OTA'}
        className={`px-2 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
          needRefresh
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white animate-bounce ring-2 ring-purple-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700'
        } ${className}`}
      >
        <span className={isChecking || isUpdating ? 'animate-spin' : ''}>
          {needRefresh ? '🚀' : '⚡'}
        </span>
        <span className="hidden sm:inline">
          {isUpdating ? 'กำลังอัปเดต...' : isChecking ? 'เช็คเวอร์ชัน...' : needRefresh ? 'อัปเดต OTA' : 'เช็คอัปเดต'}
        </span>
      </button>
    );
  }

  // Default: toolbar button
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isChecking || isUpdating}
      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
        needRefresh
          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white animate-pulse ring-2 ring-indigo-400'
          : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
      } ${className}`}
      title="ตรวจหาเวอร์ชันใหม่และอัปเดต Over-The-Air ทันทีโดยไม่ต้องเปิด-ปิดแอปใหม่"
    >
      <span className={isChecking || isUpdating ? 'animate-spin' : ''}>
        {needRefresh ? '🚀' : '⚡'}
      </span>
      <span>
        {isUpdating
          ? 'กำลังอัปเดต...'
          : isChecking
          ? 'กำลังเช็ค...'
          : needRefresh
          ? 'อัปเดต OTA ทันที!'
          : 'เช็คอัปเดต OTA'}
      </span>
    </button>
  );
}
