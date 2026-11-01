import React from 'react';
import {
  Box,
  FileText,
  Save,
  Share2,
  Undo2,
  Redo2,
  Camera,
  Settings,
  Minus,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface TopBarProps {
  projectName?: string;
  hasUnsavedChanges?: boolean;
  onNew: () => void;
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenPhoto: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName = 'Downtown Block A',
  hasUnsavedChanges = true,
  onNew,
  onSave,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenPhoto,
  onOpenSettings,
}) => {
  return (
    <header className="h-14 bg-[#0d121f] border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 z-40 select-none shrink-0">
      {/* 1. Left: Brand & Project Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
          <Box className="w-5 h-5 stroke-[1.75]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-[15px] tracking-tight text-white leading-tight">
              UrbanCraft 5D
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            City Planner — {projectName} • Prototype • {hasUnsavedChanges ? 'Unsaved changes*' : 'Saved'}
          </div>
        </div>
      </div>

      {/* 2. Center: File Actions Group [New, Save, Export] */}
      <div className="flex items-center bg-[#151c2e] border border-slate-800 rounded-lg p-0.5 shadow-sm">
        <button
          onClick={() => {
            onNew();
            sound.playClick();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Start new project from scratch"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>New</span>
        </button>

        <button
          onClick={() => {
            onSave();
            sound.playClick();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border-l border-slate-800/60"
          title="Save project to local storage (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5 text-slate-400" />
          <span>Save</span>
        </button>

        <button
          onClick={() => {
            onExport();
            sound.playClick();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border-l border-slate-800/60"
          title="Export project as JSON file"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Export</span>
        </button>
      </div>

      {/* 3. Right: Studio Action Buttons & Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1">
          {/* Undo */}
          <button
            onClick={() => {
              onUndo();
              sound.playClick();
            }}
            disabled={!canUndo}
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-[9px] font-medium leading-none mt-0.5">Undo</span>
          </button>

          {/* Redo */}
          <button
            onClick={() => {
              onRedo();
              sound.playClick();
            }}
            disabled={!canRedo}
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
            <span className="text-[9px] font-medium leading-none mt-0.5">Redo</span>
          </button>

          {/* View / Render Snapshot */}
          <button
            onClick={() => {
              onOpenPhoto();
              sound.playClick();
            }}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="View High-Resolution Render & Snapshots"
          >
            <Camera className="w-4 h-4" />
            <span className="text-[9px] font-medium leading-none mt-0.5">View</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              onOpenSettings();
              sound.playClick();
            }}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Studio Settings, Budget & Policies"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px] font-medium leading-none mt-0.5">Settings</span>
          </button>
        </div>

        {/* User Avatar circle [JG] */}
        <div
          className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md select-none ring-1 ring-indigo-400/40"
          title="Architect Profile (JG)"
        >
          JG
        </div>

        {/* Window control button [-] */}
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            } else {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }}
          className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
