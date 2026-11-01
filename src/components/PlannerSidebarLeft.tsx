import React, { useState, useMemo } from 'react';
import {
  Layers,
  Building2,
  Columns,
  DoorOpen,
  Maximize2,
  Armchair,
  Route,
  Trees,
  Car,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  RotateCw,
  Hammer,
  MousePointer,
  Trash2,
  Check,
} from 'lucide-react';
import { BuildingDefinition, ToolMode, PlacedBuilding, VehicleDefinition } from '../types/city';
import { BUILDINGS_CATALOG, BUILDING_MAP } from '../data/buildingsCatalog';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';
import { VEHICLES_CATALOG } from '../data/vehiclesCatalog';
import { sound } from '../utils/audio';

interface PlannerSidebarLeftProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  selectedDef: BuildingDefinition | null;
  onSelectBuilding: (def: BuildingDefinition) => void;
  onClearSelectedDef: () => void;
  onOpenCustomBuilder: () => void;
  onOpenInteriorStudio: () => void;
  hasSelectedBuilding: boolean;
  onSelectVehicleToPlace: (vehDef: VehicleDefinition, color: string) => void;
  currentFunds: number;
  isFreeMode: boolean;
}

type SidebarTab = 'structure' | 'buildings' | 'furniture' | 'landscape' | 'vehicles';

