import React from 'react';
import { X, Sliders, DollarSign, TrendingUp, ShieldAlert, Heart, GraduationCap, Trees } from 'lucide-react';
import { TaxRates, ServiceFunding, CityMetrics } from '../types/city';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxRates: TaxRates;
  onUpdateTaxRates: (rates: TaxRates) => void;
  serviceFunding: ServiceFunding;
  onUpdateServiceFunding: (funding: ServiceFunding) => void;
  metrics: CityMetrics;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  taxRates,
  onUpdateTaxRates,
  serviceFunding,
  onUpdateServiceFunding,
  metrics,
}) => {
  if (!isOpen) return null;

  const netBalance = metrics.dailyIncome - metrics.dailyExpenses;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">City Budget & Taxation Policy</h3>
              <p className="text-xs text-slate-400">Adjust tax revenues and municipal department allocations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Revenue Overview Strip */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono-data">
            <div>
              <div className="text-slate-400 text-[11px] mb-1">Daily Tax Inflow</div>
              <div className="text-emerald-400 font-semibold text-sm">+${metrics.dailyIncome}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] mb-1">Daily Operations</div>
              <div className="text-rose-400 font-semibold text-sm">-${metrics.dailyExpenses}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] mb-1">Net Daily Margin</div>
              <div className={`font-semibold text-sm ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netBalance >= 0 ? `+$${netBalance}` : `-$${Math.abs(netBalance)}`}
              </div>
            </div>
          </div>

          {/* Tax Rates Sliders */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zoning Tax Rates</span>
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Residential Property Tax</span>
                  <span className="font-mono-data font-semibold text-sky-400">{taxRates.residential}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={taxRates.residential}
                  onChange={(e) => onUpdateTaxRates({ ...taxRates, residential: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Optimal: 8-10%. High taxes decrease citizen immigration.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Commercial Business Tax</span>
                  <span className="font-mono-data font-semibold text-amber-400">{taxRates.commercial}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={taxRates.commercial}
                  onChange={(e) => onUpdateTaxRates({ ...taxRates, commercial: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Industrial & Freight Tax</span>
                  <span className="font-mono-data font-semibold text-orange-400">{taxRates.industrial}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={taxRates.industrial}
                  onChange={(e) => onUpdateTaxRates({ ...taxRates, industrial: Number(e.target.value) })}
                  className="w-full accent-orange-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Department Budget Allocation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Public Service Subsidies</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 mb-2 text-slate-300 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                  <span>Police & Fire Safety</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1 font-mono-data">
                  <span className="text-slate-500">Allocation</span>
                  <span className="text-white font-semibold">{serviceFunding.safety}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={serviceFunding.safety}
                  onChange={(e) => onUpdateServiceFunding({ ...serviceFunding, safety: Number(e.target.value) })}
                  className="w-full accent-blue-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 mb-2 text-slate-300 font-medium">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Public Healthcare</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1 font-mono-data">
                  <span className="text-slate-500">Allocation</span>
                  <span className="text-white font-semibold">{serviceFunding.health}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={serviceFunding.health}
                  onChange={(e) => onUpdateServiceFunding({ ...serviceFunding, health: Number(e.target.value) })}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 mb-2 text-slate-300 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Schools & Education</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1 font-mono-data">
                  <span className="text-slate-500">Allocation</span>
                  <span className="text-white font-semibold">{serviceFunding.education}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={serviceFunding.education}
                  onChange={(e) => onUpdateServiceFunding({ ...serviceFunding, education: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 mb-2 text-slate-300 font-medium">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Parks & Ecology</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1 font-mono-data">
                  <span className="text-slate-500">Allocation</span>
                  <span className="text-white font-semibold">{serviceFunding.parks}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={serviceFunding.parks}
                  onChange={(e) => onUpdateServiceFunding({ ...serviceFunding, parks: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Apply Municipal Policies
          </button>
        </div>
      </div>
    </div>
  );
};
