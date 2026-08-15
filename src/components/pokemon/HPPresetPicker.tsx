import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HP_PRESETS } from '../../constants/hpPresets';

interface Props {
  currentMaxHP: number;
  onSelect: (hp: number) => void;
  onClose: () => void;
}

export function HPPresetPicker({ currentMaxHP, onSelect, onClose }: Props) {
  const [custom, setCustom] = useState('');

  const handleCustom = () => {
    const val = parseInt(custom, 10);
    if (val >= 10 && val <= 999) {
      onSelect(val);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-600 rounded-2xl p-4 w-80 max-h-96 overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-gray-200 mb-3 text-center">Set Max HP</h3>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {HP_PRESETS.map(hp => (
            <button
              key={hp}
              onClick={() => onSelect(hp)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                hp === currentMaxHP
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
              }`}
            >
              {hp}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Custom HP"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-500 rounded-lg px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-blue-400"
            min={10}
            max={999}
          />
          <button
            onClick={handleCustom}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold"
          >
            Set
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
