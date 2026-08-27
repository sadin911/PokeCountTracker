import { useState } from "react";
import { useCollectionStore } from "../../store/collectionStore";
import { useDeckStore } from "../../store/deckStore";
import { useCommunityStore } from "../../store/communityStore";
import { useGameStore } from "../../store/gameStore";
import { useAuthStore } from "../../store/authStore";
import { ProfileManagerModal } from "./ProfileManagerModal";
import { CollectionBackupModal } from "./CollectionBackupModal";
import { PWAInstallButton } from "../common/PWAInstallButton";
import { OTAUpdateButton } from "../common/OTAUpdateButton";
import { ThemeToggle } from "../common/ThemeToggle";
import { MasterBallIcon } from "../icons/MasterBallIcon";
import { isAdminEmail } from "../../utils/adminAuth";
import type { CollectionStats } from "../../types/collection";

interface Props {
  stats: CollectionStats;
}

function formatLastSynced(timestamp: number | null): string {
  if (!timestamp) return "ยังไม่เคยซิงค์";
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "เมื่อสักครู่";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} น.`;
}

export function CollectionHeader({ stats }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profiles = useCollectionStore((s) => s.profiles);
  const syncStatus = useCollectionStore((s) => s.syncStatus);
  const lastSyncedAt = useCollectionStore((s) => s.lastSyncedAt);
  const forceSyncCloud = useCollectionStore((s) => s.forceSyncCloud);
  const uploadLocalDecksToCloud = useDeckStore((s) => s.uploadLocalDecksToCloud);
  const fetchCommunityStats = useCommunityStore((s) => s.fetchCommunityStats);
  const setGameMode = useGameStore((s) => s.setGameMode);

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const activeProfile = profiles[activeProfileId];

  const handleForceSync = async () => {
    if (!user) {
      signIn();
      return;
    }
    setIsManualSyncing(true);
    try {
      // 1. Force upload binders to Firestore
      const res = await forceSyncCloud(user.uid);
      // 2. Force upload decks to Firestore
      await uploadLocalDecksToCloud(user.uid);
      // 3. Refresh community stats
      await fetchCommunityStats(true);

      if (res) {
        setSyncFeedback("ซิงค์สำเร็จแล้ว!");
      } else {
        setSyncFeedback("ซิงค์ผิดพลาด");
      }
    } catch (e) {
      console.error("Force sync failed:", e);
      setSyncFeedback("ซิงค์ล้มเหลว");
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const isSyncing = syncStatus === "syncing" || isManualSyncing;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80 px-3 sm:px-8 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-2 sm:py-3 shadow-md dark:shadow-2xl transition-colors duration-200">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
        {/* Top Bar on Mobile / Left Group on Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3">
          {/* Logo & Cloud Sync Status */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shadow-md border border-purple-200 dark:border-purple-500/30 hover:scale-105 transition-transform shrink-0">
              <MasterBallIcon className="w-full h-full drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 dark:from-yellow-300 dark:via-amber-400 dark:to-yellow-500 bg-clip-text text-transparent leading-none drop-shadow-sm">
                  PokéCollection
                </h1>
                {user ? (
                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isSyncing
                        ? "bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                        : syncStatus === "error"
                        ? "bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 hover:bg-rose-200"
                        : "bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                    }`}
                    title={
                      isSyncing
                        ? "กำลังซิงค์ข้อมูลกับ Cloud..."
                        : syncFeedback
                        ? syncFeedback
                        : `Cloud Sync เชื่อมต่ออยู่ (${formatLastSynced(lastSyncedAt)}) - คลิกเพื่อบังคับ Sync ทันที`
                    }
                  >
                    <span className={isSyncing ? "animate-spin" : ""}>
                      {isSyncing ? "🔄" : "☁️"}
                    </span>
                    <span>
                      {isSyncing
                        ? "Syncing..."
                        : syncFeedback
                        ? syncFeedback
                        : syncStatus === "error"
                        ? "Sync Error"
                        : "Cloud"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn()}
                    className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-yellow-500/20 hover:bg-amber-200 dark:hover:bg-yellow-500/30 border border-amber-300 dark:border-yellow-500/40 text-amber-800 dark:text-yellow-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                    title="เข้าสู่ระบบเพื่อเปิดใช้งาน Cloud Sync ข้ามอุปกรณ์"
                  >
                    <span>☁️</span>
                    <span>Guest</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5 hidden sm:block">
                สมุดสะสมการ์ดโปเกมอนภาษาไทย
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs (Hidden on mobile because of BottomNav) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setGameMode("collection")}
              className="px-3 py-1.5 text-xs font-black rounded-lg bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-yellow-400/25 transition-all flex items-center gap-1.5 ring-1 ring-yellow-300/50"
            >
              <span>📚</span>
              <span>สมุดสะสม</span>
            </button>
            <button
              onClick={() => setGameMode("deck")}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
            >
              <span>🃏</span>
              <span>จัดเด็ค</span>
            </button>
            <button
              onClick={() => setGameMode("pokemon")}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
            >
              <span>🎮</span>
              <span>Battle Tracker</span>
            </button>
          </nav>

          {/* Mobile Right Action shortcut: Theme, Install PWA, OTA, Backup & User Auth */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <OTAUpdateButton variant="badge" />
            <ThemeToggle />
            <PWAInstallButton variant="badge" />

            <button
              onClick={() => setShowBackupModal(true)}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs shadow-sm transition-all active:scale-95"
              title="สำรองข้อมูล"
            >
              💾
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-emerald-400 dark:border-emerald-500/50 p-0.5 flex items-center justify-center shadow-sm active:scale-95"
                  title={user.displayName || "User Profile"}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                    {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50 animate-fade-in space-y-2.5">
                    <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <span>☁️</span>
                          <span>Cloud Sync: เชื่อมต่อแล้ว</span>
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">{formatLastSynced(lastSyncedAt)}</span>
                      </div>
                    </div>

                    {/* Force Cloud Sync Button inside Menu */}
                    <button
                      type="button"
                      onClick={handleForceSync}
                      disabled={isSyncing}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer ${
                        isSyncing
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                          : "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isSyncing ? "animate-spin" : ""}>🔄</span>
                        <span>{isSyncing ? "กำลัง Sync ข้อมูล..." : "บังคับ Sync กับ Cloud ทันที"}</span>
                      </div>
                      {syncFeedback && (
                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">
                          {syncFeedback}
                        </span>
                      )}
                    </button>

                    {isAdminEmail(user.email) && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setGameMode("admin");
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-500 dark:text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                      >
                        <span>📊</span>
                        <span>Admin & Analytics</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-500 dark:text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>ออกจากระบบ (Sign Out)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                disabled={authLoading}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1 active:scale-95"
              >
                <span>🔑</span>
                <span>{authLoading ? "..." : "เข้าสู่ระบบ"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Header on Mobile / Right Group on Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3">
          {/* Active Profile Switcher Pill */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm group min-w-0"
            title="คลิกเพื่อจัดการและสลับสมุดสะสม"
          >
            <span className="text-sm shrink-0">{activeProfile?.icon || "🎴"}</span>
            <span className="text-purple-700 dark:text-yellow-300 font-extrabold max-w-[110px] sm:max-w-[130px] truncate text-[11px] sm:text-xs">
              {activeProfile?.name || "สมุดสะสม"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-1 rounded group-hover:bg-slate-300 dark:group-hover:bg-slate-600 shrink-0">
              ▾
            </span>
          </button>

          {/* Summary Badges (Responsive) */}
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs shrink-0">
            <div className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 font-black flex items-center gap-1 shadow-sm">
              <span>🎴</span>
              <span>{stats.totalUniqueOwned.toLocaleString()}<span className="hidden xs:inline"> แบบ</span></span>
            </div>
            <div className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-yellow-500/15 border border-amber-200 dark:border-yellow-500/40 text-amber-700 dark:text-yellow-300 font-black flex items-center gap-1 shadow-sm">
              <span>✨</span>
              <span>{stats.totalCardsCount.toLocaleString()}<span className="hidden xs:inline"> ใบ</span></span>
            </div>
            {stats.wishlistCount > 0 && (
              <div className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 font-black flex items-center gap-1 shadow-sm">
                <span>⭐</span>
                <span>{stats.wishlistCount}</span>
              </div>
            )}
          </div>

          {/* Desktop Tools: Theme, Install, Backup, Sync & Auth */}
          <div className="hidden md:flex items-center gap-2">
            <OTAUpdateButton variant="toolbar" />
            <ThemeToggle />
            <PWAInstallButton variant="badge" />

            <button
              onClick={() => setShowBackupModal(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600/80 transition-all flex items-center gap-1.5 shadow-sm"
              title="สำรองข้อมูลและนำเข้าไฟล์คอลเลกชัน"
            >
              <span>💾</span>
              <span>Backup</span>
            </button>

            {/* Dedicated Force Sync Button in Desktop Toolbar */}
            {user && (
              <button
                type="button"
                onClick={handleForceSync}
                disabled={isSyncing}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  isSyncing
                    ? "bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                    : "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                }`}
                title={`บังคับ Sync ข้อมูลกับ Cloud ทันที (ซิงค์ล่าสุด: ${formatLastSynced(lastSyncedAt)})`}
              >
                <span className={isSyncing ? "animate-spin" : ""}>🔄</span>
                <span>{isSyncing ? "Syncing..." : syncFeedback || "Sync Cloud"}</span>
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-emerald-400 dark:border-emerald-500/40 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm dark:shadow-md transition-all"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-6 h-6 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[110px] truncate text-slate-800 dark:text-slate-200 font-bold">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">▾</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50 animate-fade-in space-y-2.5">
                    <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <span>☁️</span>
                          <span>Cloud Sync: เชื่อมต่อแล้ว</span>
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">{formatLastSynced(lastSyncedAt)}</span>
                      </div>
                    </div>

                    {/* Force Cloud Sync Button inside Desktop Menu */}
                    <button
                      type="button"
                      onClick={handleForceSync}
                      disabled={isSyncing}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer ${
                        isSyncing
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                          : "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isSyncing ? "animate-spin" : ""}>🔄</span>
                        <span>{isSyncing ? "กำลัง Sync ข้อมูล..." : "บังคับ Sync กับ Cloud ทันที"}</span>
                      </div>
                      {syncFeedback && (
                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">
                          {syncFeedback}
                        </span>
                      )}
                    </button>

                    {/* OTA Update Check inside Menu */}
                    <OTAUpdateButton variant="menu" />

                    {isAdminEmail(user.email) && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setGameMode("admin");
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-500 dark:text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                      >
                        <span>📊</span>
                        <span>Admin & Analytics</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-500 dark:text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>ออกจากระบบ (Sign Out)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                disabled={authLoading}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{authLoading ? "กำลังเข้าสู่ระบบ..." : "Login with Google"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileManagerModal onClose={() => setShowProfileModal(false)} />
      )}
      {showBackupModal && (
        <CollectionBackupModal onClose={() => setShowBackupModal(false)} />
      )}
    </header>
  );
}
