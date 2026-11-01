import React from 'react';
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
  const mapSize = 130; // px
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

  return (
    <div className="absolute bottom-4 right-4 bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-2xl z-20 flex flex-col items-center gap-1 select-none">
      <div
        onClick={handleClick}
        style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
        className="relative bg-[#0d1424] border border-slate-800 rounded-lg overflow-hidden cursor-crosshair shadow-inner"
        title="Click anywhere to pan camera directly"
      >
        {/* Radar grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`,
            backgroundSize: `${tileSize * 3}px ${tileSize * 3}px`,
          }}
        />

        {/* Road & Building footprints */}
        {buildings.map((b) => {
          const def = BUILDING_MAP.get(b.defId);
          const w = (b.customWidth || def?.size[0] || 1) * tileSize;
          const d = (b.customDepth || def?.size[1] || 1) * tileSize;
          const left = b.x * tileSize;
          const top = b.z * tileSize;
          const isSelected = selectedBuilding?.instanceId === b.instanceId;
          const isRoad = b.defId.includes('road') || b.defId.includes('avenue') || b.defId.includes('bridge');

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
                  : b.defId.includes('canal')
                  ? '#0284c7'
                  : b.defId.includes('tree') || b.defId.includes('park')
                  ? '#10b981'
                  : '#94a3b8',
              }}
              className={`absolute rounded-[1px] transition-all ${isSelected ? 'ring-1 ring-sky-300 z-10' : ''}`}
            />
          );
        })}
      </div>

      <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase font-mono">
        MINIMAP
      </span>
    </div>
  );
};
