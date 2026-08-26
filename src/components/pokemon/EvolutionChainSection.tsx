import { useMemo } from 'react';
import { getEvolutionChain, type EvolutionStep } from '../../utils/evolutionHelpers';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';

interface Props {
  currentCard: any;
  onSelectCard?: (card: any) => void;
}

export function EvolutionChainSection({ currentCard, onSelectCard }: Props) {
  const chain: EvolutionStep[] = useMemo(() => {
    return getEvolutionChain(currentCard);
  }, [currentCard]);

  if (!chain || chain.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2.5 pt-3 border-t border-slate-800/90">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧬</span>
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
            สายวิวัฒนาการ (Evolution Line)
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-semibold">
          {chain.length} ร่างในสาย
        </span>
      </div>

      {/* Evolution Chain Grid / Flex Container */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {chain.map((step, idx) => {
          const imgUrl = resolveCardImageUrl(
            step.representativeCard.imageUrl || step.representativeCard.imageUrlHigh
          );
          const isCurrent = step.isCurrent;

          return (
            <div key={`${step.name}-${idx}`} className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-[130px] sm:min-w-0 shrink-0">
              {idx > 0 && (
                <span className="text-slate-600 font-bold text-xs sm:text-sm select-none shrink-0 hidden sm:inline">
                  →
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onSelectCard && !isCurrent) {
                    onSelectCard(step.representativeCard);
                  }
                }}
                disabled={isCurrent}
                className={`group/evo relative w-full flex items-center gap-2 p-2 rounded-2xl border text-left transition-all duration-200 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50 cursor-default'
                    : 'bg-slate-950/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-600 cursor-pointer hover:scale-[1.02] active:scale-95'
                }`}
                title={
                  isCurrent
                    ? `${step.name} (การ์ดที่กำลังดูอยู่)`
                    : `คลิกเพื่อดูการ์ด ${step.name}`
                }
              >
                {/* Thumbnail */}
                <div className="relative w-8 h-11 rounded-lg overflow-hidden bg-slate-900 shrink-0 shadow-md">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={step.name}
                      loading="lazy"
                      onError={(e) =>
                        handleCardImageError(
                          e,
                          step.representativeCard.imageUrl,
                          step.representativeCard.officialImageUrl
                        )
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">
                      TCG
                    </div>
                  )}
                </div>

                {/* Text Details */}
                <div className="flex flex-col min-w-0 flex-1 pr-0.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span
                      className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                        step.stage === 'พื้นฐาน'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          : step.stage === 'ร่าง 1'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                          : step.stage === 'ร่าง 2'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                      }`}
                    >
                      {step.stage}
                    </span>

                    {isCurrent && (
                      <span className="text-[9px] font-black text-amber-400">
                        📍 ใบนี้
                      </span>
                    )}
                  </div>

                  <span className={`text-xs font-black truncate mt-1 transition-colors ${isCurrent ? 'text-amber-300' : 'text-white group-hover/evo:text-amber-300'}`}>
                    {step.name}
                  </span>

                  {step.englishName && (
                    <span className="text-[10px] text-slate-400 truncate">
                      {step.englishName}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
