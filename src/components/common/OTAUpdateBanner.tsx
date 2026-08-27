import { useOTAUpdate } from '../../hooks/useOTAUpdate';

export function OTAUpdateBanner() {
  const {
    needRefresh,
    isUpdating,
    statusMessage,
    updateNow,
    dismissNotification,
  } = useOTAUpdate();

  if (!needRefresh && !statusMessage) {
    return null;
  }

  // If update is ready (needRefresh)
  if (needRefresh) {
    return (
      <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white shadow-2xl border border-indigo-500/40 backdrop-blur-xl ring-2 ring-indigo-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-xl shadow-lg shrink-0 animate-bounce">
              🚀
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-white bg-clip-text text-transparent">
                  มีอัปเดตเวอร์ชันใหม่พร้อมใช้งาน!
                </h4>
                <button
                  type="button"
                  onClick={dismissNotification}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs"
                  title="ปิดการแจ้งเตือน"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                อัปเดตแบบ OTA ได้ทันทีโดยไม่ต้องปิดแล้วเปิดแอปใหม่ ข้อมูลทั้งหมดจะยังคงอยู่ครบถ้วน
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateNow()}
                  disabled={isUpdating}
                  className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 active:scale-95 text-white text-xs font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className={isUpdating ? 'animate-spin' : ''}>⚡</span>
                  <span>{isUpdating ? 'กำลังรีโหลดเวอร์ชันใหม่...' : 'อัปเดตทันที (OTA Reload)'}</span>
                </button>
                <button
                  type="button"
                  onClick={dismissNotification}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  ไว้ก่อน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Toast status message (e.g. "✓ แอปของคุณเป็นเวอร์ชันล่าสุดแล้ว")
  if (statusMessage) {
    return (
      <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white text-xs font-bold shadow-xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2">
          <span>✨</span>
          <span>{statusMessage}</span>
        </div>
      </div>
    );
  }

  return null;
}
