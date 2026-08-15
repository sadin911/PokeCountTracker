import { useState } from 'react';
import type { StatusCondition } from '../../types/game';
import { STATUS_INFO, STATUS_ORDER } from '../../constants/statusConditions';

interface Props {
  status: StatusCondition;
  onChange: (status: StatusCondition) => void;
  compact?: boolean;
}

export function StatusBadge({ status, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const info = STATUS_INFO[status];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 border text-xs font-semibold transition-colors ${info.bgColor} ${info.color} ${info.borderColor}`}
      >
        <span>{info.emoji}</span>
        {!compact && <span>{info.label}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 left-0 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden w-44">
            {STATUS_ORDER.map(cond => {
              const si = STATUS_INFO[cond];
              return (
                <button
                  key={cond}
                  onClick={() => { onChange(cond); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    cond === status ? 'bg-gray-700 font-bold' : ''
                  } ${si.color}`}
                >
                  <span>{si.emoji}</span>
                  <span>{si.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
