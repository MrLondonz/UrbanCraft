import React, { useState } from 'react';
import {
  Camera,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Layers,
  Footprints,
  Ruler,
  Sparkles,
  Grid,
  Sun,
  Sliders,
  Award,
  PlusCircle,
  Compass,
  RotateCcw,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import { ViewPerspective, MeasurementUnit, CameraPreset, RenderQuality, SnappingMode } from '../types/city';
import { sound } from '../utils/audio';

interface TopBarProps {
  viewMode: ViewPerspective;
  onToggleViewMode: () => void;
  onToggleFirstPerson: () => void;
  onOpenPolicies: () => void;
  onOpenMilestones: () => void;
  onOpenTemplates: () => void;
  onOpenPhoto: () => void;
  unclaimedMilestonesCount: number;
  isFreeMode: boolean;
  onToggleFreeMode: () => void;
  onClearToScratch: () => void;
  unit: MeasurementUnit;
  onToggleUnit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSetCameraPreset?: (preset: CameraPreset) => void;
  onResetCamera?: () => void;
  renderQuality: RenderQuality;
  onSetRenderQuality: (q: RenderQuality) => void;
  snapping: SnappingMode;
  onSetSnapping: (s: SnappingMode) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onToggleViewMode,
  onToggleFirstPerson,
  onOpenPolicies,
  onOpenMilestones,
  onOpenTemplates,
  onOpenPhoto,
  unclaimedMilestonesCount,
  isFreeMode,
  onToggleFreeMode,
  onClearToScratch,
  unit,
  onToggleUnit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSetCameraPreset,
  onResetCamera,
  renderQuality,
  onSetRenderQuality,
  snapping,
  onSetSnapping,
}) => {
  const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);
  const [isSnapMenuOpen, setIsSnapMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/90 px-4 flex items-center justify-between gap-3 z-40 select-none">
      {/* 1. Left: Brand & File Operations */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 mr-1">
          <span className="font-display text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
            <span className="text-sky-400">UrbanCraft</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-semibold">5D</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden xl:inline">Architectural Studio</span>
        </div>

        <div className="w-[1px] h-5 bg-slate-800 mx-0.5 hidden sm:block" />

        {/* File actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClearToScratch}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Start new project from empty land"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">New</span>
          </button>

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Open, Save, Import & Export Projects"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Project</span>
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

        {/* Undo & Redo */}
        <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Middle: View Modes & Camera Controls */}
      <div className="flex items-center gap-2">
        {/* View Mode Switcher (2D Blueprint vs 3D Realistic vs Walk) */}
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              if (viewMode !== '2d_blueprint') onToggleViewMode();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === '2d_blueprint'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Switch to 2D technical floor-plan CAD blueprint"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Plan</span>
          </button>

          <button
            onClick={() => {
              if (viewMode !== '3d') onToggleViewMode();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Switch to 3D photorealistic PBR rendering view"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3D Studio</span>
          </button>

          <button
            onClick={onToggleFirstPerson}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'first_person'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Walk down on streets in first-person view (F key)"
          >
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Walk (F)</span>
          </button>
        </div>

        {/* Camera Views Preset Dropdown */}
        {onSetCameraPreset && (
          <div className="relative hidden lg:block">
            <button
              onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              <span>Camera</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCameraMenuOpen && (
              <div
                className="absolute top-full mt-1.5 left-0 w-36 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 text-xs animate-in fade-in"
                onClick={() => setIsCameraMenuOpen(false)}
              >
                <button
                  onClick={() => onSetCameraPreset('orbit')}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 cursor-pointer"
                >
                  3D Orbit
                </button>
                <button
                  onClick={() => onSetCameraPreset('top')}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 cursor-pointer"
                >
                  Top (CAD Plan)
                </button>
                <button
                  onClick={() => onSetCameraPreset('front')}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 cursor-pointer"
                >
                  Front Elevation
                </button>
                <button
                  onClick={() => onSetCameraPreset('side')}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 cursor-pointer"
                >
                  Side Elevation
                </button>
                <button
                  onClick={() => onSetCameraPreset('iso')}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-slate-200 cursor-pointer"
                >
                  Isometric 45°
                </button>
                {onResetCamera && (
                  <button
                    onClick={onResetCamera}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-sky-400 font-semibold cursor-pointer border-t border-slate-800 mt-1"
                  >
                    Reset Camera
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right: Settings, Snapping, Quality, Snapshot */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Snapping Setting */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsSnapMenuOpen(!isSnapMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="Grid Snapping Resolution"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Snap: {snapping === 0 ? 'OFF' : `${snapping}m`}</span>
          </button>

          {isSnapMenuOpen && (
            <div
              className="absolute top-full mt-1.5 right-0 w-32 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 text-xs animate-in fade-in"
              onClick={() => setIsSnapMenuOpen(false)}
            >
              {[2.0, 1.0, 0.5, 0].map((s) => (
                <button
                  key={s}
                  onClick={() => onSetSnapping(s as SnappingMode)}
                  className={`px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                    snapping === s ? 'bg-sky-500/20 text-sky-300 font-bold' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  {s === 0 ? 'Free (Off)' : `${s}m Grid`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quality Toggle */}
        <button
          onClick={() => {
            onSetRenderQuality(renderQuality === 'ultra' ? 'performance' : 'ultra');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer hidden xl:flex ${
            renderQuality === 'ultra'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle between Ultra PBR (soft shadows) and Performance mode"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>{renderQuality === 'ultra' ? 'PBR Realism' : 'Performance'}</span>
        </button>

        {/* Free / Economy Mode */}
        <button
          onClick={onToggleFreeMode}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer hidden lg:flex ${
            isFreeMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle Free Architect Sandbox (Unlimited $0 funds)"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFreeMode ? 'Sandbox ∞' : 'Economy'}</span>
        </button>

        {/* Render Snapshot Photo */}
        <button
          onClick={onOpenPhoto}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer shrink-0"
          title="Render High-Resolution Architectural Screenshot"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Render</span>
        </button>
      </div>
    </header>
  );
};
