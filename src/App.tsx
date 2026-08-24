import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/layout/GameBoard';
import { LorcanaGameBoard } from './components/lorcana/LorcanaGameBoard';
import { CollectionTracker } from './components/collection/CollectionTracker';

function App() {
  const displayMode = useGameStore(s => s.displayMode);
  const gameMode = useGameStore(s => s.gameMode);

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode;
  }, [displayMode]);

  if (gameMode === 'lorcana') return <LorcanaGameBoard />;
  if (gameMode === 'collection') return <CollectionTracker />;
  return <GameBoard />;
}

export default App;
