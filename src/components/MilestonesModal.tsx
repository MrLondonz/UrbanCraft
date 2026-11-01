import React from 'react';
import { X, Award, CheckCircle2, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Milestone, CityMetrics } from '../types/city';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: Milestone[];
  onClaim: (id: string) => void;
  metrics: CityMetrics;
  buildingCount: number;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  isOpen,
  onClose,
  milestones,
  onClaim,
  metrics,
  buildingCount,
}) => {
  if (!isOpen) return null;

  const handleClaim = (m: Milestone) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClaim(m.id);
  };

  const getCurrentProgress = (m: Milestone): number => {
    switch (m.targetMetric) {
      case 'population':
        return metrics.population;
      case 'funds':
        return metrics.funds;
      case 'happiness':
        return metrics.happiness;
      case 'buildings':
        return buildingCount;
      case 'greenEnergy':
        return metrics.powerProduced;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">City Milestones & Quests</h3>
              <p className="text-xs text-slate-400">Expand your metropolis and unlock civic treasury grants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Milestones List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {milestones.map((m) => {
            const currentVal = getCurrentProgress(m);
            const progressPct = Math.min(100, Math.round((currentVal / m.targetValue) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  m.claimed
                    ? 'bg-slate-900/30 border-slate-800/40 opacity-70'
                    : m.completed
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-sm">{m.title}</h4>
                      {m.claimed && (
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  {/* Rewards badge */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono-data font-semibold text-amber-400 block">
                      +${m.rewardFunds.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-sky-400 block font-mono-data">
                      +{m.rewardPop} citizens
                    </span>
                  </div>
                </div>

                {/* Progress bar and Claim Button */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono-data mb-1">
                      <span>Progress</span>
                      <span>
                        {currentVal.toLocaleString()} / {m.targetValue.toLocaleString()} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          m.completed ? 'bg-amber-400' : 'bg-sky-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {m.completed && !m.claimed && (
                    <button
                      onClick={() => handleClaim(m)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Claim Grant</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
