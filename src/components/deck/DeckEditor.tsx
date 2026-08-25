import { useState, useMemo, useRef, useEffect } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { useCollectionStore } from '../../store/collectionStore';
import { calculateDeckStats, calculateMissingCards } from '../../utils/deckCalculator';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { MissingCardsModal } from './MissingCardsModal';
import { CardImagePreviewModal } from '../pokemon/CardImagePreviewModal';
import { DeckCoverPickerModal } from './DeckCoverPickerModal';
import { RARITY_CLASSES } from '../collection/CollectionFilterBar';
import { SearchableSetSelect } from '../common/SearchableSetSelect';
import { getCardRarityClass } from '../../utils/rarity';
import pokemonCardData from '../../data/pokemonNames.json';
import type { Deck } from '../../types/deck';

interface Props {
  deck: Deck;
  onBackToDecks: () => void;
}

const ENERGY_TYPES = [
  { type: 'Grass', emoji: '🌿' },
  { type: 'Fire', emoji: '🔥' },
  { type: 'Water', emoji: '💧' },
  { type: 'Lightning', emoji: '⚡' },
  { type: 'Psychic', emoji: '🔮' },
  { type: 'Fighting', emoji: '👊' },
  { type: 'Darkness', emoji: '🌑' },
  { type: 'Metal', emoji: '⚙️' },
  { type: 'Dragon', emoji: '🐉' },
  { type: 'Colorless', emoji: '⚪' },
];

const ITEMS_PER_PAGE = 40;

