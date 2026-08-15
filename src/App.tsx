import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/layout/GameBoard';

function App() {
  const displayMode = useGameStore(s => s.displayMode);

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode;
  }, [displayMode]);

  return <GameBoard />;
}

export default App;
