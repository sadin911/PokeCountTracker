import { useState } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface Props {
  isEditing?: boolean;
  onBackToDecks?: () => void;
  onOpenImportExport?: () => void;
}

export function DeckHeader({ isEditing, onBackToDecks, onOpenImportExport }: Props) {
  const setGameMode = useGameStore((s) => s.setGameMode);
  const syncStatus = useDeckStore((s) => s.syncStatus);

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/80 px-3 sm:px-8 py-2.5 sm:py-3 shadow-2xl">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: App Branding & Desktop Navigation Bar */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 text-white font-bold text-lg sm:text-xl ring-1 ring-white/20">
              🃏
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent leading-none">
                  PokéDeck
                </h1>
                {user ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                    <span>☁️</span>
                    <span className="hidden sm:inline">
                      {syncStatus === 'syncing'
                        ? 'Syncing...'
                        : syncStatus === 'error'
                        ? 'Error'
                        : 'Cloud'}
                    </span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                    Guest
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-none mt-0.5 hidden sm:block">
                ระบบสร้างเด็คและคำนวณการ์ดที่ขาด
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs (Hidden on mobile because of BottomNav) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setGameMode('collection')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>📚</span>
              <span>สมุดสะสม</span>
            </button>
            <button
              onClick={() => setGameMode('deck')}
              className="px-3 py-1.5 text-xs font-black rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <span>🃏</span>
              <span>จัดเด็ค</span>
            </button>
            <button
              onClick={() => setGameMode('pokemon')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>🎮</span>
              <span>Battle Tracker</span>
            </button>
          </nav>

          {/* Mobile Right Action shortcut: Back button or Import/Export & Install PWA */}
          <div className="flex md:hidden items-center gap-1.5">
            <PWAInstallButton variant="badge" />

            {isEditing && onBackToDecks && (
              <button
                type="button"
                onClick={onBackToDecks}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-200 shadow-sm flex items-center gap-1"
              >
                <span>←</span>
                <span>เด็คทั้งหมด</span>
              </button>
            )}

            {onOpenImportExport && (
              <button
                type="button"
                onClick={onOpenImportExport}
                className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center text-xs shadow-sm"
                title="Import / Export"
              >
                📥
              </button>
            )}
          </div>
        </div>

        {/* Desktop Actions, Back to Decks & User Profile */}
        <div className="hidden md:flex items-center justify-end gap-2.5 w-auto">
          {/* PWA Install Button (Desktop) */}
          <PWAInstallButton variant="badge" />

          {/* Back to Decks Button if in editor */}
          {isEditing && onBackToDecks && (
            <button
              onClick={onBackToDecks}
              className="px-3.5 py-2 text-xs font-black rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <span>←</span>
              <span>รวมเด็คทั้งหมด</span>
            </button>
          )}

          {/* Import / Export Modal Trigger */}
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 transition-all flex items-center gap-1.5 shadow-sm"
              title="นำเข้า / ส่งออกเด็ค (PTCGL & JSON)"
            >
              <span>📥</span>
              <span>Import / Export</span>
            </button>
          )}

          {/* Google Auth Button / User Profile Pill */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/40 text-slate-200 text-xs font-bold shadow-md transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-indigo-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[110px] truncate text-slate-200 font-bold">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-fade-in space-y-2">
                  <div className="px-2 py-1.5 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <span>☁️</span>
                      <span>Cloud Sync เปิดใช้งานอยู่</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setGameMode('admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                  >
                    <span>📊</span>
                    <span>Admin & Analytics</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-2"
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
              <span>{authLoading ? 'กำลังเข้าสู่ระบบ...' : 'Login with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
