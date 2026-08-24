import { useState, useMemo } from 'react';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import pokemonCardData from '../../data/pokemonNames.json';
import type { Deck } from '../../types/deck';

interface Props {
  deck: Deck;
  onSelectCover: (cardId: string, imageUrl: string) => void;
  onClose: () => void;
}

export function DeckCoverPickerModal({ deck, onSelectCover, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'inDeck' | 'popular' | 'search'>('inDeck');
  const [search, setSearch] = useState('');

  // 1. Cards in current deck
  const cardsInDeck = useMemo(() => {
    const cardsMap = new Map<string, any>();
    (pokemonCardData as any[]).forEach((c) => cardsMap.set(c.id, c));

    const list: any[] = [];
    for (const cardId of Object.keys(deck.cards)) {
      const c = cardsMap.get(cardId);
      if (c) list.push(c);
    }
    return list;
  }, [deck.cards]);

  // 2. Popular Ace Pokémon Cards for Covers
  const popularCards = useMemo(() => {
    const popularNames = [
      'ลิซาร์ดอน',
      'พิคาชู',
      'การ์เดโวียร์',
      'มิไรดอน',
      'โคไรดอน',
      'ดราพัลท์',
      'ลูเกีย',
      'กิราตินา',
      'มิวทู',
      'มิว',
      'เก็คโควกะ',
      'อีวุย',
      'แบล็กกี้',
      'นินเฟีย',
      'เร็คคูซา',
      'ซาเซียน',
      'อาร์เซอุส',
      'ทาเครุโฮมุระ',
      'โอการ์ปอน',
    ];

    const results: any[] = [];
    const addedIds = new Set<string>();

    (pokemonCardData as any[]).forEach((c) => {
      const name = c.name || '';
      if (
        (name.includes('ex') || name.includes('VSTAR') || name.includes('VMAX') || name.includes('V')) &&
        popularNames.some((p) => name.includes(p))
      ) {
        if (!addedIds.has(c.id)) {
          addedIds.add(c.id);
          results.push(c);
        }
      }
    });

    return results.slice(0, 36);
  }, []);

  // 3. Search filtered cards
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();

    return (pokemonCardData as any[])
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        const col = (c.collectorNumber || c.localId || '').toLowerCase();
        const set = (c.set?.id || '').toLowerCase();
        return name.includes(term) || col.includes(term) || set.includes(term);
      })
      .slice(0, 48);
  }, [search]);

  const displayedCards =
    activeTab === 'inDeck'
      ? cardsInDeck
      : activeTab === 'popular'
      ? popularCards
      : searchResults;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
              🖼️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>เลือกรูปหน้าปกเด็ค:</span>
                <span className="text-amber-400">{deck.name}</span>
              </h3>
              <p className="text-xs text-slate-400">
                เลือกการ์ดใบโปรดเพื่อนำมาแสดงเป็นรูปหน้าปกเด็คในหน้ารวม
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inDeck')}
              className={`px-4 py-2 text-xs font-black rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'inDeck'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🃏</span>
              <span>การ์ดในเด็คนี้ ({cardsInDeck.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-4 py-2 text-xs font-black rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'popular'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⭐</span>
              <span>โปเกมอนยอดนิยม</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 text-xs font-black rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔍</span>
              <span>ค้นหาการ์ดทั้งหมด</span>
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="พิมพ์ชื่อโปเกมอน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Card Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {displayedCards.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <span className="text-4xl">🃏</span>
              <p className="text-sm font-bold text-slate-400">
                {activeTab === 'inDeck'
                  ? 'เด็คนี้ยังไม่มีการ์ด สามารถเลือกจากแถบ "โปเกมอนยอดนิยม" หรือ "ค้นหา" ได้ครับ'
                  : activeTab === 'search'
                  ? 'พิมพ์ชื่อการ์ดในช่องค้นหาด้านบนเพื่อเลือกรูปหน้าปก'
                  : 'ไม่พบการ์ด'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {displayedCards.map((card) => {
                const imgUrl = resolveCardImageUrl(card.imageUrl);
                const isSelected = deck.coverCardId === card.id;

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      onSelectCover(card.id, card.imageUrl || '');
                      onClose();
                    }}
                    className={`group relative rounded-xl p-1.5 bg-slate-900 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-400 bg-slate-800'
                        : 'border-slate-800 hover:border-indigo-500/60'
                    }`}
                  >
                    <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-950 shadow-inner">
                      <img
                        src={imgUrl}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, card.imageUrl, card.officialImageUrl)}
                      />

                      {isSelected && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] shadow-md">
                          ✓ หน้าปกปัจจุบัน
                        </div>
                      )}

                      <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-black text-[11px] shadow-lg">
                          เลือกรูปนี้
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 text-center">
                      <h4 className="text-[11px] font-bold text-slate-200 truncate group-hover:text-amber-300" title={card.name}>
                        {card.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
