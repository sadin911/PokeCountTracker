import { useState, useEffect, useMemo } from 'react';
import { useDeckStore } from '../../store/deckStore';
import pokemonCardData from '../../data/pokemonNames.json';
import { parsePTCGLDeck } from '../../utils/ptcglDeckParser';

interface Props {
  onClose: () => void;
  activeDeckId?: string | null;
}

export function DeckImportExportModal({ onClose, activeDeckId }: Props) {
  const decks = useDeckStore((s) => s.decks);
  const importDeckJSON = useDeckStore((s) => s.importDeckJSON);
  const importParsedDeck = useDeckStore((s) => s.importParsedDeck);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedExportDeckId, setSelectedExportDeckId] = useState<string>(
    activeDeckId || Object.keys(decks)[0] || ''
  );
  const [importJsonText, setImportJsonText] = useState('');
  const [importPTCGLText, setImportPTCGLText] = useState('');
  const [customDeckName, setCustomDeckName] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentExportDeck = decks[selectedExportDeckId];

  // Generate PTCGL format text for the selected export deck
  const ptcglExportText = useMemo(() => {
    if (!currentExportDeck) return '';
    const lines = [`// Pokémon TCG Deck: ${currentExportDeck.name}`];

    const cardsMap = new Map<string, any>();
    (pokemonCardData as any[]).forEach((c) => cardsMap.set(c.id, c));

    const pokemon: string[] = [];
    const trainer: string[] = [];
    const energy: string[] = [];

    for (const [cardId, entry] of Object.entries(currentExportDeck.cards)) {
      if (entry.count <= 0) continue;
      const c = cardsMap.get(cardId);
      const name = c?.name || cardId;
      const setCode = c?.set?.id || 'PROMO';
      const colNum = c?.collectorNumber || c?.localId || '';
      const category = c?.category || 'Pokemon';

      const line = `${entry.count} ${name} ${setCode} ${colNum}`;
      if (category === 'Pokemon') pokemon.push(line);
      else if (category === 'Trainer') trainer.push(line);
      else energy.push(line);
    }

    if (pokemon.length > 0) {
      lines.push(`\nPokémon: ${pokemon.reduce((acc, l) => acc + parseInt(l, 10), 0)}`);
      lines.push(...pokemon);
    }
    if (trainer.length > 0) {
      lines.push(`\nTrainer: ${trainer.reduce((acc, l) => acc + parseInt(l, 10), 0)}`);
      lines.push(...trainer);
    }
    if (energy.length > 0) {
      lines.push(`\nEnergy: ${energy.reduce((acc, l) => acc + parseInt(l, 10), 0)}`);
      lines.push(...energy);
    }

    return lines.join('\n');
  }, [currentExportDeck]);

  const jsonExportText = currentExportDeck ? JSON.stringify(currentExportDeck, null, 2) : '';

  // Parse PTCGL / Limitless text with live feedback
  const parsedPTCGL = useMemo(() => {
    if (!importPTCGLText.trim()) return null;
    return parsePTCGLDeck(importPTCGLText, pokemonCardData as any[]);
  }, [importPTCGLText]);

  useEffect(() => {
    if (parsedPTCGL?.deckName) {
      setCustomDeckName(parsedPTCGL.deckName);
    }
  }, [parsedPTCGL?.deckName]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!currentExportDeck) return;
    const blob = new Blob([jsonExportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deck-${currentExportDeck.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    setStatusMsg(null);
    if (!importJsonText.trim()) {
      setStatusMsg({ type: 'error', text: 'กรุณาวางโค้ด JSON ของเด็คก่อน' });
      return;
    }

    const res = importDeckJSON(importJsonText);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setTimeout(onClose, 1200);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleImportPTCGL = () => {
    setStatusMsg(null);
    if (!parsedPTCGL || parsedPTCGL.matchedEntries.length === 0) {
      setStatusMsg({ type: 'error', text: 'ไม่พบรายการการ์ดที่สามารถนำเข้าได้ กรุณาตรวจสอบข้อความ' });
      return;
    }

    try {
      const finalName = customDeckName.trim() || parsedPTCGL.deckName || 'Imported Deck';
      importParsedDeck({
        name: finalName,
        description: 'นำเข้าจาก Limitless / PTCGL Text',
        cards: parsedPTCGL.cards,
        coverCardId: parsedPTCGL.coverCardId,
        coverImageUrl: parsedPTCGL.coverImageUrl,
      });

      setStatusMsg({
        type: 'success',
        text: `นำเข้าเด็ค "${finalName}" สำเร็จ (${parsedPTCGL.totalCards} ใบ)!`,
      });
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `เกิดข้อผิดพลาด: ${e.message}` });
    }
  };

  // Card categories breakdown for live preview
  const breakdown = useMemo(() => {
    if (!parsedPTCGL) return { pokemon: 0, trainer: 0, energy: 0 };
    let pokemon = 0;
    let trainer = 0;
    let energy = 0;
    for (const e of parsedPTCGL.matchedEntries) {
      if (e.category === 'Pokemon') pokemon += e.count;
      else if (e.category === 'Trainer') trainer += e.count;
      else energy += e.count;
    }
    return { pokemon, trainer, energy };
  }, [parsedPTCGL]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
              📥
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                นำเข้าและส่งออกเด็ค (Import / Export)
              </h3>
              <p className="text-xs text-slate-400">
                รองรับไฟล์ JSON และมาตรฐาน Text Decklist จาก Limitless / PTCGL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-black border border-slate-700 hover:border-rose-400 shadow-md transition-all active:scale-95 group"
            title="ปิดหน้าต่าง (ESC)"
          >
            <span className="text-sm font-black group-hover:rotate-90 transition-transform">✕</span>
            <span>ปิด</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📤 ส่งออกเด็ค (Export)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📥 นำเข้าเด็ค (Import)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  เลือกเด็คที่ต้องการส่งออก:
                </label>
                <select
                  value={selectedExportDeckId}
                  onChange={(e) => setSelectedExportDeckId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                >
                  {Object.values(decks).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({Object.values(d.cards).reduce((acc, c) => acc + c.count, 0)} ใบ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Format Box */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Decklist Text Format:
                  </label>
                  <button
                    onClick={() => handleCopy(ptcglExportText)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    {copied ? '✅ คัดลอกแล้ว' : '📋 คัดลอก Text'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={ptcglExportText}
                  rows={8}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
                />
              </div>

              {/* JSON Download Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleDownloadJSON}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg transition-all flex items-center gap-2"
                >
                  <span>💾</span>
                  <span>ดาวน์โหลดไฟล์ JSON</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    วางข้อความ Decklist (Limitless / PTCGL format ภาษาอังกฤษหรือไทย):
                  </label>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    รองรับภาษาอังกฤษ เช่น 4 Dreepy TWM 128
                  </span>
                </div>
                <textarea
                  value={importPTCGLText}
                  onChange={(e) => setImportPTCGLText(e.target.value)}
                  placeholder="ตัวอย่างจาก Limitless:&#10;Pokémon: 19&#10;4 Dreepy TWM 128&#10;4 Drakloak TWM 129&#10;3 Dragapult ex TWM 130&#10;Trainer: 32&#10;4 Buddy-Buddy Poffin TEF 144&#10;Energy: 9&#10;3 Fire Energy MEE 2"
                  rows={6}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                {/* Live Parse Preview */}
                {parsedPTCGL && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {parsedPTCGL.coverImageUrl ? (
                          <img
                            src={parsedPTCGL.coverImageUrl}
                            alt="Cover"
                            className="w-10 h-14 object-cover rounded-lg shadow-md border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                            🃏
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
                                parsedPTCGL.totalCards === 60
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {parsedPTCGL.totalCards === 60
                                ? '✅ ครบ 60 ใบ'
                                : `${parsedPTCGL.totalCards} / 60 ใบ`}
                            </span>
                            <span className="text-xs text-slate-400">
                              (พบ {parsedPTCGL.matchedEntries.length} ชนิดการ์ด)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>🃏 โปเกมอน {breakdown.pokemon}</span>
                            <span>•</span>
                            <span>🎒 เทรนเนอร์ {breakdown.trainer}</span>
                            <span>•</span>
                            <span>⚡ พลังงาน {breakdown.energy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 sm:max-w-xs">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          ชื่อเด็ค:
                        </label>
                        <input
                          type="text"
                          value={customDeckName}
                          onChange={(e) => setCustomDeckName(e.target.value)}
                          placeholder="ชื่อเด็ค..."
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Unmatched Lines Warning */}
                    {parsedPTCGL.unmatchedLines.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>ไม่พบการ์ดในระบบ {parsedPTCGL.unmatchedLines.length} รายการ:</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-rose-300/80 max-h-20 overflow-y-auto">
                          {parsedPTCGL.unmatchedLines.map((line, idx) => (
                            <li key={idx} className="truncate">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Matched Cards Preview List */}
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-900/50 p-2 space-y-1 scrollbar-thin">
                      {parsedPTCGL.matchedEntries.map((e, idx) => (
                        <div
                          key={`${e.cardId}-${idx}`}
                          className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-800/60 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 font-mono font-bold text-indigo-400 text-right shrink-0">
                              {e.count}x
                            </span>
                            {e.cardImage && (
                              <img
                                src={e.cardImage}
                                alt={e.cardNameTh}
                                className="w-5 h-7 object-cover rounded shadow-sm shrink-0"
                              />
                            )}
                            <span className="font-semibold text-slate-200 truncate">
                              {e.cardNameTh}
                            </span>
                            {e.cardNameEn !== e.cardNameTh && (
                              <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                                ({e.cardNameEn})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                            {e.setCode || ''} {e.collectorNumber || ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleImportPTCGL}
                      disabled={parsedPTCGL.totalCards === 0}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>📥</span>
                      <span>
                        นำเข้าเด็ค "{customDeckName.trim() || parsedPTCGL.deckName}" (
                        {parsedPTCGL.totalCards} ใบ)
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  หรือวางโค้ด JSON สำรองของเด็ค:
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="วาง JSON ของเด็คที่นี่..."
                  rows={4}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleImportJSON}
                  className="mt-2 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg transition-all"
                >
                  นำเข้าจาก JSON
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs sm:text-sm font-black border border-slate-600 shadow-lg transition-all flex items-center gap-1.5"
          >
            <span>✕</span>
            <span>ปิดหน้าต่าง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
