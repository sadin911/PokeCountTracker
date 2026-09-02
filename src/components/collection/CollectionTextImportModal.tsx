import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';
import { parseCollectionText } from '../../utils/collectionTextParser';
import pokemonCardData from '../../data/pokemonNames.json';
import type { CardVariantKey } from '../../types/collection';

interface Props {
  onClose: () => void;
}

const EXAMPLE_TEXT = `Set SC1a
1,3
20,5
21

ชุด SV8
10,2
11`;

export function CollectionTextImportModal({ onClose }: Props) {
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const importCollectionText = useCollectionStore((s) => s.importCollectionText);

  const [text, setText] = useState('');
  const [targetBinderId, setTargetBinderId] = useState(activeProfileId);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [finish, setFinish] = useState<CardVariantKey>('normal');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [showUnmatched, setShowUnmatched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Live parse preview as the user types or pastes
  const preview = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return parseCollectionText(trimmed, pokemonCardData as any[]);
  }, [text]);

  const handleApplyExample = () => {
    setText(EXAMPLE_TEXT);
    setStatus(null);
  };

  const handleImport = () => {
    setStatus(null);
    if (!text.trim()) {
      setStatus({ ok: false, message: 'กรุณาระบุรายการการ์ดก่อน' });
      return;
    }

    const res = importCollectionText(text, {
      mode,
      finish,
      profileId: targetBinderId,
    });

    setStatus({ ok: res.success, message: res.message });
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1600);
    }
  };

  const binderList = Object.values(profiles);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 dark:from-yellow-400 dark:to-amber-500 flex items-center justify-center text-white dark:text-slate-950 text-xl font-bold shadow-md">
              📥
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                นำเข้าการ์ดจากข้อความ (Card Text Import)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เพิ่มการ์ดแบบกลุ่มด้วยรหัสชุดและหมายเลขการ์ด
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin space-y-4">
          {/* Format Guide */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span>📋</span> รูปแบบที่รองรับ (Format Guide):
              </span>
              <button
                type="button"
                onClick={handleApplyExample}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
              >
                ใส่ตัวอย่าง (Insert Example)
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              ขึ้นต้นด้วยรหัสชุด เช่น <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/40 text-amber-600 dark:text-amber-300 font-mono font-bold">Set SC1a</code> หรือ <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/40 text-amber-600 dark:text-amber-300 font-mono font-bold">ชุด SV8</code> แล้วตามด้วยบรรทัด{' '}
              <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/40 text-amber-600 dark:text-amber-300 font-mono font-bold">&lt;เลขการ์ด&gt;,&lt;จำนวน&gt;</code> หากไม่ระบุจำนวน จะตั้งเป็น 1 ใบโดยอัตโนมัติ
            </p>
          </div>

          {/* Options: Target Binder, Mode, Variant/Finish */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Target Binder */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">สมุดสะสมเป้าหมาย:</label>
              <select
                value={targetBinderId}
                onChange={(e) => setTargetBinderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {binderList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon ?? '🎴'} {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">รูปแบบการนำเข้า:</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="merge">➕ เพิ่มต่อจากเดิม (Merge)</option>
                <option value="replace">🔄 แทนที่จำนวนเดิม (Replace)</option>
              </select>
            </div>

            {/* Variant / Finish */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">ชนิดการ์ด (Variant):</label>
              <select
                value={finish}
                onChange={(e) => setFinish(e.target.value as CardVariantKey)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="normal">✨ Normal (ธรรมดา)</option>
                <option value="holo">🌟 Holo (โฮโล)</option>
                <option value="reverse">💫 Reverse Holo (เรเวิร์ส)</option>
                <option value="promo">🎁 Promo (โปรโม)</option>
              </select>
            </div>
          </div>

          {/* Textarea Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>รายการการ์ด (Card List Input):</span>
              {text && (
                <button
                  type="button"
                  onClick={() => {
                    setText('');
                    setStatus(null);
                  }}
                  className="text-rose-500 hover:text-rose-400 text-xs font-bold"
                >
                  ล้างข้อความ (Clear)
                </button>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setStatus(null);
              }}
              rows={8}
              placeholder={`Set SC1a\n1,3\n20,5\n21\n\nชุด SV8\n10,2`}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 scrollbar-thin focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed"
            />
          </div>

          {/* Live Preview Stats */}
          {preview && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-2.5 animate-fade-in text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🔍</span> ตรวจพบขณะนี้ (Live Parse Preview):
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold">
                    {preview.totalQuantity} ใบ (copies)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    {preview.distinctCardsCount} แบบ
                  </span>
                  {preview.setsFound.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                      ชุด: {preview.setsFound.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Unmatched Lines Warning */}
              {preview.unmatchedLines.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>⚠️ ข้าม {preview.unmatchedLines.length} บรรทัดที่ไม่สามารถประมวลผลได้:</span>
                    <button
                      type="button"
                      onClick={() => setShowUnmatched((v) => !v)}
                      className="underline text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 font-bold"
                    >
                      {showUnmatched ? 'ซ่อน' : 'ดูรายละเอียด'}
                    </button>
                  </div>
                  {showUnmatched && (
                    <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90 max-h-28 overflow-y-auto">
                      {preview.unmatchedLines.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold ${
                status.ok
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-300'
              }`}
            >
              {status.ok ? '✓ ' : '✕ '}
              {status.message}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            ยกเลิก (Cancel)
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!preview || preview.totalQuantity === 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>นำเข้า {preview && preview.totalQuantity > 0 ? `${preview.totalQuantity} ใบ` : 'การ์ด'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
