import { useState, useRef, useEffect, useCallback } from 'react';
import type { PlayerId, SlotKey } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { PlayerHeader } from '../player/PlayerHeader';
import { MiniPokemonCard } from './MiniPokemonCard';
import { CoinFlip } from '../tools/CoinFlip';
import { DiceRoller } from '../tools/DiceRoller';
import { EndTurnModal } from '../layout/EndTurnModal';

// ── Drag state type (module-level to avoid React limitations) ──────────────────
type DragState =
  | { type: 'idle' }
  | { type: 'pending'; slot: SlotKey; startX: number; startY: number }
  | { type: 'dragging'; source: SlotKey; target: SlotKey | null };

// orientation='normal'    → Active→Bench→Header  (P2, readable from bottom)
// orientation='reversed'  → Header→Bench→Active  (P1 same-side, readable from bottom, active near center)
// orientation='faceToFace'→ Active→Bench→Header + rotate-180  (P1 face-to-face, reads from top)
function MiniPlayerSection({ playerId, orientation = 'normal' }: {
  playerId: PlayerId;
  orientation?: 'normal' | 'reversed' | 'faceToFace';
}) {
  const player = useGameStore(s => s[playerId]);
  const currentTurn = useGameStore(s => s.currentTurn);
  const { swapSlots } = useGameStore();
  const isCurrentTurn = currentTurn === playerId;

  // Tap-swap
  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null);

  // Touch drag state
  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const dragStateRef = useRef<DragState>({ type: 'idle' });
  dragStateRef.current = dragState;
  const swapSlotsRef = useRef(swapSlots);
  swapSlotsRef.current = swapSlots;
  const playerRef = useRef(player);
  playerRef.current = player;

  // Tap-select handler (used by onClick on ⇄)
  const handleCardSelect = useCallback((slot: SlotKey) => {
    setSelectedSlot(prev => {
      if (prev === null) {
        const p = slot === 'active'
          ? playerRef.current.activePokemon
          : playerRef.current.bench[slot as number];
        return p.name !== '' ? slot : null;
      }
      if (prev === slot) return null;
      swapSlotsRef.current(playerId, prev, slot);
      return null;
    });
  }, [playerId]);

  // Global touch move/end for drag tracking
  useEffect(() => {
    if (dragState.type === 'idle') return;

    const onMove = (e: globalThis.TouchEvent) => {
      const state = dragStateRef.current;
      const { clientX, clientY } = e.touches[0];

      if (state.type === 'pending') {
        const moved = Math.abs(clientX - state.startX) > 8 || Math.abs(clientY - state.startY) > 8;
        if (moved) {
          const p = state.slot === 'active'
            ? playerRef.current.activePokemon
            : playerRef.current.bench[state.slot as number];
          if (p.name !== '') {
            e.preventDefault();
            const next: DragState = { type: 'dragging', source: state.slot, target: null };
            dragStateRef.current = next;
            setDragState(next);
          } else {
            dragStateRef.current = { type: 'idle' };
            setDragState({ type: 'idle' });
          }
        }
        return;
      }

      if (state.type === 'dragging') {
        e.preventDefault();
        const el = document.elementFromPoint(clientX, clientY);
        const card = (el?.closest('[data-minislot]') as HTMLElement | null);
        const newTarget: SlotKey | null =
          card?.dataset.pid === playerId
            ? (card.dataset.minislot === 'active'
                ? 'active'
                : (Number(card.dataset.minislot) as SlotKey))
            : null;
        if (newTarget !== state.target) {
          const next: DragState = { type: 'dragging', source: state.source, target: newTarget };
          dragStateRef.current = next;
          setDragState(next);
        }
      }
    };

    const onEnd = (e: globalThis.TouchEvent) => {
      const state = dragStateRef.current;

      if (state.type === 'pending') {
        // No movement → was a tap → let onClick handle selection
        dragStateRef.current = { type: 'idle' };
        setDragState({ type: 'idle' });
        return;
      }

      if (state.type === 'dragging') {
        const { clientX, clientY } = e.changedTouches[0];
        const el = document.elementFromPoint(clientX, clientY);
        const card = (el?.closest('[data-minislot]') as HTMLElement | null);
        if (card?.dataset.pid === playerId) {
          const s = card.dataset.minislot!;
          const target: SlotKey = s === 'active' ? 'active' : (Number(s) as SlotKey);
          if (target !== state.source) {
            swapSlotsRef.current(playerId, state.source, target);
          }
        }
        setSelectedSlot(null);
        dragStateRef.current = { type: 'idle' };
        setDragState({ type: 'idle' });
      }
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [dragState.type, playerId]);

  // Touch start on ⇄ button → initiate drag tracking
  const onSwapTouchStart = useCallback((slot: SlotKey) => (e: React.TouchEvent) => {
    e.stopPropagation();
    setDragState({ type: 'pending', slot, startX: e.touches[0].clientX, startY: e.touches[0].clientY });
  }, []);

  // HTML5 drag handlers for desktop (on wrapper divs)
  const html5Source = useRef<SlotKey | null>(null);

  const wrapperDragProps = (slot: SlotKey, hasCard: boolean): React.HTMLAttributes<HTMLDivElement> => ({
    'data-minislot': String(slot),
    'data-pid': playerId,
    ...(hasCard && {
      draggable: true,
      onDragStart: (e) => {
        html5Source.current = slot;
        e.dataTransfer.setData('text/plain', `${playerId}:${String(slot)}`);
        e.dataTransfer.effectAllowed = 'move';
      },
      onDragEnd: () => { html5Source.current = null; },
    }),
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => {
      e.preventDefault();
      const [pid, src] = e.dataTransfer.getData('text/plain').split(':');
      if (pid === playerId) {
        const from: SlotKey = src === 'active' ? 'active' : (Number(src) as SlotKey);
        if (from !== slot) swapSlots(playerId, from, slot);
      }
    },
  } as React.HTMLAttributes<HTMLDivElement>);

  // Visual props per slot
  const isDragging = dragState.type === 'dragging';
  const dragging = dragState as Extract<DragState, { type: 'dragging' }>;

  const cardProps = (slot: SlotKey) => ({
    isSelected: selectedSlot === slot && !isDragging,
    swapMode: selectedSlot !== null && selectedSlot !== slot && !isDragging,
    isDragSource: isDragging && dragging.source === slot,
    isDragTarget: isDragging && dragging.target === slot,
    onSelect: () => handleCardSelect(slot),
    onSwapStart: onSwapTouchStart(slot),
  });

  // Drop-target-only props (no draggable) — used by active's outer wrapper
  const activeDropProps: React.HTMLAttributes<HTMLDivElement> = {
    'data-minislot': 'active',
    'data-pid': playerId,
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => {
      e.preventDefault();
      const [pid, src] = e.dataTransfer.getData('text/plain').split(':');
      if (pid === playerId) {
        const from: SlotKey = src === 'active' ? 'active' : (Number(src) as SlotKey);
        if (from !== 'active') swapSlots(playerId, from, 'active');
      }
    },
  } as React.HTMLAttributes<HTMLDivElement>;

  // Drag-source-only props — on the inner card-sized div so the drag image is just the card
  const activeDragSourceProps: React.HTMLAttributes<HTMLDivElement> =
    player.activePokemon.name !== ''
      ? {
          draggable: true,
          onDragStart: (e) => {
            html5Source.current = 'active';
            e.dataTransfer.setData('text/plain', `${playerId}:active`);
            e.dataTransfer.effectAllowed = 'move';
          },
          onDragEnd: () => { html5Source.current = null; },
        } as React.HTMLAttributes<HTMLDivElement>
      : {};

  const activeSection = (
    <div className="flex-1 min-h-0 flex justify-center" {...activeDropProps}>
      <div className="w-1/5 h-full" {...activeDragSourceProps}>
        <MiniPokemonCard
          pokemon={player.activePokemon}
          playerId={playerId}
          slot="active"
          isActive
          {...cardProps('active')}
        />
      </div>
    </div>
  );

  const benchSection = (
    <div className="flex-1 min-h-0 flex gap-1">
      {player.bench.map((p, i) => (
        <div
          key={i}
          className="flex-1 min-w-0 h-full"
          {...wrapperDragProps(i as SlotKey, p.name !== '')}
        >
          <MiniPokemonCard
            pokemon={p}
            playerId={playerId}
            slot={i as 0 | 1 | 2 | 3 | 4}
            {...cardProps(i as SlotKey)}
          />
        </div>
      ))}
    </div>
  );

  const headerSection = (
    <div className="flex-shrink-0">
      <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
    </div>
  );

  // reversed: Header→Bench→Active so active is nearest center without rotation
  // faceToFace: rotate-180 with Active→Bench→Header (visually Header→Bench→Active)
  // normal: Active→Bench→Header (P2 default)
  if (orientation === 'reversed') {
    return (
      <div className="flex flex-col h-full gap-1">
        {headerSection}
        {benchSection}
        {activeSection}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full gap-1 ${orientation === 'faceToFace' ? 'rotate-180' : ''}`}>
      {activeSection}
      {benchSection}
      {headerSection}
    </div>
  );
}

function MiniSharedZone({ faceToFace, onToggleFaceToFace }: { faceToFace: boolean; onToggleFaceToFace: () => void }) {
  const {
    currentTurn, turnNumber, player1, player2,
    resetGame, setDisplayMode,
    toggleEnergyAttached, toggleSupporter,
  } = useGameStore();
  const theme = useTheme();
  const [showEndTurn, setShowEndTurn] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const currentPlayerName = currentTurn === 'player1' ? player1.name : player2.name;

  const TrackerPair = ({ pid, label }: { pid: PlayerId; label: string }) => {
    const p = pid === 'player1' ? player1 : player2;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-600 font-bold">{label}</span>
        <button
          onClick={() => toggleEnergyAttached(pid)}
          className={`px-2 py-0.5 rounded text-[9px] font-black border transition-colors ${
            !p.energyAttached
              ? 'bg-emerald-900/40 border-emerald-700/60 text-emerald-400'
              : 'bg-gray-800/40 border-gray-700/40 text-gray-600 line-through'
          }`}
        >⚡Nrg</button>
        <button
          onClick={() => toggleSupporter(pid)}
          className={`px-2 py-0.5 rounded text-[9px] font-black border transition-colors ${
            !p.supporterUsed
              ? 'bg-amber-900/40 border-amber-700/60 text-amber-400'
              : 'bg-gray-800/40 border-gray-700/40 text-gray-600 line-through'
          }`}
        >★ Sup</button>
      </div>
    );
  };

  return (
    <>
      <div className={`flex items-center gap-2 px-2 py-1.5 border-t border-b ${theme.centerBorder} ${theme.centerBg}`}>
        <TrackerPair pid="player1" label="P1" />
        <CoinFlip compact />
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">T{turnNumber}</span>
            <button
              onClick={() => setShowEndTurn(true)}
              className="flex-1 py-1.5 px-2 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 border border-blue-500 rounded-xl text-white text-[11px] font-black transition-all shadow-lg shadow-blue-900/40"
            >End {currentPlayerName}'s Turn →</button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowReset(true)}
              className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
            >↺ Reset</button>
            <span className={`text-[9px] ${theme.centerText}`}>·</span>
            <button
              onClick={onToggleFaceToFace}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                faceToFace
                  ? 'bg-blue-700/60 border-blue-500/60 text-blue-300'
                  : `${theme.centerText} border-transparent hover:text-gray-300`
              }`}
              title={faceToFace ? 'Switch to same-side' : 'Switch to face-to-face'}
            >⇅ {faceToFace ? 'FtF' : 'Side'}</button>
            <span className={`text-[9px] ${theme.centerText}`}>·</span>
            <button
              onClick={() => setDisplayMode('faceToFace')}
              className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
            >⊞ Mini ×</button>
          </div>
        </div>
        <DiceRoller compact />
        <TrackerPair pid="player2" label="P2" />
      </div>

      {showEndTurn && (
        <EndTurnModal currentPlayer={currentTurn} onClose={() => setShowEndTurn(false)} />
      )}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 text-center shadow-2xl">
            <div className="text-2xl mb-2">♻️</div>
            <h3 className="font-black text-white mb-1">Reset Game?</h3>
            <p className="text-xs text-gray-500 mb-4">All HP, damage, and status will be cleared.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)}
                className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold">Cancel</button>
              <button onClick={() => { resetGame(); setShowReset(false); }}
                className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-black">Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MiniGameBoard() {
  const theme = useTheme();
  const [faceToFace, setFaceToFace] = useState(false);
  return (
    <div className="flex flex-col h-full overflow-hidden p-2 gap-1" style={{ background: theme.appBg }}>
      <div className="flex-1 min-h-0">
        <MiniPlayerSection
          playerId="player1"
          orientation={faceToFace ? 'faceToFace' : 'reversed'}
        />
      </div>
      <MiniSharedZone faceToFace={faceToFace} onToggleFaceToFace={() => setFaceToFace(f => !f)} />
      <div className="flex-1 min-h-0">
        <MiniPlayerSection playerId="player2" orientation="normal" />
      </div>
    </div>
  );
}
