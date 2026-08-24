import { useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { useGameStore } from '../../store/gameStore';
import { ProfileManagerModal } from './ProfileManagerModal';
import { CollectionBackupModal } from './CollectionBackupModal';
import type { CollectionStats } from '../../types/collection';

interface Props {
  stats: CollectionStats;
}

export function CollectionHeader({ stats }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profiles = useCollectionStore((s) => s.profiles);
  const setGameMode = useGameStore((s) => s.setGameMode);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const activeProfile = profiles[activeProfileId];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/80 px-4 sm:px-8 py-3 shadow-2xl">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left: App Branding & Main Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/25 text-white font-bold text-xl ring-1 ring-white/20">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-400 via-rose-300 to-cyan-300 bg-clip-text text-transparent leading-none">
                  PokéCollection
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Full View
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                สมุดสะสมการ์ดโปเกมอนภาษาไทย (Full-Screen Tracker)
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setGameMode('collection')}
              className="px-3.5 py-1.5 text-xs font-black rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>📚</span>
              <span>สมุดสะสม</span>
            </button>
            <button
              onClick={() => setGameMode('pokemon')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>🎮</span>
              <span>Battle Tracker</span>
            </button>
            <button
              onClick={() => setGameMode('lorcana')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>🪄</span>
              <span>Lorcana</span>
            </button>
          </nav>
        </div>

        {/* Center/Right: Profile Selector & Stats Summary & Backup */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 w-full lg:w-auto">
          {/* Active Profile Dropdown Pill */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold shadow-md transition-all group"
            title="คลิกเพื่อจัดการหรือสลับโปรไฟล์สะสม (Multi-Account)"
          >
            <span className="text-base">{activeProfile?.icon || '🎴'}</span>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider leading-none">โปรไฟล์</div>
              <div className="text-amber-300 font-extrabold max-w-[140px] truncate leading-tight">
                {activeProfile?.name || 'My Collection'}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-md group-hover:bg-slate-600 ml-1">
              สลับ ▾
            </span>
          </button>

          {/* Summary Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-extrabold flex items-center gap-1.5 shadow-sm">
              <span>🎴</span>
              <span>{stats.totalUniqueOwned.toLocaleString()} แบบ</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center gap-1.5 shadow-sm">
              <span>✨</span>
              <span>{stats.totalCardsCount.toLocaleString()} ใบ</span>
            </div>
            {stats.wishlistCount > 0 && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold flex items-center gap-1 shadow-sm">
                <span>⭐</span>
                <span>{stats.wishlistCount}</span>
              </div>
            )}
          </div>

          {/* Backup / Export Button */}
          <button
            onClick={() => setShowBackupModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 transition-all flex items-center gap-1.5 shadow-sm"
            title="สำรองข้อมูลและนำเข้าไฟล์คอลเลกชัน"
          >
            <span>💾</span>
            <span>Backup / Import</span>
          </button>
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
