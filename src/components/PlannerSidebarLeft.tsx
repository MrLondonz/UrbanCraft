import React from 'react';
import {
  MousePointer,
  Building2,
  Route,
  LayoutGrid,
  Mountain,
  Trees,
  Waves,
  Zap,
  Trash2,
  SlidersHorizontal,
  Footprints,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { ToolMode } from '../types/city';
import { sound } from '../utils/audio';

export type StudioTool =
  | 'select'
  | 'place_building'
  | 'road'
  | 'zone'
  | 'terrain'
  | 'greenery'
  | 'water'
  | 'utilities'
  | 'demolish';

export type CityTool = 'traffic' | 'pedestrian' | 'zoning' | 'analytics';

interface PlannerSidebarLeftProps {
  currentTool: StudioTool;
  onSelectTool: (tool: StudioTool) => void;
  onOpenTraffic: () => void;
  onOpenPedestrian: () => void;
  onToggleZoning: () => void;
  onOpenAnalytics: () => void;
  isTrafficActive?: boolean;
  isZoningActive?: boolean;
  onOpenCatalog?: () => void;
}

export const PlannerSidebarLeft: React.FC<PlannerSidebarLeftProps> = ({
  currentTool,
  onSelectTool,
  onOpenTraffic,
  onOpenPedestrian,
  onToggleZoning,
  onOpenAnalytics,
  isTrafficActive = true,
  isZoningActive = false,
  onOpenCatalog,
}) => {
  const constructionTools: Array<{ id: StudioTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Select', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'place_building', label: 'Place Building', icon: <Building2 className="w-4 h-4" /> },
    { id: 'road', label: 'Road', icon: <Route className="w-4 h-4" /> },
    { id: 'zone', label: 'Zone', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'terrain', label: 'Terrain', icon: <Mountain className="w-4 h-4" /> },
    { id: 'greenery', label: 'Greenery', icon: <Trees className="w-4 h-4" /> },
    { id: 'water', label: 'Water', icon: <Waves className="w-4 h-4" /> },
    { id: 'utilities', label: 'Utilities', icon: <Zap className="w-4 h-4" /> },
    { id: 'demolish', label: 'Demolish', icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-48 bg-[#0d121f] border border-slate-800/80 rounded-xl p-3 flex flex-col gap-5 select-none shrink-0 shadow-lg">
      {/* 1. CONSTRUCTION TOOLS */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-0.5">
          CONSTRUCTION TOOLS
        </h3>
        <div className="flex flex-col gap-1">
          {constructionTools.map((tool) => {
            const isActive = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.id);
                  if (tool.id === 'place_building' && onOpenCatalog) {
                    onOpenCatalog();
                  }
                  sound.playClick();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{tool.icon}</span>
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CITY TOOLS */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-0.5">
          CITY TOOLS
        </h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              onOpenTraffic();
              sound.playClick();
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isTrafficActive
                ? 'text-emerald-300 hover:bg-slate-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Traffic</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            onClick={() => {
              onOpenPedestrian();
              sound.playClick();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <Footprints className="w-4 h-4 text-sky-400" />
            <span>Pedestrian</span>
          </button>

          <button
            onClick={() => {
              onToggleZoning();
              sound.playClick();
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isZoningActive
                ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Zoning</span>
            </div>
            {isZoningActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          <button
            onClick={() => {
              onOpenAnalytics();
              sound.playClick();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
