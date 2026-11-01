import React from 'react';
import { CameraPreset } from '../types/city';
import { sound } from '../utils/audio';

interface ViewportCameraControlsProps {
  currentPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
}

export const ViewportCameraControls: React.FC<ViewportCameraControlsProps> = ({
  currentPreset,
  onSelectPreset,
}) => {
  const presets: Array<{ id: CameraPreset; label: string }> = [
    { id: 'perspective', label: 'Perspective' },
    { id: 'top', label: 'Top' },
    { id: 'front', label: 'Front' },
    { id: 'orbit', label: 'Orbit' },
  ];

  return (
    <div className="absolute top-3 left-3 bg-[#0a0f1d]/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-0.5 shadow-lg z-20 flex items-center select-none">
      {presets.map((preset) => {
        const isActive = currentPreset === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => {
              onSelectPreset(preset.id);
              sound.playClick();
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-slate-700/90 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};
