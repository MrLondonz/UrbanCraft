import React, { useState } from 'react';
import {
  X,
  ArrowUpCircle,
  Trash2,
  Edit2,
  Check,
  Zap,
  Droplets,
  DollarSign,
  Users,
  Palette,
  Armchair,
  Copy,
  RotateCw,
  Sliders,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';
import { PlacedBuilding, MeasurementUnit } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { validateBuildingPlacement, formatMeasurement } from '../utils/cityValidation';

interface InspectorModalProps {
  building: PlacedBuilding | null;
  allBuildings?: PlacedBuilding[];
  onClose: () => void;
  onUpgrade: (instanceId: string) => void;
  onCustomize: (instanceId: string, updates: Partial<PlacedBuilding>) => void;
  onDemolish: (instanceId: string) => void;
  onDuplicate?: (instanceId: string) => void;
  onOpenInterior: (building: PlacedBuilding) => void;
  currentFunds: number;
  unit?: MeasurementUnit;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  building,
  allBuildings = [],
  onClose,
  onUpgrade,
  onCustomize,
  onDemolish,
  onDuplicate,
  onOpenInterior,
  currentFunds,
  unit = 'metric',
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameText, setNameText] = useState('');
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  if (!building) return null;

  const def = BUILDING_MAP.get(building.defId);
  if (!def) return null;

  const displayName = building.customName || def.name;
  const upgradeCost = Math.round(def.cost * 0.75 * building.level);
  const canUpgrade = building.level < def.maxLevel && currentFunds >= upgradeCost;
  const refundAmount = Math.round(def.cost * 0.5);

  const curWidth = building.customWidth || def.size[0] || 1;
  const curDepth = building.customDepth || def.size[1] || 1;
  const curFloors = building.customHeightFloors || building.level * 2;

  const widthMeas = formatMeasurement(curWidth, unit);
  const depthMeas = formatMeasurement(curDepth, unit);

  const handleSaveName = () => {
    if (nameText.trim()) {
      onCustomize(building.instanceId, { customName: nameText.trim() });
    }
    setIsEditingName(false);
  };

  const handleAdjustDimension = (field: 'customWidth' | 'customDepth' | 'customHeightFloors', delta: number) => {
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
        setValidationWarning(validation.reason || 'Cannot resize: spatial collision');
        return;
      }
    }

    onCustomize(building.instanceId, {
      customWidth: newWidth,
      customDepth: newDepth,
      customHeightFloors: newFloors,
    });
  };

  const handleRotate = () => {
    const nextRot = ((building.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onCustomize(building.instanceId, { rotation: nextRot });
  };

  return (
    <div className="absolute right-6 top-28 w-88 max-h-[80vh] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-40 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-200 select-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={displayName}
                autoFocus
                onChange={(e) => setNameText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSaveName}
                className="p-1 rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-white text-base leading-tight truncate">
                {displayName}
              </h3>
              <button
                onClick={() => {
                  setNameText(displayName);
                  setIsEditingName(true);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Rename structure"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium capitalize mt-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px]">
              Grid: ({building.x}, {building.z}) · {building.rotation}°
            </span>
            <span>·</span>
            <span>Level {building.level}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Spatial Dimensions Editor (Core Requirement 2 & 8) */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-sky-400">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Dimensions & Height</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {widthMeas.length} × {depthMeas.length}
          </span>
        </div>

        {/* Width Control */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Width:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdjustDimension('customWidth', -1)}
              disabled={curWidth <= 1}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="w-12 text-center font-mono font-semibold text-white">
              {curWidth} tiles
            </span>
            <button
              onClick={() => handleAdjustDimension('customWidth', 1)}
              disabled={curWidth >= 6}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Depth Control */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Depth:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdjustDimension('customDepth', -1)}
              disabled={curDepth <= 1}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="w-12 text-center font-mono font-semibold text-white">
              {curDepth} tiles
            </span>
            <button
              onClick={() => handleAdjustDimension('customDepth', 1)}
              disabled={curDepth >= 6}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Height / Floors Control */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Floors:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdjustDimension('customHeightFloors', -1)}
              disabled={curFloors <= 1}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="w-12 text-center font-mono font-semibold text-amber-300">
              {curFloors} fl
            </span>
            <button
              onClick={() => handleAdjustDimension('customHeightFloors', 1)}
              disabled={curFloors >= 12}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationWarning && (
          <div className="mt-1 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{validationWarning}</span>
          </div>
        )}
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {def.populationCapacity > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400">Residents</div>
              <div className="font-semibold text-white font-mono-data">
                {Math.round(def.populationCapacity * (1 + (building.level - 1) * 0.4) * (curWidth * curDepth))}
              </div>
            </div>
          </div>
        )}

        {def.jobsProvided > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-400">Jobs</div>
              <div className="font-semibold text-white font-mono-data">
                {Math.round(def.jobsProvided * (1 + (building.level - 1) * 0.4) * (curWidth * curDepth))}
              </div>
            </div>
          </div>
        )}

        {def.revenuePerDay !== 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">Daily Revenue</div>
              <div className="font-semibold text-emerald-400 font-mono-data">
                ${Math.round(def.revenuePerDay * (1 + (building.level - 1) * 0.4))}
              </div>
            </div>
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400">Power</div>
            <div className="font-semibold text-white font-mono-data">
              {def.powerDelta < 0 ? `+${Math.abs(def.powerDelta)} MW` : `${def.powerDelta} MW`}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400">Water</div>
            <div className="font-semibold text-white font-mono-data">
              {def.waterDelta < 0 ? `+${Math.abs(def.waterDelta)} ML` : `${def.waterDelta} ML`}
            </div>
          </div>
        </div>
      </div>

      {/* Roof Style Selector */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Roof Architecture</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(['flat', 'pitched', 'mansard'] as const).map((roof) => (
            <button
              key={roof}
              onClick={() => onCustomize(building.instanceId, { roofStyle: roof })}
              className={`py-1.5 rounded-lg capitalize border font-medium transition-all cursor-pointer text-center ${
                (building.roofStyle || 'flat') === roof
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {roof}
            </button>
          ))}
        </div>
      </div>

      {/* Color Customization */}
      {def.colorOptions.length > 1 && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <span>Facade Finish</span>
          </div>
          <div className="flex items-center gap-2">
            {def.colorOptions.map((hex) => (
              <button
                key={hex}
                onClick={() => onCustomize(building.instanceId, { color: hex })}
                className={`w-7 h-7 rounded-lg transition-transform cursor-pointer border ${
                  building.color === hex ? 'scale-110 border-white ring-2 ring-sky-400/50' : 'border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: hex }}
                title={`Finish ${hex}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        {/* Floor-plan & Furniture Mode */}
        <button
          onClick={() => {
            onOpenInterior(building);
            onClose();
          }}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-98 transition-all cursor-pointer"
        >
          <Armchair className="w-4 h-4" />
          <span>Floor-Plan & Interior Studio</span>
        </button>

        {/* Duplicate & Rotate Tools (Core Requirements 8 & 9) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDuplicate && onDuplicate(building.instanceId)}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Duplicate this building with identical properties"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate (D)</span>
          </button>

          <button
            onClick={handleRotate}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Rotate structure 90 degrees"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate (R)</span>
          </button>
        </div>

        {building.level < def.maxLevel ? (
          <button
            onClick={() => onUpgrade(building.instanceId)}
            disabled={!canUpgrade}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              canUpgrade
                ? 'bg-slate-850 hover:bg-slate-800 text-sky-400 border border-slate-700 shadow-sm active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Upgrade to Level {building.level + 1} (${upgradeCost})</span>
          </button>
        ) : (
          <div className="text-center py-1.5 text-xs font-medium text-slate-400 bg-slate-900/60 rounded-xl">
            Maximum Architecture Level Reached
          </div>
        )}

        <button
          onClick={() => {
            onDemolish(building.instanceId);
            onClose();
          }}
          className="w-full py-2 px-4 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Demolish Structure (+${refundAmount} refund)</span>
        </button>
      </div>
    </div>
  );
};
