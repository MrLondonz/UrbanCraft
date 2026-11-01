import React, { useState } from 'react';
import {
  X,
  Building,
  Maximize2,
  Sliders,
  Palette,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatMeasurement } from '../utils/cityValidation';
import { MeasurementUnit } from '../types/city';

interface CustomBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCustomBuilding: (params: {
    name: string;
    width: number;
    depth: number;
    heightFloors: number;
    color: string;
    roofStyle: 'flat' | 'pitched' | 'mansard';
    architecturalStyle: 'modern_glass' | 'classic_brick' | 'timber_eco' | 'concrete_brutalist';
  }) => void;
  unit?: MeasurementUnit;
}

export const CustomBuildingModal: React.FC<CustomBuildingModalProps> = ({
  isOpen,
  onClose,
  onCreateCustomBuilding,
  unit = 'metric',
}) => {
  const [name, setName] = useState('New Architectural Tower');
  const [width, setWidth] = useState(2);
  const [depth, setDepth] = useState(2);
  const [floors, setFloors] = useState(4);
  const [color, setColor] = useState('#38bdf8');
  const [roofStyle, setRoofStyle] = useState<'flat' | 'pitched' | 'mansard'>('flat');
  const [archStyle, setArchStyle] = useState<'modern_glass' | 'classic_brick' | 'timber_eco' | 'concrete_brutalist'>('modern_glass');

  if (!isOpen) return null;

  const widthMeas = formatMeasurement(width, unit);
  const depthMeas = formatMeasurement(depth, unit);
  const heightMeters = Math.round(floors * 3.5);
  const heightFeet = Math.round(heightMeters * 3.28);
  const heightFormatted = unit === 'imperial' ? `${heightFeet} ft` : `${heightMeters} m`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCustomBuilding({
      name: name.trim() || 'Custom Architecture',
      width,
      depth,
      heightFloors: floors,
      color,
      roofStyle,
      architecturalStyle: archStyle,
    });
    onClose();
  };

  const colorPalettes = [
    { name: 'Sky Glass', hex: '#38bdf8' },
    { name: 'Pure White', hex: '#f8fafc' },
    { name: 'Midnight Navy', hex: '#1e293b' },
    { name: 'Heritage Brick', hex: '#b91c1c' },
    { name: 'Warm Timber', hex: '#b45309' },
    { name: 'Emerald Glaze', hex: '#059669' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Architectural Building Studio</h3>
              <p className="text-xs text-slate-400">Design a custom building from scratch with editable dimensions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Building Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Building Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              placeholder="e.g. Skyline Meridian Tower"
              required
            />
          </div>

          {/* Dimensions Sliders */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div>
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Width:</span>
                <span className="font-mono text-white font-bold">{width} tiles</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 text-center mt-0.5">{widthMeas.length}</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Depth:</span>
                <span className="font-mono text-white font-bold">{depth} tiles</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 text-center mt-0.5">{depthMeas.length}</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Floors:</span>
                <span className="font-mono text-amber-300 font-bold">{floors} fl</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 text-center mt-0.5">~{heightFormatted}</div>
            </div>
          </div>

          {/* Roof Architecture */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Roof Style</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'flat', label: 'Rooftop Terrace' },
                { id: 'pitched', label: 'Pitched Gabled' },
                { id: 'mansard', label: 'Classic Mansard' },
              ].map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setRoofStyle(style.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                    roofStyle === style.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Facade Color */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              <span>Facade Material & Finish</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPalettes.map((p) => (
                <button
                  type="button"
                  key={p.hex}
                  onClick={() => setColor(p.hex)}
                  className={`w-8 h-8 rounded-xl border cursor-pointer transition-transform ${
                    color === p.hex
                      ? 'scale-110 border-white ring-2 ring-sky-400 shadow-md'
                      : 'border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Spawn Custom Building</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
