import React, { useState } from 'react';
import {
  Sliders,
  Armchair,
  Copy,
  Trash2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { PlacedBuilding, MeasurementUnit, BuildingCategory } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { sound } from '../utils/audio';

interface PlannerPropertiesRightProps {
  building: PlacedBuilding | null;
  allBuildings: PlacedBuilding[];
  onCustomize: (instanceId: string, updates: Partial<PlacedBuilding>) => void;
  onDemolish: (instanceId: string) => void;
  onDuplicate: (instanceId: string) => void;
  onOpenInterior: (building: PlacedBuilding) => void;
  unit?: MeasurementUnit;
}

export const PlannerPropertiesRight: React.FC<PlannerPropertiesRightProps> = ({
  building,
  allBuildings: _allBuildings,
  onCustomize,
  onDemolish,
  onDuplicate,
  onOpenInterior,
}) => {
  const [colorInput, setColorInput] = useState<string>(building?.color || '#b0b0b0');

  // Fallback defaults if no building selected
  const def = building ? BUILDING_MAP.get(building.defId) : null;
  const buildingIdName = building
    ? (building.customName || `Building_${building.instanceId.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0') || '006'}`)
    : 'None';

  const posX = building ? (building.x * 6 + 10.4).toFixed(1) : '128.4';
  const posY = building ? (building.y ? (building.y * 6 + 10.4).toFixed(1) : '64.2') : '64.2';
  const posZ = building ? (building.z * 6).toFixed(1) : '0.0';

  const floors = building?.customHeightFloors || 6;
  const height = floors * 4;
  const width = (building?.customWidth || 3) * 6;
  const depth = (building?.customDepth || 3) * 6 + 4;

  const currentType = def?.category || 'residential';
  const currentMaterial = building?.materialFinish || 'concrete';
  const currentRoof = building?.roofStyle || 'flat';
  const currentWindows = building?.windowsStyle || 'modern_glass';
  const isBalconyEnabled = building?.balcony !== false;

  const handleUpdateFloors = (delta: number) => {
    if (!building) return;
    const newFloors = Math.max(1, Math.min(24, floors + delta));
    onCustomize(building.instanceId, { customHeightFloors: newFloors });
    sound.playClick();
  };

  const handleUpdateWidth = (delta: number) => {
    if (!building) return;
    const curW = building.customWidth || 3;
    const newW = Math.max(1, Math.min(8, curW + delta));
    onCustomize(building.instanceId, { customWidth: newW });
    sound.playClick();
  };

  const handleUpdateDepth = (delta: number) => {
    if (!building) return;
    const curD = building.customDepth || 3;
    const newD = Math.max(1, Math.min(8, curD + delta));
    onCustomize(building.instanceId, { customDepth: newD });
    sound.playClick();
  };

  const handleUpdatePos = (axis: 'x' | 'z', delta: number) => {
    if (!building) return;
    const newX = axis === 'x' ? Math.max(0, Math.min(25, building.x + delta)) : building.x;
    const newZ = axis === 'z' ? Math.max(0, Math.min(25, building.z + delta)) : building.z;
    onCustomize(building.instanceId, { x: newX, z: newZ });
    sound.playClick();
  };

  if (!building) {
    return (
      <aside className="w-64 bg-[#0d121f] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4 select-none shrink-0 shadow-lg text-slate-300">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-white tracking-wider uppercase">PROPERTIES</h3>
        </div>
        <div className="text-xs text-slate-400 leading-relaxed py-8 text-center flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Sliders className="w-5 h-5" />
          </div>
          <p className="font-semibold text-slate-300">No Object Selected</p>
          <p className="text-[11px] text-slate-500 max-w-[180px]">
            Click any building, road, or landscape feature in the 3D viewport to inspect and transform it.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-68 bg-[#0d121f] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-4 select-none shrink-0 shadow-lg overflow-y-auto text-slate-200 text-xs">
      {/* 1. Header */}
      <div className="border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-white tracking-wider uppercase">PROPERTIES</h3>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Selected: <span className="text-slate-200 font-mono font-semibold">{buildingIdName}</span>
        </div>
      </div>

      {/* 2. TRANSFORM */}
      <div className="flex flex-col gap-1.5 border-b border-slate-800/60 pb-3">
        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">TRANSFORM</h4>
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 mb-1">Position</div>
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="p-1.5 bg-[#151c2e] border border-slate-800 rounded flex flex-col items-center">
              <span className="text-[9px] text-slate-500">X: {posX} m</span>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  onClick={() => handleUpdatePos('x', -1)}
                  className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdatePos('x', 1)}
                  className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-1.5 bg-[#151c2e] border border-slate-800 rounded flex flex-col items-center">
              <span className="text-[9px] text-slate-500">Y: {posY} m</span>
              <span className="text-[9px] text-slate-400 mt-1">Ground</span>
            </div>

            <div className="p-1.5 bg-[#151c2e] border border-slate-800 rounded flex flex-col items-center">
              <span className="text-[9px] text-slate-500">Z: {posZ} m</span>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  onClick={() => handleUpdatePos('z', -1)}
                  className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdatePos('z', 1)}
                  className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DIMENSIONS */}
      <div className="flex flex-col gap-1.5 border-b border-slate-800/60 pb-3">
        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">DIMENSIONS</h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Height</span>
            <span className="font-mono text-slate-200">{height} m</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Floors</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-200">{floors}</span>
              <div className="flex items-center gap-1 bg-[#151c2e] border border-slate-800 rounded p-0.5">
                <button
                  onClick={() => handleUpdateFloors(-1)}
                  className="w-4 h-4 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdateFloors(1)}
                  className="w-4 h-4 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Width</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-200">{width} m</span>
              <div className="flex items-center gap-1 bg-[#151c2e] border border-slate-800 rounded p-0.5">
                <button
                  onClick={() => handleUpdateWidth(-1)}
                  className="w-4 h-4 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdateWidth(1)}
                  className="w-4 h-4 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Depth</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-200">{depth} m</span>
              <div className="flex items-center gap-1 bg-[#151c2e] border border-slate-800 rounded p-0.5">
                <button
                  onClick={() => handleUpdateDepth(-1)}
                  className="w-4 h-4 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdateDepth(1)}
                  className="w-4 h-4 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BUILDING */}
      <div className="flex flex-col gap-2 border-b border-slate-800/60 pb-3">
        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">BUILDING</h4>
        
        {/* Type */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Type</span>
          <select
            value={currentType}
            onChange={(e) => {
              const val = e.target.value as BuildingCategory;
              onCustomize(building.instanceId, {
                customName: `${val.charAt(0).toUpperCase() + val.slice(1)} Block`,
              });
              sound.playClick();
            }}
            className="bg-[#151c2e] border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="civic">Civic</option>
            <option value="transport">Transport</option>
          </select>
        </div>

        {/* Material */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Material</span>
          <select
            value={currentMaterial}
            onChange={(e) => {
              onCustomize(building.instanceId, {
                materialFinish: e.target.value as any,
              });
              sound.playClick();
            }}
            className="bg-[#151c2e] border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="concrete">Concrete PBR</option>
            <option value="brick">Brick Red</option>
            <option value="timber">Timber Wood</option>
            <option value="glass">Glass Facade</option>
            <option value="stucco">White Stucco</option>
            <option value="steel">Brushed Steel</option>
          </select>
        </div>

        {/* Facade Color */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Facade Color:</span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded border border-slate-600 shadow-sm shrink-0"
              style={{ backgroundColor: colorInput }}
            />
            <input
              type="text"
              value={colorInput}
              onChange={(e) => {
                setColorInput(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onCustomize(building.instanceId, { color: e.target.value });
                }
              }}
              className="w-20 px-1.5 py-0.5 bg-[#151c2e] border border-slate-800 rounded text-[11px] font-mono text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. DETAILS */}
      <div className="flex flex-col gap-2 border-b border-slate-800/60 pb-3">
        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">DETAILS</h4>
        
        {/* Roof */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Roof</span>
          <select
            value={currentRoof}
            onChange={(e) => {
              onCustomize(building.instanceId, { roofStyle: e.target.value as any });
              sound.playClick();
            }}
            className="bg-[#151c2e] border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer capitalize"
          >
            <option value="flat">Flat</option>
            <option value="pitched">Pitched</option>
            <option value="mansard">Mansard</option>
            <option value="penthouse">Penthouse</option>
          </select>
        </div>

        {/* Windows */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Windows</span>
          <select
            value={currentWindows}
            onChange={(e) => {
              onCustomize(building.instanceId, { windowsStyle: e.target.value as any });
              sound.playClick();
            }}
            className="bg-[#151c2e] border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="modern_glass">Modern Glass</option>
            <option value="panoramic">Panoramic</option>
            <option value="ribbon">Ribbon</option>
          </select>
        </div>

        {/* Balcony */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Balcony</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">
              {isBalconyEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => {
                onCustomize(building.instanceId, { balcony: !isBalconyEnabled });
                sound.playClick();
              }}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                isBalconyEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Summary Stats Card */}
      <div className="p-2.5 rounded-lg bg-[#141b2d] border border-slate-800/80 text-[10px] space-y-1 text-slate-400">
        <div className="flex items-center justify-between">
          <span>Est. Cost: <strong className="text-slate-200 font-mono">${(width * depth * floors * 180).toLocaleString()}</strong></span>
          <span>Footprint: <strong className="text-slate-200 font-mono">{width * depth} m²</strong></span>
        </div>
        <div className="flex items-center justify-between">
          <span>Pop. Capacity: <strong className="text-emerald-400 font-mono">{floors * 12}</strong></span>
          <span>Floors: <strong className="text-sky-400 font-mono">{floors}F</strong></span>
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="flex flex-col gap-1.5 pt-1">
        <button
          onClick={() => {
            onOpenInterior(building);
            sound.playClick();
          }}
          className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Armchair className="w-3.5 h-3.5" />
          <span>Enter 3D Interior & Floorplan</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              onDuplicate(building.instanceId);
              sound.playClick();
            }}
            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => {
              onDemolish(building.instanceId);
              sound.playClick();
            }}
            className="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Demolish</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
