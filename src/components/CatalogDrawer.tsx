import React, { useState } from 'react';
import {
  Car,
  Home,
  Store,
  Factory,
  Shield,
  Trees,
  Waves,
  X,
  Search,
  Zap,
  Droplets,
  DollarSign,
  Maximize2,
} from 'lucide-react';
import { BuildingCategory, BuildingDefinition } from '../types/city';
import { BUILDINGS_CATALOG } from '../data/buildingsCatalog';

interface CatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDefId: string | null;
  onSelectBuilding: (def: BuildingDefinition) => void;
  currentFunds: number;
  isFreeMode?: boolean;
}

const CATEGORIES: Array<{ id: BuildingCategory; label: string; icon: React.ElementType }> = [
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'residential', label: 'Residential', icon: Home },
  { id: 'commercial', label: 'Commercial', icon: Store },
  { id: 'industrial', label: 'Utilities & Industry', icon: Factory },
  { id: 'civic', label: 'Civic Services', icon: Shield },
  { id: 'leisure', label: 'Parks & Leisure', icon: Trees },
  { id: 'nature', label: 'Nature & Canals', icon: Waves },
];

export const CatalogDrawer: React.FC<CatalogDrawerProps> = ({
  isOpen,
  onClose,
  selectedDefId,
  onSelectBuilding,
  currentFunds,
  isFreeMode = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory>('residential');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredBuildings = BUILDINGS_CATALOG.filter((b) => {
    const matchesCategory = searchQuery.trim() ? true : b.category === activeCategory;
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl max-h-[460px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="font-display font-bold text-white text-base">Architectural Catalog</div>
          <span className="text-xs text-slate-400">Select an element to place on the urban grid</span>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search buildings & roads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 sm:w-64"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery.trim() && (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Buildings Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto max-h-[320px]">
        {filteredBuildings.map((def) => {
          const isSelected = selectedDefId === def.id;
          const canAfford = isFreeMode || currentFunds >= def.cost;

          return (
            <div
              key={def.id}
              onClick={() => {
                if (canAfford) {
                  onSelectBuilding(def);
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/20'
                  : canAfford
                  ? 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60'
                  : 'bg-slate-900/30 border-slate-800/40 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-semibold text-white text-xs tracking-tight line-clamp-1">{def.name}</h4>
                  <div className="flex items-center gap-1 font-mono-data text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
                    {isFreeMode ? (
                      <span className="text-[11px] font-bold text-amber-300">FREE</span>
                    ) : (
                      <>
                        <DollarSign className="w-3 h-3 -mr-0.5" />
                        <span>{def.cost}</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {def.description}
                </p>
              </div>

              {/* Attributes & Metrics */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono-data">
                <span className="flex items-center gap-1 text-slate-400">
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span>{def.size[0]}×{def.size[1]}</span>
                </span>

                <div className="flex items-center gap-2">
                  {def.powerDelta !== 0 && (
                    <span className={`flex items-center gap-0.5 ${def.powerDelta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <Zap className="w-2.5 h-2.5" />
                      <span>{def.powerDelta < 0 ? `+${Math.abs(def.powerDelta)}` : `-${def.powerDelta}`}</span>
                    </span>
                  )}
                  {def.waterDelta !== 0 && (
                    <span className={`flex items-center gap-0.5 ${def.waterDelta < 0 ? 'text-cyan-400' : 'text-sky-300'}`}>
                      <Droplets className="w-2.5 h-2.5" />
                      <span>{def.waterDelta < 0 ? `+${Math.abs(def.waterDelta)}` : `-${def.waterDelta}`}</span>
                    </span>
                  )}
                  {def.populationCapacity > 0 && (
                    <span className="text-slate-300">+{def.populationCapacity} pop</span>
                  )}
                  {def.jobsProvided > 0 && (
                    <span className="text-indigo-300">+{def.jobsProvided} jobs</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
