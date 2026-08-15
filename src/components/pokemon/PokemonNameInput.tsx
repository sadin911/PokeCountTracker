import { useState, useRef, useEffect, useCallback } from 'react';
import pokemonNames from '../../data/pokemonNames.json';

interface Props {
  value: string;
  onChange: (name: string) => void;
  onCommit: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;

export function PokemonNameInput({
  value,
  onChange,
  onCommit,
  placeholder = 'Pokémon name',
  className = '',
  autoFocus = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const suggestions = value.trim().length >= 1
    ? (pokemonNames as string[]).filter(n =>
        n.toLowerCase().includes(value.toLowerCase())
      ).slice(0, MAX_SUGGESTIONS)
    : [];

  const showDropdown = open && suggestions.length > 0;

  const select = useCallback((name: string) => {
    clearTimeout(blurTimer.current);
    onChange(name);
    setOpen(false);
    onCommit();
  }, [onChange, onCommit]);

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
      select(suggestions[highlighted] ?? value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => { setHighlighted(0); }, [value]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((name, i) => (
            <button
              key={name}
              type="button"
              onMouseDown={() => select(name)}
              className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                i === highlighted
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
