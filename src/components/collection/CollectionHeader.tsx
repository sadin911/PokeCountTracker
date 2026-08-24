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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/60 px-3 sm:px-6 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: App Logo & Mode Switcher */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20 text-white font-bold text-lg">
              📚
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-400 via-rose-300 to-cyan-400 bg-clip-text text-transparent leading-tight">
                PokéCollection
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                สมุดสะสมการ์ดโปเกมอนภาษาไทย
              </p>
            </div>
          </div>

          {/* Quick Switch to Battle Mode (Mobile) */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => setGameMode('pokemon')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1"
            >
              <span>🎮</span>
              <span>Battle</span>
            </button>
          </div>
        </div>

        {/* Center: Profile Selector & Stats Summary */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
          {/* Active Profile Pill */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-600 text-slate-200 text-xs font-semibold shadow-inner transition-all group"
            title="คลิกเพื่อจัดการหรือสลับโปรไฟล์สะสม"
          >
            <span className="text-sm">{activeProfile?.icon || '🎴'}</span>
            <span className="max-w-[130px] truncate text-amber-300 font-bold">
              {activeProfile?.name || 'My Collection'}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded-full group-hover:bg-slate-600">
              ▼
            </span>
          </button>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1">
              <span>🎴</span>
              <span>{stats.totalUniqueOwned.toLocaleString()} ใบ</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1">
              <span>✨</span>
              <span>{stats.totalCardsCount.toLocaleString()} รวม</span>
            </div>
            {stats.wishlistCount > 0 && (
              <div className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1">
                <span>⭐</span>
                <span>{stats.wishlistCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & Game Mode Switcher */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Backup / Export Button */}
          <button
            onClick={() => setShowBackupModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/70 transition-all flex items-center gap-1.5 shadow-sm"
            title="สำรองข้อมูลและนำเข้าไฟล์คอลเลกชัน"
          >
            <span>💾</span>
            <span>Backup/Import</span>
          </button>

          {/* Battle Mode */}
          <button
            onClick={() => setGameMode('pokemon')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md shadow-rose-900/30 transition-all flex items-center gap-1.5"
          >
            <span>🎮</span>
            <span>Battle Tracker</span>
          </button>

          {/* Lorcana Mode */}
          <button
            onClick={() => setGameMode('lorcana')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 transition-all flex items-center gap-1"
          >
            <span>🪄</span>
            <span>Lorcana</span>
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