export function DeckEditor({ deck, onBackToDecks }: Props) {
  const renameDeck = useDeckStore((s) => s.renameDeck);
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck);
  const removeCardFromDeck = useDeckStore((s) => s.removeCardFromDeck);
  const clearDeckCards = useDeckStore((s) => s.clearDeckCards);
  const setDeckCover = useDeckStore((s) => s.setDeckCover);

  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profile = useCollectionStore((s) => s.profiles[activeProfileId]);
  const userCollectionCards = profile?.cards || {};

  // Card lookup map
  const cardDataMap = useMemo(() => {
    const map = new Map<string, any>();
    (pokemonCardData as any[]).forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Deck Stats & Missing Report
  const stats = useMemo(() => calculateDeckStats(deck, cardDataMap), [deck, cardDataMap]);
  const missingReport = useMemo(
    () => calculateMissingCards(deck, cardDataMap, userCollectionCards),
    [deck, cardDataMap, userCollectionCards]
  );

  // States
  const [deckName, setDeckName] = useState(deck.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [mobileTab, setMobileTab] = useState<'deck' | 'catalog'>('deck');

  // Catalog Filters
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedRarity, setSelectedRarity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [catalogLimit, setCatalogLimit] = useState(ITEMS_PER_PAGE);

  // Sets dropdown list
  const setsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (pokemonCardData as any[]).forEach((c) => {
      const sId = c.set?.id || 'PROMO';
      const sName = c.set?.name || 'การ์ดโปรโม / อื่น ๆ';
      if (!map.has(sId)) map.set(sId, { id: sId, name: sName });
    });
    return Array.from(map.values());
  }, []);

  // Filter Catalog Cards
  const filteredCatalog = useMemo(() => {
    const sTerm = search.trim().toLowerCase();

    return (pokemonCardData as any[]).filter((c) => {
      // Search
      if (sTerm) {
        const nameMatch = (c.name || '').toLowerCase().includes(sTerm);
        const colMatch = (c.collectorNumber || c.localId || '').toLowerCase().includes(sTerm);
        const setMatch = (c.set?.name || '').toLowerCase().includes(sTerm) || (c.set?.id || '').toLowerCase().includes(sTerm);
        if (!nameMatch && !colMatch && !setMatch) return false;
      }

      // Set
      if (selectedSet !== 'ALL') {
        const cSet = c.set?.id || 'PROMO';
        if (cSet !== selectedSet) return false;
      }

      // Type
      if (selectedType !== 'ALL') {
        const types = c.types || [];
        if (!types.includes(selectedType)) return false;
      }

      // Rarity
      if (selectedRarity !== 'ALL') {
        if (getCardRarityClass(c) !== selectedRarity) return false;
      }

      // Category
      if (selectedCategory !== 'ALL') {
        if (c.category !== selectedCategory) return false;
      }

      return true;
    });
  }, [search, selectedSet, selectedType, selectedRarity, selectedCategory]);

  const displayedCatalog = filteredCatalog.slice(0, catalogLimit);
  const hasMoreCatalog = catalogLimit < filteredCatalog.length;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCatalogLimit(ITEMS_PER_PAGE);
  }, [search, selectedSet, selectedType, selectedRarity, selectedCategory]);

  useEffect(() => {
    if (!hasMoreCatalog) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCatalogLimit((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredCatalog.length));
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMoreCatalog, filteredCatalog.length]);

  const handleSaveName = () => {
    if (deckName.trim()) {
      renameDeck(deck.id, deckName.trim());
    }
    setIsEditingName(false);
  };

  // Group Deck Cards by Category
  const groupedDeckCards = useMemo(() => {
    const pokemon: { cardId: string; count: number; card: any }[] = [];
    const trainer: { cardId: string; count: number; card: any }[] = [];
    const energy: { cardId: string; count: number; card: any }[] = [];

    for (const [cardId, entry] of Object.entries(deck.cards)) {
      if (entry.count <= 0) continue;
      const card = cardDataMap.get(cardId);
      const item = { cardId, count: entry.count, card };
      if (card?.category === 'Trainer') trainer.push(item);
      else if (card?.category === 'Energy') energy.push(item);
      else pokemon.push(item);
    }

    return { pokemon, trainer, energy };
  }, [deck.cards, cardDataMap]);

  return (
    <div className="flex flex-col xl:flex-row flex-1 w-full min-h-[calc(100vh-70px)] bg-slate-950 text-slate-100">
      {/* Mobile Tab Switcher (Visible only on < xl screens) */}
      <div className="xl:hidden flex items-center bg-slate-900 border-b border-slate-800 p-2 gap-2 sticky top-0 z-20 shadow-md">
        <button
          onClick={() => setMobileTab('deck')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'deck'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <span>🃏</span>
          <span>การ์ดในเด็ค ({stats.totalCards}/60)</span>
        </button>
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black shadow-md'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <span>🔍</span>
          <span>ค้นหาการ์ดเพิ่ม</span>
        </button>
      </div>

      {/* LEFT COLUMN: Deck 60 Cards & Stats */}
      <div className={`w-full xl:w-[480px] 2xl:w-[540px] bg-slate-900/90 border-r border-slate-800 p-4 sm:p-6 flex flex-col justify-between shrink-0 ${mobileTab === 'deck' ? 'flex' : 'hidden xl:flex'}`}>
        <div className="space-y-4">
          {/* Deck Header & Title + Cover preview */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Cover Thumbnail Clickable */}
              <div
                onClick={() => setShowCoverModal(true)}
                className="w-12 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md cursor-pointer shrink-0 hover:scale-105 transition-transform flex items-center justify-center relative group/cover"
                title="คลิกเพื่อเปลี่ยนรูปหน้าปกเด็ค"
              >
                {deck.coverImageUrl ? (
                  <img
                    src={resolveCardImageUrl(deck.coverImageUrl)}
                    alt={deck.name}
                    className="w-full h-full object-cover"
                    onError={(e) => handleCardImageError(e, deck.coverImageUrl)}
                  />
                ) : (
                  <span className="text-xl opacity-40">🃏</span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-amber-300 font-bold text-center">
                  เปลี่ยนปก
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      className="w-full px-3 py-1 bg-slate-950 border border-indigo-500 rounded-lg text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white"
                    >
                      บันทึก
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                    <h2 className="text-base sm:text-lg font-black text-white truncate">{deck.name}</h2>
                    <span className="text-xs text-slate-400 group-hover:text-indigo-400">✏️</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowCoverModal(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <span>🖼️</span>
                    <span>เปลี่ยนรูปปก</span>
                  </button>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] text-slate-400 truncate">{deck.description || 'เด็คมาตรฐาน'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onBackToDecks}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all shrink-0"
            >
              ← ปิดเด็ค
            </button>
          </div>

          {/* Stats Bar (60 Cards Indicator & Missing Calculator Button) */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black shadow-md ${
                    stats.totalCards === 60
                      ? 'bg-emerald-500 text-slate-950'
                      : stats.totalCards > 60
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {stats.totalCards} / 60 ใบ
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {stats.totalCards === 60 ? 'ครบมาตรฐาน 60 ใบ ✨' : `ต้องการอีก ${60 - stats.totalCards} ใบ`}
                </span>
              </div>

              {/* Missing Cards Trigger */}
              <button
                onClick={() => setShowMissingModal(true)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm border ${
                  missingReport.totalCardsMissing > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
                title="คลิกเพื่อคำนวณและดูรายการการ์ดที่ขาดเทียบกับคอลเลกชัน"
              >
                <span>🧮</span>
                <span>
                  {missingReport.totalCardsMissing > 0
                    ? `ขาด ${missingReport.totalCardsMissing} ใบ`
                    : 'การ์ดครบ 100%'}
                </span>
              </button>
            </div>

            {/* Category Breakdown Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="py-1.5 px-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                👾 โปเกมอน: {stats.pokemonCount}
              </div>
              <div className="py-1.5 px-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                🎒 เทรนเนอร์: {stats.trainerCount}
              </div>
              <div className="py-1.5 px-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                ⚡ พลังงาน: {stats.energyCount}
              </div>
            </div>

            {/* Rule Violations Alert if any */}
            {stats.ruleViolations.length > 0 && stats.totalCards > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold space-y-1">
                {stats.ruleViolations.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grouped Card List in Deck */}
          <div className="space-y-4 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
            {stats.totalCards === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
                <span className="text-4xl">🃏</span>
                <p className="text-xs font-bold text-slate-400">เด็คนี้ยังไม่มีการ์ด</p>
                <p className="text-[11px] text-slate-500">เลือกการ์ดจากคลังด้านขวา แล้วกด + เพื่อใส่เข้าเด็ค</p>
              </div>
            ) : (
              <>
                {/* Pokémon Section */}
                {groupedDeckCards.pokemon.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-purple-400 uppercase mb-1.5 flex items-center justify-between">
                      <span>👾 โปเกมอน ({stats.pokemonCount} ใบ)</span>
                    </h4>
                    <div className="space-y-1.5">
                      {groupedDeckCards.pokemon.map(({ cardId, count, card }) => (
                        <DeckCardRow
                          key={cardId}
                          cardId={cardId}
                          count={count}
                          card={card}
                          userOwned={userCollectionCards[cardId]}
                          isCover={deck.coverCardId === cardId}
                          onAdd={() => addCardToDeck(deck.id, cardId, 1)}
                          onRemove={() => removeCardFromDeck(deck.id, cardId)}
                          onSetCover={(img) => setDeckCover(deck.id, cardId, img)}
                          onPreview={() => setPreviewCard(card || { id: cardId, name: cardId })}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trainer Section */}
                {groupedDeckCards.trainer.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-400 uppercase mb-1.5 flex items-center justify-between">
                      <span>🎒 เทรนเนอร์ ({stats.trainerCount} ใบ)</span>
                    </h4>
                    <div className="space-y-1.5">
                      {groupedDeckCards.trainer.map(({ cardId, count, card }) => (
                        <DeckCardRow
                          key={cardId}
                          cardId={cardId}
                          count={count}
                          card={card}
                          userOwned={userCollectionCards[cardId]}
                          isCover={deck.coverCardId === cardId}
                          onAdd={() => addCardToDeck(deck.id, cardId, 1)}
                          onRemove={() => removeCardFromDeck(deck.id, cardId)}
                          onSetCover={(img) => setDeckCover(deck.id, cardId, img)}
                          onPreview={() => setPreviewCard(card || { id: cardId, name: cardId })}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Energy Section */}
                {groupedDeckCards.energy.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-400 uppercase mb-1.5 flex items-center justify-between">
                      <span>⚡ พลังงาน ({stats.energyCount} ใบ)</span>
                    </h4>
                    <div className="space-y-1.5">
                      {groupedDeckCards.energy.map(({ cardId, count, card }) => (
                        <DeckCardRow
                          key={cardId}
                          cardId={cardId}
                          count={count}
                          card={card}
                          userOwned={userCollectionCards[cardId]}
                          isCover={deck.coverCardId === cardId}
                          onAdd={() => addCardToDeck(deck.id, cardId, 1)}
                          onRemove={() => removeCardFromDeck(deck.id, cardId)}
                          onSetCover={(img) => setDeckCover(deck.id, cardId, img)}
                          onPreview={() => setPreviewCard(card || { id: cardId, name: cardId })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Clear All Deck Cards Button */}
        {stats.totalCards > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการล้างการ์ดทั้งหมดในเด็คนี้ใช่หรือไม่?')) {
                  clearDeckCards(deck.id);
                }
              }}
              className="w-full py-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all"
            >
              🗑️ ล้างการ์ดทั้งหมดในเด็ค
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Card Catalog Search & Add */}
      <div className={`flex-1 p-3 sm:p-6 lg:p-8 flex flex-col space-y-4 overflow-y-auto ${mobileTab === 'catalog' ? 'flex' : 'hidden xl:flex'}`}>
        {/* Search & Filter Bar for Catalog */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="ค้นหาชื่อการ์ด หรือเลขการ์ด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Searchable Set Dropdown */}
            <SearchableSetSelect
              sets={setsList}
              selectedSet={selectedSet}
              onSelectSet={setSelectedSet}
              accentColor="indigo"
              showProgress={false}
              className="w-full md:w-64"
            />

            {/* Rarity Dropdown */}
            <div className="relative w-full md:w-56">
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-amber-400 font-bold focus:outline-none focus:border-indigo-500 truncate shadow-inner"
              >
                {RARITY_CLASSES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full md:w-44">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
              >
                <option value="ALL">ทุกหมวดหมู่</option>
                <option value="Pokemon">👾 โปเกมอน</option>
                <option value="Trainer">🎒 เทรนเนอร์</option>
                <option value="Energy">⚡ พลังงาน</option>
              </select>
            </div>
          </div>

          {/* Energy Types Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                selectedType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              ทุกธาตุ
            </button>
            {ENERGY_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => setSelectedType(t.type === selectedType ? 'ALL' : t.type)}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
                  selectedType === t.type
                    ? 'ring-2 ring-indigo-400 bg-slate-700 scale-110 shadow-md'
                    : 'bg-slate-800/90 hover:bg-slate-700 opacity-75 hover:opacity-100'
                }`}
                title={t.type}
              >
                {t.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Catalog Grid */}
        <div className="flex-1">
          {filteredCatalog.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
              <span className="text-4xl">🔍</span>
              <p className="text-sm font-bold text-slate-300">ไม่พบการ์ดที่ตรงกับคำค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {displayedCatalog.map((card) => {
                const countInDeck = deck.cards[card.id]?.count || 0;
                const imgUrl = resolveCardImageUrl(card.imageUrl);

                return (
                  <div
                    key={card.id}
                    className={`group relative rounded-xl p-2 bg-slate-900/80 hover:bg-slate-800 border transition-all duration-200 flex flex-col justify-between select-none ${
                      countInDeck > 0 ? 'border-indigo-500/60 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => setPreviewCard(card)}
                      className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer bg-slate-950 shadow-inner group-hover:scale-[1.03] transition-transform duration-200"
                    >
                      <img
                        src={imgUrl}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, card.imageUrl, card.officialImageUrl)}
                      />

                      {/* Zoom Icon Overlay on Top-Left */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCard(card);
                        }}
                        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-black/70 hover:bg-indigo-600 text-white text-[11px] flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all shadow-md"
                        title="ดูรูปขยายใหญ่ (Zoom)"
                      >
                        🔍
                      </button>

                      {/* Count in Deck Badge */}
                      {countInDeck > 0 && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs shadow-md flex items-center gap-0.5">
                          <span>×</span>
                          <span>{countInDeck}</span>
                        </div>
                      )}

                      {/* Quick Add Overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addCardToDeck(deck.id, card.id, 1);
                        }}
                        className="absolute bottom-1.5 right-1.5 px-2 py-1 sm:px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-[11px] sm:text-xs shadow-lg flex items-center gap-1 opacity-90 sm:opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-all"
                        title="เพิ่มการ์ดเข้าเด็ค (+1)"
                      >
                        <span>+ ใส่เด็ค</span>
                      </button>
                    </div>

                    <div className="mt-1.5 cursor-pointer" onClick={() => setPreviewCard(card)}>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[60%]">{card.set?.id || 'PROMO'}</span>
                        <span>{card.collectorNumber || card.localId}</span>
                      </div>
                      <h4 className="text-xs font-bold truncate text-slate-200 mt-0.5 hover:text-indigo-300" title={card.name}>
                        {card.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Catalog Infinite Scroll Sentinel */}
          {hasMoreCatalog && (
            <div ref={sentinelRef} className="py-8 text-center text-slate-400 text-xs font-semibold">
              กำลังโหลดการ์ดเพิ่มเติม... ({displayedCatalog.length} / {filteredCatalog.length} ใบ)
            </div>
          )}
        </div>
      </div>

      {/* Missing Cards Modal */}
      {showMissingModal && (
        <MissingCardsModal
          deck={deck}
          cardDataMap={cardDataMap}
          onClose={() => setShowMissingModal(false)}
        />
      )}

      {/* Deck Cover Picker Modal */}
      {showCoverModal && (
        <DeckCoverPickerModal
          deck={deck}
          onSelectCover={(cardId, imageUrl) => setDeckCover(deck.id, cardId, imageUrl)}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {/* Card High-Res Preview Modal */}
      {previewCard && (
        <CardImagePreviewModal
          imageUrl={previewCard.imageUrl}
          officialImageUrl={previewCard.officialImageUrl}
          cardName={previewCard.name}
          onClose={() => setPreviewCard(null)}
          onSelect={() => addCardToDeck(deck.id, previewCard.id, 1)}
        />
      )}
    </div>
  );
}

// Single Card Row in Deck Column
function DeckCardRow({
  cardId,
  count,
  card,
  userOwned,
  isCover,
  onAdd,
  onRemove,
  onSetCover,
  onPreview,
}: {
  cardId: string;
  count: number;
  card: any;
  userOwned: any;
  isCover: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onSetCover: (img: string) => void;
  onPreview: () => void;
}) {
  const variants = userOwned?.variants || { normal: 0, holo: 0, reverse: 0, promo: 0 };
  const totalOwned = variants.normal + variants.holo + variants.reverse + variants.promo;
  const isMissing = totalOwned < count;
  const imgUrl = resolveCardImageUrl(card?.imageUrl);

  return (
    <div
      className={`group p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
        isMissing
          ? 'bg-slate-950/80 border-rose-500/30 hover:border-rose-500/50'
          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={onPreview}>
        <div className="w-9 h-12 rounded-md overflow-hidden bg-slate-900 shrink-0 shadow-sm relative group-hover:ring-1 group-hover:ring-indigo-400 transition-all">
          <img
            src={imgUrl}
            alt={card?.name || cardId}
            className="w-full h-full object-cover"
            onError={(e) => handleCardImageError(e, card?.imageUrl)}
          />
          {isCover && (
            <div className="absolute top-0 left-0 bg-amber-500 text-slate-950 text-[8px] font-black px-1 rounded-br">
              ★ Cover
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
            <span className="text-amber-400 font-bold">{card?.set?.id || 'PROMO'}</span>
            <span>{card?.collectorNumber || card?.localId}</span>
          </div>
          <h5 className="text-xs font-bold text-slate-200 truncate leading-snug hover:text-indigo-300 transition-colors" title={card?.name}>
            {card?.name || cardId}
          </h5>
          <div className="flex items-center gap-2 text-[10px] mt-0.5">
            {isMissing ? (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <span>⚠️ ขาด {count - totalOwned}</span>
                <span className="text-slate-500">(มี {totalOwned})</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">✅ มี {totalOwned} ใบ</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions: + / - / Cover */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onSetCover(imgUrl || '')}
          className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition-all ${
            isCover
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'bg-slate-900 text-slate-500 hover:text-amber-400 hover:bg-slate-800'
          }`}
          title={isCover ? 'การ์ดนี้เป็นรูปหน้าปกเด็ค' : 'ตั้งเป็นการ์ดหน้าปกเด็ค'}
        >
          ★
        </button>

        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
          <button
            type="button"
            onClick={onRemove}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-black text-xs"
          >
            -
          </button>
          <span className="w-6 text-center text-xs font-black text-white">{count}</span>
          <button
            type="button"
            onClick={onAdd}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-black text-xs"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
