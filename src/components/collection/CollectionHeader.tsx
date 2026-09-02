import { useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { AppHeaderBar } from '../layout/AppHeaderBar';
import { HeaderStats } from '../layout/HeaderStats';
import { ProfileManagerModal } from './ProfileManagerModal';
import { CollectionTextImportModal } from './CollectionTextImportModal';
import type { CollectionStats } from '../../types/collection';

/**
 * Collection page header.
 *
 * The bar itself, the account menu and every tool that used to live up here are
 * now `AppHeaderBar`'s concern. What is left is what belongs to this page: which
 * binder is open, and how much is in it.
 */

interface Props {
  stats: CollectionStats;
}

export function CollectionHeader({ stats }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfile = profiles[activeProfileId];

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTextImport, setShowTextImport] = useState(false);

  return (
    <>
      <AppHeaderBar
        title="PokéCollection"
        tagline="สมุดสะสมการ์ดโปเกมอนภาษาไทย"
        titleClassName="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 dark:from-yellow-300 dark:via-amber-400 dark:to-yellow-500"
        contextSlot={
          <>
            <button
              type="button"
              onClick={() => setShowTextImport(true)}
              data-testid="text-import-button"
              title="นำเข้าการ์ดจากข้อความด้วยรหัสชุดและหมายเลข (Import from text)"
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--surface-fg)] text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <span className="text-sm shrink-0">📥</span>
              <span className="font-extrabold hidden xs:inline sm:inline">นำเข้า</span>
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              data-testid="profile-switcher"
              title="คลิกเพื่อจัดการและสลับสมุดสะสม"
              className="h-8 sm:h-9 px-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--surface-fg)] text-xs font-bold flex items-center gap-1.5 transition-colors min-w-0"
            >
              <span className="text-sm shrink-0" aria-hidden="true">
                {activeProfile?.icon || '🎴'}
              </span>
              <span className="max-w-[160px] truncate font-extrabold">
                {activeProfile?.name || 'สมุดสะสม'}
              </span>
              <span className="text-[10px] text-[var(--surface-muted)] shrink-0">▾</span>
            </button>

            <HeaderStats stats={stats} />
          </>
        }
      />

      {showProfileModal && <ProfileManagerModal onClose={() => setShowProfileModal(false)} />}
      {showTextImport && <CollectionTextImportModal onClose={() => setShowTextImport(false)} />}
    </>
  );
}
