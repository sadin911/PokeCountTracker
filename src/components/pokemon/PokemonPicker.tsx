import { useState } from 'react';
import { createPortal } from 'react-dom';
import { POKEMON_PRESETS } from '../../constants/pokemonPresets';

interface Props {
  onSelect: (name: string, hp: number) => void;
  onClose: () => void;
}

export function PokemonPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customMode, setCustomMode] = useState(false);

  const filtered = POKEMON_PRESETS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name: string, hp: number) => {
    onSelect(name, hp);
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-gray-700/60">
          <h3 className="text-sm font-bold text-gray-200 mb-3 text-center">Add Pokémon</h3>

          {!customMode ? (
            <input
              autoFocus
              type="text"
              placeholder="Search Pokémon…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-400 placeholder-gray-500"
            />
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Custom name…"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customName.trim() && handleSelect(customName.trim(), 100)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-400"
              />
              <button
                onClick={() => customName.trim() && handleSelect(customName.trim(), 100)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-xl text-sm font-bold"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Preset list */}
        {!customMode && (
          <div className="overflow-y-auto flex-1 p-2">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">No match found</p>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.map(p => (
                  <button
                    key={p.name}
                    onClick={() => handleSelect(p.name, p.hp)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-700 active:bg-gray-600 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-gray-100 truncate">{p.name}</span>
                    <span className="ml-3 shrink-0 text-xs font-bold text-green-400 bg-green-900/40 border border-green-700/50 rounded-lg px-2 py-0.5">
                      {p.hp} HP
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-700/60 flex gap-2">
          {customMode ? (
            <button
              onClick={() => setCustomMode(false)}
              className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold"
            >
              ← Back to list
            </button>
          ) : (
            <button
              onClick={() => setCustomMode(true)}
              className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold"
            >
              Custom name…
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