export const PlannerSidebarLeft: React.FC<PlannerSidebarLeftProps> = ({
  toolMode,
  onSetToolMode,
  selectedDef,
  onSelectBuilding,
  onClearSelectedDef,
  onOpenCustomBuilder,
  onOpenInteriorStudio,
  hasSelectedBuilding,
  onSelectVehicleToPlace,
  currentFunds,
  isFreeMode,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('structure');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered buildings by category or search
  const filteredBuildings = useMemo(() => {
    return BUILDINGS_CATALOG.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (searchQuery.trim()) return matchesSearch;

      if (activeTab === 'structure') {
        return (
          b.id.includes('road') ||
          b.id.includes('stairs') ||
          b.id.includes('lift') ||
          b.id.includes('plaza') ||
          b.category === 'transport'
        );
      }
      if (activeTab === 'buildings') {
        return b.category === 'residential' || b.category === 'commercial' || b.category === 'civic' || b.category === 'industrial';
      }
      if (activeTab === 'landscape') {
        return b.category === 'nature' || b.category === 'leisure' || b.id.includes('park') || b.id.includes('tree');
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  // Filtered furniture for preview
  const filteredFurniture = useMemo(() => {
    return FURNITURE_CATALOG.filter((f) => {
      return (
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return VEHICLES_CATALOG.filter((v) => {
      return (
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  return (
    <aside
      className={`absolute left-0 top-14 bottom-7 z-30 flex transition-all duration-300 select-none ${
        isOpen ? 'w-80' : 'w-14'
      }`}
    >
      {/* 1. Slim Left Category Icon Bar (Always Visible) */}
      <div className="w-14 h-full bg-slate-950/95 border-r border-slate-800/90 flex flex-col items-center py-3 gap-2 backdrop-blur-xl shrink-0">
        <button
          onClick={() => {
            setActiveTab('structure');
            setIsOpen(true);
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'structure' && isOpen
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Structure & Construction"
        >
          <Columns className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setActiveTab('buildings');
            setIsOpen(true);
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'buildings' && isOpen
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Architectural Buildings"
        >
          <Building2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setActiveTab('furniture');
            setIsOpen(true);
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'furniture' && isOpen
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Interiors & Furniture"
        >
          <Armchair className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setActiveTab('landscape');
            setIsOpen(true);
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'landscape' && isOpen
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Landscaping & Nature"
        >
          <Trees className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setActiveTab('vehicles');
            setIsOpen(true);
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'vehicles' && isOpen
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Transit & Vehicles"
        >
          <Car className="w-5 h-5" />
        </button>

        <div className="w-8 h-[1px] bg-slate-800 my-1" />

        {/* Quick Tools */}
        <button
          onClick={() => {
            onClearSelectedDef();
            onSetToolMode('inspect');
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            toolMode === 'inspect'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Select & Move Tool"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            onClearSelectedDef();
            onSetToolMode('demolish');
            sound.playClick();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            toolMode === 'demolish'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
          }`}
          title="Bulldoze / Demolish"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="mt-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Asset & Construction Panel */}
      {isOpen && (
        <div className="flex-1 h-full bg-slate-950/90 border-r border-slate-800/90 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>
                  {activeTab === 'structure' && 'Structure & Rooms'}
                  {activeTab === 'buildings' && 'Architectural Library'}
                  {activeTab === 'furniture' && 'Interior Furnishing'}
                  {activeTab === 'landscape' && 'Landscaping & Outdoors'}
                  {activeTab === 'vehicles' && 'Vehicles & Fleet'}
                </span>
              </h3>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-sans"
              />
            </div>
          </div>

          {/* Quick Actions Bar for Structure Tab */}
          {activeTab === 'structure' && (
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex flex-col gap-2">
              <button
                onClick={onOpenCustomBuilder}
                className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Custom Building from Scratch</span>
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    const road = BUILDING_MAP.get('road_paved');
                    if (road) onSelectBuilding(road);
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Route className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pave Road</span>
                </button>

                <button
                  onClick={() => {
                    const avenue = BUILDING_MAP.get('road_avenue');
                    if (avenue) onSelectBuilding(avenue);
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Route className="w-3.5 h-3.5 text-amber-400" />
                  <span>4-Lane Ave</span>
                </button>
              </div>
            </div>
          )}

          {/* Furniture Interior Studio Entrance Callout */}
          {activeTab === 'furniture' && hasSelectedBuilding && (
            <div className="p-3 border-b border-slate-800 bg-indigo-950/30">
              <button
                onClick={onOpenInteriorStudio}
                className="w-full py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Armchair className="w-4 h-4" />
                <span>Enter 3D Interior & Floorplan</span>
              </button>
            </div>
          )}

          {/* Asset List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {activeTab === 'vehicles' ? (
              // Vehicles Grid
              <div className="grid grid-cols-2 gap-2">
                {filteredVehicles.map((veh) => (
                  <div
                    key={veh.id}
                    onClick={() => {
                      onSelectVehicleToPlace(veh, veh.color);
                      sound.playClick();
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800/90 hover:border-sky-500/60 flex flex-col gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{veh.icon}</span>
                      <span className="text-[10px] text-emerald-400 font-mono-data font-semibold">
                        {isFreeMode ? 'FREE' : `$${veh.cost}`}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                        {veh.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{veh.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'furniture' && !hasSelectedBuilding ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/80 leading-relaxed">
                <Armchair className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-slate-200 mb-1">Select a Building First</p>
                <p>Click any building in the 3D viewport to step inside and arrange interior furniture.</p>
              </div>
            ) : (
              // Buildings & Structure Items Grid
              <div className="grid grid-cols-2 gap-2">
                {filteredBuildings.map((def) => {
                  const isSelected = selectedDef?.id === def.id && toolMode === 'plan';
                  const canAfford = isFreeMode || currentFunds >= def.cost;

                  return (
                    <div
                      key={def.id}
                      onClick={() => {
                        onSelectBuilding(def);
                        sound.playClick();
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer group select-none ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-500/30'
                          : canAfford
                          ? 'bg-slate-900/70 hover:bg-slate-800 border-slate-800/90 hover:border-slate-700'
                          : 'bg-slate-900/30 border-slate-800/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl group-hover:scale-110 transition-transform">{def.icon}</span>
                        <span className="text-[10px] text-emerald-400 font-mono-data font-semibold">
                          {isFreeMode ? 'FREE' : `$${def.cost}`}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                          {def.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-data">
                          {def.size[0]}×{def.size[1]} ({def.size[0] * 6}m × {def.size[1] * 6}m)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
