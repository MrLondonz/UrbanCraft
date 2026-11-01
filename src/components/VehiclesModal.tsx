import React, { useState } from 'react';
import { X, Car, Zap, Shield, Flame, Bus, Truck, Cross, Leaf, Sparkles, Navigation } from 'lucide-react';
import { VEHICLES_CATALOG } from '../data/vehiclesCatalog';
import { VehicleDefinition } from '../types/city';
import { sound } from '../utils/audio';

interface VehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicleToPlace: (vehicleDef: VehicleDefinition, color: string) => void;
  onSpawnTrafficFleet: () => void;
  isFreeMode?: boolean;
}

const ICONS_MAP: Record<string, React.ElementType> = {
  Zap,
  Car,
  Shield,
  Flame,
  Bus,
  Truck,
  Cross,
  Leaf,
  Navigation,
};

export const VehiclesModal: React.FC<VehiclesModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicleToPlace,
  onSpawnTrafficFleet,
  isFreeMode = false,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDefinition>(VEHICLES_CATALOG[0]);
  const [selectedColor, setSelectedColor] = useState<string>(VEHICLES_CATALOG[0].color);

  if (!isOpen) return null;

  const IconComp = ICONS_MAP[selectedVehicle.icon] || Car;

  const handleSelectToPlace = () => {
    onSelectVehicleToPlace(selectedVehicle, selectedColor);
    onClose();
    sound.playClick();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Vehicle Showroom & Fleet</h3>
              <p className="text-xs text-slate-400">Place custom civilian, emergency, and transit vehicles on city roads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Spawn Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Traffic Circulation</span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Automatically populate all constructed streets and avenues with active commuting traffic.
              </p>
            </div>
            <button
              onClick={() => {
                onSpawnTrafficFleet();
                sound.playPlace();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all active:scale-95 shrink-0 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Populate Traffic
            </button>
          </div>

          {/* Vehicle Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
              Select Vehicle Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VEHICLES_CATALOG.map((veh) => {
                const ItemIcon = ICONS_MAP[veh.icon] || Car;
                const isSelected = selectedVehicle.id === veh.id;
                return (
                  <button
                    key={veh.id}
                    onClick={() => {
                      setSelectedVehicle(veh);
                      setSelectedColor(veh.colorOptions[0] || veh.color);
                      sound.playClick();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/20'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white"
                        style={{ backgroundColor: veh.color }}
                      >
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono-data font-semibold text-emerald-400">
                        {isFreeMode ? 'FREE' : `$${veh.cost}`}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-xs leading-snug">{veh.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize mt-0.5">{veh.category}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Vehicle Specs & Custom Paint */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0"
                style={{ backgroundColor: selectedColor }}
              >
                <IconComp className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{selectedVehicle.name}</h4>
                <p className="text-xs text-slate-300 mt-0.5">{selectedVehicle.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono-data">
                  <span>Speed: {(selectedVehicle.speed * 1000).toFixed(0)} mph</span>
                  <span>·</span>
                  <span className="capitalize">Type: {selectedVehicle.category}</span>
                  {selectedVehicle.hasSiren && (
                    <>
                      <span>·</span>
                      <span className="text-rose-400 font-semibold">Active Siren</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">Custom Color:</span>
              <div className="flex items-center gap-1.5">
                {selectedVehicle.colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      selectedColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Click &apos;Place Vehicle&apos;, then click on any road tile in your city to launch it into traffic.
          </span>
          <button
            onClick={handleSelectToPlace}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>Place Vehicle on Road</span>
          </button>
        </div>
      </div>
    </div>
  );
};
