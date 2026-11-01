import React, { useState } from 'react';
import {
  X,
  Sliders,
  Maximize2,
  RotateCw,
  Copy,
  Trash2,
  Armchair,
  Layers,
  Sun,
  Eye,
  Lock,
  Unlock,
  Check,
  Edit2,
  Palette,
  AlertTriangle,
  Move,
  Sparkles,
} from 'lucide-react';
import { PlacedBuilding, MeasurementUnit, RenderQuality, TimeOfDay } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { validateBuildingPlacement, formatMeasurement } from '../utils/cityValidation';
import { sound } from '../utils/audio';

interface PlannerPropertiesRightProps {
  building: PlacedBuilding | null;
  allBuildings: PlacedBuilding[];
  onClose: () => void;
  onCustomize: (instanceId: string, updates: Partial<PlacedBuilding>) => void;
  onDemolish: (instanceId: string) => void;
  onDuplicate: (instanceId: string) => void;
  onOpenInterior: (building: PlacedBuilding) => void;
  onFocusObject?: (coord: { x: number; z: number }) => void;
  unit: MeasurementUnit;
  renderQuality: RenderQuality;
  onSetRenderQuality: (q: RenderQuality) => void;
  timeOfDay: TimeOfDay;
  onSetTimeOfDay: (t: TimeOfDay) => void;
  onSetSunExposure?: (exposure: number) => void;
}

const PBR_FINISHES = [
  { id: 'concrete', label: 'Concrete', color: '#94a3b8' },
  { id: 'brick', label: 'Red Brick', color: '#b95d46' },
  { id: 'timber', label: 'Cedar Timber', color: '#a47148' },
  { id: 'glass', label: 'Glass Curtain', color: '#7eb3de' },
  { id: 'stucco', label: 'White Stucco', color: '#f1f5f9' },
  { id: 'steel', label: 'Brushed Steel', color: '#64748b' },
];

