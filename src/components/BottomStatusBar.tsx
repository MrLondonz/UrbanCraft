import React from 'react';
import { PlacedBuilding } from '../types/city';

interface BottomStatusBarProps {
  statusMessage?: string;
  snapSetting?: string;
  layerSetting?: string;
  cameraAngleDeg?: number;
  selectedBuilding: PlacedBuilding | null;
  cursorCoord?: { x: number; z: number } | null;
  scaleRatio?: string;
  version?: string;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  statusMessage = 'Ready',
  snapSetting = 'Grid 1m',
  layerSetting = 'Buildings',
  cameraAngleDeg = 35,
  selectedBuilding,
  cursorCoord,
  scaleRatio = '1:200',
  version = '2024.5.1',
}) => {
  const selectionText = selectedBuilding
    ? 'Selection: 1 object'
    : cursorCoord
    ? `Cursor: ${cursorCoord.x * 2}m, ${cursorCoord.z * 2}m`
    : 'Selection: 0 objects';

  return (
    <footer className="h-7 bg-[#090d16] border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0 z-30">
      {/* 1. Left: Editor Ready State, Snapping, Layer, Angle */}
      <div className="flex items-center gap-2">
        <span className="text-slate-200">{statusMessage}</span>
        <span className="text-slate-600">|</span>
        <span>Snap: {snapSetting}</span>
        <span className="text-slate-600">|</span>
        <span>Layer: {layerSetting}</span>
        <span className="text-slate-600">|</span>
        <span>Angle: {Math.round(cameraAngleDeg)}°</span>
      </div>

      {/* 2. Center: Selection / Cursor Coordinates */}
      <div className="text-slate-300 font-semibold">
        {selectionText}
      </div>

      {/* 3. Right: Diagnostics & Engine Scale */}
      <div className="flex items-center gap-2">
        <span>FPS: 60</span>
        <span className="text-slate-600">|</span>
        <span>Mem: 1.2 GB / 8.0 GB</span>
        <span className="text-slate-600">|</span>
        <span>Scale {scaleRatio}</span>
        <span className="text-slate-600">|</span>
        <span>{version}</span>
      </div>
    </footer>
  );
};
