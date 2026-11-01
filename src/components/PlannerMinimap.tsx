import React, { useState } from 'react';
import { Map, Eye, EyeOff } from 'lucide-react';
import { PlacedBuilding } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';

interface PlannerMinimapProps {
  buildings: PlacedBuilding[];
  gridSize?: number;
  onJumpToCoord: (coord: { x: number; z: number }) => void;
  selectedBuilding: PlacedBuilding | null;
}

export const PlannerMinimap: React.FC<PlannerMinimapProps> = ({
  buildings,
  gridSize = 26,
  onJumpToCoord,
  selectedBuilding,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mapSize = 140; // px
  const tileSize = mapSize / gridSize;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const gx = Math.floor(clickX / tileSize);
    const gz = Math.floor(clickY / tileSize);

    if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
      onJumpToCoord({ x: gx, z: gz });
    }
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-28 right-6 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2 rounded-xl text-slate-300 hover:text-white shadow-xl z-20 cursor-pointer transition-all hover:bg-slate-900"
        title="Show City Minimap Overview"
      >
        <Map className="w-4 h-4 text-sky-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-28 right-6 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-20 flex flex-col gap-1.5 animate-in fade-in select-none">
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
        <span className="flex items-center gap-1.5 text-slate-200">
          <Map className="w-3 h-3 text-sky-400" />
          <span>City Radar</span>
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
          title="Minimize radar"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onClick={handleClick}
        style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
        className="relative bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair shadow-inner"
        title="Click anywhere to pan camera directly there"
      >
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`,
            backgroundSize: `${tileSize * 4}px ${tileSize * 4}px`,
          }}
        />

        {/* Buildings & Roads */}
        {buildings.map((b) => {
          const def = BUILDING_MAP.get(b.defId);
          const w = (b.customWidth || def?.size[0] || 1) * tileSize;
          const d = (b.customDepth || def?.size[1] || 1) * tileSize;
          const left = b.x * tileSize;
          const top = b.z * tileSize;
          const isSelected = selectedBuilding?.instanceId === b.instanceId;
          const isRoad = b.defId.includes('road') || b.defId.includes('avenue') || b.defId.includes('plaza');

          return (
            <div
              key={b.instanceId}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${Math.max(2, w)}px`,
                height: `${Math.max(2, d)}px`,
                backgroundColor: isSelected
                  ? '#38bdf8'
                  : isRoad
                  ? '#64748b'
                  : b.color || '#e2e8f0',
              }}
              className={`absolute rounded-xs pointer-events-none transition-all ${
                isSelected ? 'ring-1 ring-white z-10' : ''
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono-data">
        <span>Click to center view</span>
        <span className="text-sky-400 font-semibold">{buildings.length} obj</span>
      </div>
    </div>
  );
};
