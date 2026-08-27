import { useEffect } from 'react';
import { useGameStore, type GameMode } from './store/gameStore';
import { GameBoard } from './components/layout/GameBoard';
import { CollectionTracker } from './components/collection/CollectionTracker';
import { DeckManager } from './components/deck/DeckManager';
import { AdminPage } from './components/admin/AdminPage';
import { BottomNav } from './components/layout/BottomNav';
import { trackEvent } from './utils/analytics';
import { useThemeStore } from './store/themeStore';

// Helper to determine mode from URL pathname, hash, or query params
function getModeFromURL(): GameMode {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const modeParam = search.get('mode')?.toLowerCase();
  const rawSearch = window.location.search.toLowerCase();

  if (
    path.includes('/admin') ||
    hash.includes('admin') ||
    modeParam === 'admin' ||
    rawSearch.includes('admin')
  ) {
    return 'admin';
  }
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

  if (mode === 'admin') {
    targetPath = `${base}/admin`;
  } else if (mode === 'deck') {
    targetPath = `${base}/deck`;
  } else if (mode === 'collection') {
    targetPath = `${base}/collection`;
  } else if (mode === 'pokemon') {
    targetPath = `${base}/battle`;
  }

  if (window.location.pathname !== targetPath) {
    window.history.pushState({ mode }, '', targetPath);
  }
}

function App() {
  const displayMode = useGameStore((s) => s.displayMode);
  const gameMode = useGameStore((s) => s.gameMode);
  const setGameMode = useGameStore((s) => s.setGameMode);

  // Initialize mode from URL and theme on mount
  useEffect(() => {
    useThemeStore.getState().initTheme();

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

  // Sync URL and log telemetry when gameMode state changes
  useEffect(() => {
    updateURLForMode(gameMode);
    trackEvent('navigation', 'page_view', gameMode);
  }, [gameMode]);

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode;
    document.documentElement.dataset.gameMode = gameMode;
  }, [displayMode, gameMode]);

  if (gameMode === 'admin') {
    return <AdminPage onBackToApp={() => setGameMode('collection')} />;
  }

  return (
    <div className={`w-full ${
      gameMode === 'pokemon'
        ? 'h-dvh h-screen overflow-hidden flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0'
        : 'min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0'
    }`}>
      {gameMode === 'deck' && <DeckManager />}
      {gameMode === 'collection' && <CollectionTracker />}
      {gameMode === 'pokemon' && (
        <div className="flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden">
          <GameBoard />
        </div>
      )}
      <BottomNav />
    </div>
  );
}

export default App;
