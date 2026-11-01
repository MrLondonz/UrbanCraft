import React from 'react';
import {
  Compass,
  Ruler,
  Layers,
  MousePointer,
  Grid,
  Activity,
  Box,
} from 'lucide-react';
import { PlacedBuilding, MeasurementUnit, ToolMode, ViewPerspective, BuildingDefinition } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { formatMeasurement } from '../utils/cityValidation';

interface BottomStatusBarProps {
  hoveredCoord: { x: number; z: number } | null;
  selectedBuilding: PlacedBuilding | null;
  hoveredBuilding: PlacedBuilding | null;
  selectedDef: BuildingDefinition | null;
  toolMode: ToolMode;
  viewMode: ViewPerspective;
  unit: MeasurementUnit;
  onToggleUnit: () => void;
  totalBuildingsCount: number;
  gameSpeed: number;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  hoveredCoord,
  selectedBuilding,
  hoveredBuilding,
  selectedDef,
  toolMode,
  viewMode,
  unit,
  onToggleUnit,
  totalBuildingsCount,
  gameSpeed,
}) => {
  // Determine relevant target object (inspected or hovered)
  const activeBuilding = selectedBuilding || hoveredBuilding;
  const activeDef = activeBuilding ? BUILDING_MAP.get(activeBuilding.defId) : null;

  // Active Dimensions
  let dimensionsDisplay = '—';
  if (activeBuilding && activeDef) {
    const w = activeBuilding.customWidth || activeDef.size[0] || 1;
    const d = activeBuilding.customDepth || activeDef.size[1] || 1;
    const h = activeBuilding.customHeightFloors || activeBuilding.level * 2;
    const wMeas = formatMeasurement(w, unit);
    const dMeas = formatMeasurement(d, unit);
    dimensionsDisplay = `${w}×${d} (${wMeas.length} × ${dMeas.length}) · ${h} Floors`;
  } else if (selectedDef && toolMode === 'plan') {
    const w = selectedDef.size[0];
    const d = selectedDef.size[1];
    const wMeas = formatMeasurement(w, unit);
    const dMeas = formatMeasurement(d, unit);
    dimensionsDisplay = `${w}×${d} (${wMeas.length} × ${dMeas.length}) Blueprint`;
  }

  // Editor Status Text
  let statusText = 'Ready';
  if (viewMode === 'first_person') {
    statusText = 'First-Person Mode · WASD to Walk · Mouse Drag to Look · ESC to Exit';
  } else if (toolMode === 'plan' && selectedDef) {
    statusText = `Placing: ${selectedDef.name} · Left-Click Ground to Construct · R to Rotate`;
  } else if (toolMode === 'vehicle') {
    statusText = 'Vehicle Spawner Active · Click Road Tile to Spawn Vehicle';
  } else if (toolMode === 'demolish') {
    statusText = 'Bulldoze Mode Active · Click Any Structure to Demolish';
  } else if (selectedBuilding && activeDef) {
    statusText = `Inspecting ${selectedBuilding.customName || activeDef.name} · Right Panel to Edit · D to Duplicate`;
  } else if (toolMode === 'inspect') {
    statusText = 'Inspect Tool Active · Click Any Building in Viewport';
  }

  // World coordinates (metric meters from center)
  const worldX = hoveredCoord ? ((hoveredCoord.x - 13) * 6).toFixed(0) : '—';
  const worldZ = hoveredCoord ? ((hoveredCoord.z - 13) * 6).toFixed(0) : '—';

  return (
    <footer className="h-7 w-full bg-slate-950/95 border-t border-slate-800/90 px-3 flex items-center justify-between text-[11px] text-slate-400 z-20 font-mono-data select-none overflow-x-auto">
      {/* Left: Pointer Coordinates & Snapping */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>
            Grid: <strong className="text-white">{hoveredCoord ? `${hoveredCoord.x}, ${hoveredCoord.z}` : '--, --'}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Pos: {worldX !== '—' ? `${worldX}m, ${worldZ}m` : '--, --'}
          </span>
        </div>

        <div className="w-[1px] h-3.5 bg-slate-800" />

        <div className="flex items-center gap-1.5 text-slate-300 hidden md:flex">
          <Grid className="w-3.5 h-3.5 text-emerald-400" />
          <span>Snap: <span className="text-emerald-400 font-medium">2.0m ON</span></span>
        </div>

        <div className="w-[1px] h-3.5 bg-slate-800 hidden md:block" />

        {/* Dimensions of active object or hovered target */}
        <div className="flex items-center gap-1.5 text-slate-300 hidden lg:flex">
          <Ruler className="w-3.5 h-3.5 text-amber-400" />
          <span>Dim: <strong className="text-white">{dimensionsDisplay}</strong></span>
        </div>
      </div>

      {/* Middle: Live Editor Status Prompt */}
      <div className="flex items-center gap-2 px-3 mx-auto text-slate-300 truncate font-sans text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
        <span className="truncate">{statusText}</span>
      </div>

      {/* Right: Units, Total Structures & Sim Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 hidden sm:flex">
          <Box className="w-3.5 h-3.5 text-slate-400" />
          <span>Objects: <strong className="text-slate-200">{totalBuildingsCount}</strong></span>
        </div>

        <div className="w-[1px] h-3.5 bg-slate-800 hidden sm:block" />

        <button
          onClick={onToggleUnit}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 hover:text-sky-200 transition-colors cursor-pointer text-[10px] font-semibold"
          title="Click to toggle Metric (m) / Imperial (ft)"
        >
          <span>Unit:</span>
          <strong className="text-white uppercase">{unit === 'metric' ? 'Metric (m)' : 'Imperial (ft)'}</strong>
        </button>

        <div className="w-[1px] h-3.5 bg-slate-800" />

        <div className="flex items-center gap-1 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">
            {gameSpeed === 0 ? 'Paused' : `${gameSpeed}x`}
          </span>
        </div>
      </div>
    </footer>
  );
};
