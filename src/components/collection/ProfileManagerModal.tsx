import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';

interface Props {
  onClose: () => void;
}

const PROFILE_ICONS = ['🎴', '📁', '⭐', '🔥', '⚡', '💧', '🌿', '🔮', '🐉', '🏆', '💎', '📦'];

export function ProfileManagerModal({ onClose }: Props) {
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const createProfile = useCollectionStore((s) => s.createProfile);
  const switchProfile = useCollectionStore((s) => s.switchProfile);
  const renameProfile = useCollectionStore((s) => s.renameProfile);
  const deleteProfile = useCollectionStore((s) => s.deleteProfile);

  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎴');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const profileList = Object.values(profiles);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    createProfile(newProfileName.trim(), selectedIcon);
    setNewProfileName('');
    setIsCreating(false);
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingProfileId(id);
    setEditName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      renameProfile(id, editName.trim());
    }
    setEditingProfileId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (profileList.length <= 1) {
      alert('ไม่สามารถลบโปรไฟล์สุดท้ายได้');
      return;
    }
    if (confirm(`คุณต้องการลบโปรไฟล์ "${name}" และข้อมูลการ์ดทั้งหมดในโปรไฟล์นี้ใช่หรือไม่?`)) {
      deleteProfile(id);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <div>
              <h2 className="text-base font-bold text-white">จัดการโปรไฟล์สะสม (Accounts / Binders)</h2>
              <p className="text-xs text-slate-400">แยกสมุดสะสมการ์ดได้หลายเล่มบนเครื่องนี้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Profile List */}
          <div className="space-y-2">
            {profileList.map((p) => {
              const isActive = p.id === activeProfileId;
              const cardCount = Object.keys(p.cards || {}).length;
              const totalItems = Object.values(p.cards || {}).reduce(
                (sum, c) => sum + Object.values(c.variants || {}).reduce((a, b) => a + b, 0),
                0
              );

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl">{p.icon || '🎴'}</span>
                    <div className="min-w-0 flex-1">
                      {editingProfileId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(p.id);
                              if (e.key === 'Escape') setEditingProfileId(null);
                            }}
                            className="bg-slate-950 border border-amber-500/60 rounded px-2 py-1 text-xs text-white focus:outline-none w-full max-w-[180px]"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(p.id)}
                            className="px-2 py-1 rounded bg-amber-500 text-black text-xs font-bold"
                          >
                            บันทึก
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-100 truncate">{p.name}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              ใช้งานอยู่
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {cardCount.toLocaleString()} แบบการ์ด · รวม {totalItems.toLocaleString()} ใบ
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-2">
                    {!isActive && (
                      <button
                        onClick={() => {
                          switchProfile(p.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        สลับใช้งาน
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(p.id, p.name)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-all"
                      title="เปลี่ยนชื่อโปรไฟล์"
                    >
                      ✏️
                    </button>
                    {profileList.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs transition-all"
                        title="ลบโปรไฟล์นี้"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create New Profile Form / Button */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/70 hover:bg-amber-500/5 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>➕</span>
              <span>สร้างโปรไฟล์ / สมุดสะสมใหม่</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">สร้างโปรไฟล์ใหม่</h4>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ชื่อโปรไฟล์ / ชื่อสมุดสะสม</label>
                <input
                  type="text"
                  placeholder="เช่น สมุดการ์ดชุด Scarlet & Violet, การ์ดสำหรับเทรด..."
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">เลือกไอคอน</label>
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE_ICONS.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                        selectedIcon === icon
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-110'
                          : 'bg-slate-700/60 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  สร้างโปรไฟล์
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
