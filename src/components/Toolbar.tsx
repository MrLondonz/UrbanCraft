import React from 'react';
import {
  Hammer,
  MousePointer,
  Trash2,
  RotateCw,
  X,
  Layers,
  Armchair,
  Car,
  Route,
  Eye,
  Building,
  Undo2,
  Redo2,
  Footprints,
} from 'lucide-react';
import { ToolMode, BuildingDefinition, ViewPerspective, CutawayFloor } from '../types/city';

interface ToolbarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  selectedDef: BuildingDefinition | null;
  onClearSelectedDef: () => void;
  onOpenCatalog: () => void;
  onOpenCustomBuilder: () => void;
  onQuickRoad: () => void;
  onOpenVehicles: () => void;
  rotation: 0 | 90 | 180 | 270;
  onRotate: () => void;
  viewMode: ViewPerspective;
  onToggleViewMode: () => void;
  onToggleFirstPerson: () => void;
  hasSelectedBuilding?: boolean;
  onOpenInterior?: () => void;
  cutawayFloor: CutawayFloor;
  onSetCutawayFloor: (floor: CutawayFloor) => void;
  isFreeMode?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  onSetToolMode,
  selectedDef,
  onClearSelectedDef,
  onOpenCatalog,
  onOpenCustomBuilder,
  onQuickRoad,
  onOpenVehicles,
  rotation,
  onRotate,
  viewMode,
  onToggleViewMode,
  onToggleFirstPerson,
  hasSelectedBuilding,
  onOpenInterior,
  cutawayFloor,
  onSetCutawayFloor,
  isFreeMode = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 select-none">
      {/* Active Blueprint Floating Pill */}
      {selectedDef && toolMode === 'plan' && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-sky-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-3 text-xs text-white shadow-lg animate-in fade-in duration-150">
          <span className="font-medium text-sky-300">
            Placing: {selectedDef.name} ({selectedDef.size[0]}×{selectedDef.size[1]})
          </span>
          <span className="text-emerald-400 font-mono-data font-semibold">
            {isFreeMode ? 'FREE' : `$${selectedDef.cost}`}
          </span>
          <button
            onClick={onRotate}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium transition-colors cursor-pointer"
            title="Rotate (R key)"
          >
            <RotateCw className="w-3 h-3" />
            <span>{rotation}°</span>
          </button>
          <button
            onClick={onClearSelectedDef}
            className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Architectural Toolbar Bar */}
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 flex-wrap justify-center">
        {/* Undo & Redo (Core Requirement 9) */}
        <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-slate-800 mx-0.5" />

        {/* Catalog / Build Button */}
        <button
          onClick={() => {
            onSetToolMode('plan');
            onOpenCatalog();
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            toolMode === 'plan' && !selectedDef
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
          title="Open architecture catalog drawer"
        >
          <Hammer className="w-4 h-4" />
          <span>Catalog</span>
        </button>

        {/* Custom Building from Scratch (Core Requirement 2) */}
        <button
          onClick={onOpenCustomBuilder}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          title="Create custom building with custom width, depth & height"
        >
          <Building className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Custom Build</span>
        </button>

        {/* Quick Road Constructor */}
        <button
          onClick={onQuickRoad}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          title="Pave connected street network"
        >
          <Route className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Pave Road</span>
        </button>

        {/* Vehicles Spawner */}
        <button
          onClick={onOpenVehicles}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          title="Place cars, buses, and fleet"
        >
          <Car className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Vehicles</span>
        </button>

        {/* Rotate Button */}
        {selectedDef && (
          <button
            onClick={onRotate}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            title="Rotate 90 degrees (Press R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}

        {/* Inspect Tool */}
        <button
          onClick={() => {
            onClearSelectedDef();
            onSetToolMode('inspect');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            toolMode === 'inspect'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          <span>Inspect</span>
        </button>

        {/* Real-time Furnish Mode */}
        {hasSelectedBuilding && onOpenInterior && (
          <button
            onClick={onOpenInterior}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all cursor-pointer animate-in fade-in"
            title="Step inside and furnish this building in real time"
          >
            <Armchair className="w-4 h-4 text-indigo-400" />
            <span>Furnish</span>
          </button>
        )}

        {/* Demolish / Bulldoze Tool */}
        <button
          onClick={() => {
            onClearSelectedDef();
            onSetToolMode('demolish');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            toolMode === 'demolish'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-300 hover:text-rose-400 hover:bg-slate-900'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Bulldoze</span>
        </button>

        <div className="w-[1px] h-6 bg-slate-800 mx-0.5 hidden sm:block" />

        {/* First-Person Exploration View (Core Requirement 1) */}
        <button
          onClick={onToggleFirstPerson}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'first_person'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
          title="Street-level first-person exploration (walk with WASD, press F)"
        >
          <Footprints className="w-4 h-4 text-emerald-400" />
          <span>{viewMode === 'first_person' ? 'Walking' : 'Walk (F)'}</span>
        </button>

        {/* City Floor Cutaway Selector */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 px-1.5 flex items-center gap-1 font-medium">
            <Eye className="w-3 h-3 text-sky-400" />
            <span className="hidden xl:inline">Floors:</span>
          </span>
          {(['all', 1, 2, 3, 4] as const).map((fl) => (
            <button
              key={fl}
              onClick={() => onSetCutawayFloor(fl)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                cutawayFloor === fl
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={fl === 'all' ? 'View all floors & roofs' : `Cutaway view to Floor ${fl}`}
            >
              {fl === 'all' ? 'All' : fl === 4 ? 'Roof' : `L${fl}`}
            </button>
          ))}
        </div>

        {/* 2D / 3D Switch */}
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewMode === '2d_blueprint'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
          title="Toggle 2D Blueprint / 3D Isometric View"
        >
          <Layers className="w-4 h-4" />
          <span>{viewMode === '3d' ? '3D' : '2D'}</span>
        </button>
      </div>
    </div>
  );
};
