import { useEffect } from 'react';
import { useGameStore, type GameMode } from './store/gameStore';
import { GameBoard } from './components/layout/GameBoard';
import { LorcanaGameBoard } from './components/lorcana/LorcanaGameBoard';
import { CollectionTracker } from './components/collection/CollectionTracker';

// Helper to determine mode from URL pathname, hash, or query params
function getModeFromURL(): GameMode {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const modeParam = search.get('mode')?.toLowerCase();
  const rawSearch = window.location.search.toLowerCase();

  if (
    path.includes('/collection') ||
    hash.includes('collection') ||
    modeParam === 'collection' ||
    rawSearch.includes('collection')
  ) {
    return 'collection';
  }
  if (
    path.includes('/lorcana') ||
    hash.includes('lorcana') ||
    modeParam === 'lorcana' ||
    rawSearch.includes('lorcana')
  ) {
    return 'lorcana';
  }
  return 'pokemon';
}

function updateURLForMode(mode: GameMode) {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '') || '';
  let targetPath = base ? `${base}/` : '/';

  if (mode === 'collection') {
    targetPath = `${base}/collection`;
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

  if (gameMode === 'collection') return <CollectionTracker />;
  if (gameMode === 'lorcana') return <LorcanaGameBoard />;
  return <GameBoard />;
}

export default App;
