import { useState } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import pokemonCardData from '../../data/pokemonNames.json';

interface Props {
  onClose: () => void;
  activeDeckId?: string | null;
}

export function DeckImportExportModal({ onClose, activeDeckId }: Props) {
  useModalBackHandler(true, onClose, 'deck-import-export-modal');

  const decks = useDeckStore((s) => s.decks);
  const importDeckJSON = useDeckStore((s) => s.importDeckJSON);
  const createDeck = useDeckStore((s) => s.createDeck);
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedExportDeckId, setSelectedExportDeckId] = useState<string>(
    activeDeckId || Object.keys(decks)[0] || ''
  );
  const [importJsonText, setImportJsonText] = useState('');
  const [importPTCGLText, setImportPTCGLText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentExportDeck = decks[selectedExportDeckId];

  // Generate PTCGL format text for the selected deck
  const ptcglExportText = (() => {
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
      lines.push(`\nPokémon: ${pokemon.reduce((acc, l) => acc + parseInt(l), 0)}`);
      lines.push(...pokemon);
    }
    if (trainer.length > 0) {
      lines.push(`\nTrainer: ${trainer.reduce((acc, l) => acc + parseInt(l), 0)}`);
      lines.push(...trainer);
    }
    if (energy.length > 0) {
      lines.push(`\nEnergy: ${energy.reduce((acc, l) => acc + parseInt(l), 0)}`);
      lines.push(...energy);
    }

    return lines.join('\n');
  })();

  const jsonExportText = currentExportDeck ? JSON.stringify(currentExportDeck, null, 2) : '';

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
    if (!importPTCGLText.trim()) {
      setStatusMsg({ type: 'error', text: 'กรุณาวางข้อความ Decklist ก่อน' });
      return;
    }

    try {
      const lines = importPTCGLText.split('\n');
      const newDeckId = createDeck('Imported Deck', 'นำเข้าจาก Text Decklist');

      let importedCount = 0;
      const allCards = pokemonCardData as any[];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('//') || line.startsWith('Pokémon:') || line.startsWith('Trainer:') || line.startsWith('Energy:')) {
          continue;
        }

        // Match format: "4 Ralts SIT 67" or "2 ลิซาร์ดอนex SV3 125"
        const match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Za-z0-9-]+)\s+(\d+[-/]?\d*))?$/);
        if (match) {
          const count = parseInt(match[1], 10);
          const nameQuery = match[2].trim().toLowerCase();
          const setQuery = match[3]?.toUpperCase();

          // Find best card match
          const found = allCards.find((c) => {
            const cName = (c.name || '').toLowerCase();
            const cSet = (c.set?.id || '').toUpperCase();
            if (setQuery && cSet !== setQuery) return false;
            return cName.includes(nameQuery) || nameQuery.includes(cName);
          });

          if (found) {
            addCardToDeck(newDeckId, found.id, count);
            importedCount += count;
          }
        }
      }

      setStatusMsg({
        type: 'success',
        text: `นำเข้าสำเร็จ! พบการ์ดตรงในระบบ ${importedCount} ใบ`,
      });
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `เกิดข้อผิดพลาด: ${e.message}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
                รองรับไฟล์ JSON และมาตรฐาน Text Decklist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-all"
          >
            ✕
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
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  วางข้อความ Decklist (เช่น 4 Charmander MEW 4, 3 Charizard ex...):
                </label>
                <textarea
                  value={importPTCGLText}
                  onChange={(e) => setImportPTCGLText(e.target.value)}
                  placeholder="วาง Decklist Text ที่นี่..."
                  rows={6}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleImportPTCGL}
                  className="mt-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg transition-all"
                >
                  นำเข้าจาก Text
                </button>
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
      </div>
    </div>
  );
}