export const PlannerPropertiesRight: React.FC<PlannerPropertiesRightProps> = ({
  building,
  allBuildings,
  onClose,
  onCustomize,
  onDemolish,
  onDuplicate,
  onOpenInterior,
  onFocusObject,
  unit,
  renderQuality,
  onSetRenderQuality,
  timeOfDay,
  onSetTimeOfDay,
  onSetSunExposure,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameText, setNameText] = useState('');
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [exposureVal, setExposureVal] = useState(1.05);

  const def = building ? BUILDING_MAP.get(building.defId) : null;
  const displayName = building?.customName || def?.name || 'Selected Object';

  // Current dimensions
  const curWidth = building?.customWidth || def?.size[0] || 1;
  const curDepth = building?.customDepth || def?.size[1] || 1;
  const curFloors = building?.customHeightFloors || (building ? building.level * 2 : 1);
  const curElevation = building?.y || 0;

  const widthMeas = formatMeasurement(curWidth, unit);
  const depthMeas = formatMeasurement(curDepth, unit);

  const handleSaveName = () => {
    if (building && nameText.trim()) {
      onCustomize(building.instanceId, { customName: nameText.trim() });
    }
    setIsEditingName(false);
  };

  const handleAdjustDimension = (field: 'customWidth' | 'customDepth' | 'customHeightFloors', delta: number) => {
    if (!building) return;
    setValidationWarning(null);

    let newWidth = curWidth;
    let newDepth = curDepth;
    let newFloors = curFloors;

    if (field === 'customWidth') newWidth = Math.max(1, Math.min(6, curWidth + delta));
    if (field === 'customDepth') newDepth = Math.max(1, Math.min(6, curDepth + delta));
    if (field === 'customHeightFloors') newFloors = Math.max(1, Math.min(12, curFloors + delta));

    if (field === 'customWidth' || field === 'customDepth') {
      const validation = validateBuildingPlacement(
        { x: building.x, z: building.z, width: newWidth, depth: newDepth },
        allBuildings,
        26,
        building.instanceId
      );

      if (!validation.valid) {
        setValidationWarning(validation.reason || 'Collision detected with existing structure');
        return;
      }
    }

    onCustomize(building.instanceId, {
      customWidth: newWidth,
      customDepth: newDepth,
      customHeightFloors: newFloors,
    });
    sound.playClick();
  };

  const handleRotate = () => {
    if (!building) return;
    const nextRot = ((building.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onCustomize(building.instanceId, { rotation: nextRot });
    sound.playRotate();
  };

  // If no object is selected, show general project & environment parameters
  if (!building) {
    return (
      <aside className="absolute right-6 top-16 w-80 bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl z-20 p-4 flex flex-col gap-4 animate-in fade-in select-none">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Project & Lighting</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono-data">{allBuildings.length} Placed</span>
        </div>

        {/* Rendering Pipeline Quality */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Rendering Pipeline</span>
            <span className="text-[10px] text-sky-400 font-mono-data font-bold uppercase">{renderQuality}</span>
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                onSetRenderQuality('ultra');
                sound.playClick();
              }}
              className={`py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                renderQuality === 'ultra'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              Ultra PBR
            </button>
            <button
              onClick={() => {
                onSetRenderQuality('performance');
                sound.playClick();
              }}
              className={`py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                renderQuality === 'performance'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {/* Daylight & Sun Illumination */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Natural Sun & Sky</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {(['day', 'sunset', 'night'] as TimeOfDay[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  onSetTimeOfDay(t);
                  sound.playClick();
                }}
                className={`py-1.5 rounded-lg border capitalize font-medium transition-all cursor-pointer ${
                  timeOfDay === t
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Mapping Exposure */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Camera Exposure</span>
            <span className="font-mono-data text-[11px] text-sky-400">{exposureVal.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.05"
            value={exposureVal}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setExposureVal(val);
              if (onSetSunExposure) onSetSunExposure(val);
            }}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          Click any building, road, or landscape element in the 3D viewport to inspect exact dimensions, PBR materials, and coordinates.
        </div>
      </aside>
    );
  }

  return (
    <aside className="absolute right-6 top-16 w-84 max-h-[85vh] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl z-20 p-4 flex flex-col gap-4 animate-in fade-in duration-200 select-none">
      {/* Header & Rename */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-sky-500 rounded text-xs text-white focus:outline-none"
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1 text-emerald-400 hover:bg-slate-800 rounded">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <h3 className="font-bold text-white text-sm truncate">{displayName}</h3>
              <button
                onClick={() => {
                  setNameText(displayName);
                  setIsEditingName(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-0.5"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
          <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
            {def?.category || 'Architectural Object'} · Level {building.level}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onCustomize(building.instanceId, { isLocked: !building.isLocked })}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              building.isLocked ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={building.isLocked ? 'Unlock Object' : 'Lock Object Position'}
          >
            {building.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Warning Notice */}
      {validationWarning && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{validationWarning}</span>
        </div>
      )}

      {/* Dimensions & Floor Height Editor */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Exact Dimensions</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono-data">({unit})</span>
        </h4>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {/* Width */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">Width (X)</span>
            <span className="font-bold text-white my-1 font-mono-data">{widthMeas.length}</span>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handleAdjustDimension('customWidth', -1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold"
              >
                -
              </button>
              <button
                onClick={() => handleAdjustDimension('customWidth', 1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Depth */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">Depth (Z)</span>
            <span className="font-bold text-white my-1 font-mono-data">{depthMeas.length}</span>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handleAdjustDimension('customDepth', -1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold"
              >
                -
              </button>
              <button
                onClick={() => handleAdjustDimension('customDepth', 1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Height Floors */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">Floors</span>
            <span className="font-bold text-white my-1 font-mono-data">{curFloors}F</span>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handleAdjustDimension('customHeightFloors', -1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold"
              >
                -
              </button>
              <button
                onClick={() => handleAdjustDimension('customHeightFloors', 1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Position & Rotation */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-emerald-400" />
            <span>Position & Alignment</span>
          </span>
          <button
            onClick={handleRotate}
            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>Rotate {building.rotation}°</span>
          </button>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Tile (X, Z):</span>
            <span className="text-white font-bold">{building.x}, {building.z}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Elevation:</span>
            <span className="text-white font-bold">{curElevation.toFixed(1)}m</span>
          </div>
        </div>
      </div>

      {/* PBR Surface Materials & Finishes */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>PBR Surface Material</span>
        </h4>

        <div className="grid grid-cols-3 gap-1.5">
          {PBR_FINISHES.map((fin) => {
            const isSelected = building.materialFinish === fin.id;
            return (
              <button
                key={fin.id}
                onClick={() => {
                  onCustomize(building.instanceId, {
                    materialFinish: fin.id as any,
                    color: fin.color,
                  });
                  sound.playClick();
                }}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400 text-sky-200 ring-1 ring-sky-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fin.color }} />
                <span className="truncate">{fin.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roof Architecture */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-slate-300">Roof Architecture</h4>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(['flat', 'pitched', 'mansard'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                onCustomize(building.instanceId, { roofStyle: r });
                sound.playClick();
              }}
              className={`py-1.5 rounded-lg border capitalize transition-colors cursor-pointer ${
                (building.roofStyle || 'flat') === r
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Actions Strip */}
      <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
        <button
          onClick={() => onOpenInterior(building)}
          className="w-full py-2.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
        >
          <Armchair className="w-4 h-4" />
          <span>Step Inside & Furnish (Floorplan)</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          {onFocusObject && (
            <button
              onClick={() => onFocusObject({ x: building.x, z: building.z })}
              className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 font-semibold text-xs border border-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
              title="Focus camera on this object"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Focus</span>
            </button>
          )}

          <button
            onClick={() => onDuplicate(building.instanceId)}
            className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
            title="Duplicate (D key)"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Clone</span>
          </button>

          <button
            onClick={() => onDemolish(building.instanceId)}
            className="py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-semibold text-xs border border-rose-900/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
            title="Demolish structure"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
