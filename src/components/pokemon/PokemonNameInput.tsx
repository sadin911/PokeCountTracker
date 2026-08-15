import { useState, useRef, useEffect, useCallback } from 'react';
import rawData from '../../data/pokemonNames.json';

interface CardEntry { name: string; hp: number | null; }
const pokemonData = rawData as CardEntry[];

interface Props {
  value: string;
  onChange: (name: string) => void;
  onCommit: () => void;
  onSelectSuggestion?: (hp: number | null) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;

export function PokemonNameInput({
  value,
  onChange,
  onCommit,
  onSelectSuggestion,
  placeholder = 'Pokémon name',
  className = '',
  autoFocus = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const suggestions = value.trim().length >= 1
    ? pokemonData
        .filter(e => e.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const showDropdown = open && suggestions.length > 0;

  const select = useCallback((entry: CardEntry) => {
    clearTimeout(blurTimer.current);
    onChange(entry.name);
    onSelectSuggestion?.(entry.hp);
    setOpen(false);
    onCommit();
  }, [onChange, onSelectSuggestion, onCommit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') onCommit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlighted]) select(suggestions[highlighted]);
      else onCommit();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => { setHighlighted(0); }, [value]);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  return (
    <div className="relative w-full">
      <input
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((entry, i) => (
            <button
              key={entry.name}
              type="button"
              onMouseDown={() => select(entry)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                i === highlighted ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="font-medium">{entry.name}</span>
              {entry.hp && (
                <span className={`text-xs font-mono ml-2 flex-shrink-0 ${
                  i === highlighted ? 'text-green-300' : 'text-gray-500'
                }`}>{entry.hp} HP</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
