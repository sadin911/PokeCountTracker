import { useEffect } from 'react';
import { useGameStore, type GameMode } from './store/gameStore';
import { GameBoard } from './components/layout/GameBoard';
import { LorcanaGameBoard } from './components/lorcana/LorcanaGameBoard';
import { CollectionTracker } from './components/collection/CollectionTracker';
import { DeckManager } from './components/deck/DeckManager';

// Helper to determine mode from URL pathname, hash, or query params
function getModeFromURL(): GameMode {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const modeParam = search.get('mode')?.toLowerCase();
  const rawSearch = window.location.search.toLowerCase();

  if (
    path.includes('/deck') ||
    hash.includes('deck') ||
    modeParam === 'deck' ||
    rawSearch.includes('deck')
  ) {
    return 'deck';
  }
  if (
    path.includes('/battle') ||
    path.includes('/game') ||
    path.includes('/pokemon') ||
    path.includes('/play') ||
    hash.includes('battle') ||
    hash.includes('game') ||
    hash.includes('pokemon') ||
    modeParam === 'battle' ||
    modeParam === 'pokemon' ||
    modeParam === 'game' ||
    rawSearch.includes('battle') ||
    rawSearch.includes('pokemon')
  ) {
    return 'pokemon';
  }
  if (
    path.includes('/lorcana') ||
    hash.includes('lorcana') ||
    modeParam === 'lorcana' ||
    rawSearch.includes('lorcana')
  ) {
    return 'lorcana';
  }
  if (
    path.includes('/collection') ||
    hash.includes('collection') ||
    modeParam === 'collection' ||
    rawSearch.includes('collection')
  ) {
    return 'collection';
  }

  // Default: Root URL or unmatched path defaults to Collection Tracker
  return 'collection';
}

function updateURLForMode(mode: GameMode) {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '') || '';
  let targetPath = `${base}/collection`;

  if (mode === 'deck') {
    targetPath = `${base}/deck`;
  } else if (mode === 'collection') {
    targetPath = `${base}/collection`;
  } else if (mode === 'pokemon') {
    targetPath = `${base}/battle`;
  } else if (mode === 'lorcana') {
    targetPath = `${base}/lorcana`;
  }

  if (window.location.pathname !== targetPath) {
    window.history.pushState({ mode }, '', targetPath);
  }
}

function App() {
  const displayMode = useGameStore((s) => s.displayMode);
  const gameMode = useGameStore((s) => s.gameMode);
  const setGameMode = useGameStore((s) => s.setGameMode);

  // Initialize mode from URL on mount
  useEffect(() => {
    const initialMode = getModeFromURL();
    if (initialMode !== gameMode) {
      setGameMode(initialMode);
    }

    const handlePopState = () => {
      const currentMode = getModeFromURL();
      setGameMode(currentMode);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync URL when gameMode state changes
  useEffect(() => {
    updateURLForMode(gameMode);
  }, [gameMode]);

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode;
    document.documentElement.dataset.gameMode = gameMode;
  }, [displayMode, gameMode]);

  if (gameMode === 'deck') return <DeckManager />;
  if (gameMode === 'collection') return <CollectionTracker />;
  if (gameMode === 'lorcana') return <LorcanaGameBoard />;
  return <GameBoard />;
}

export default App;
