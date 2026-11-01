import React from 'react';
import {
  DollarSign,
  Users,
  Smile,
  Zap,
  Droplets,
  Sun,
  Sunset,
  Moon,
  Play,
  Pause,
  FastForward,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';
import { CityMetrics, TimeOfDay } from '../types/city';

interface HudBarProps {
  metrics: CityMetrics;
  timeOfDay: TimeOfDay;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  gameSpeed: 0 | 1 | 2 | 3;
  onSetGameSpeed: (speed: 0 | 1 | 2 | 3) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isAmbiencePlaying: boolean;
  onToggleAmbience: () => void;
  isFreeMode?: boolean;
}

export const HudBar: React.FC<HudBarProps> = ({
  metrics,
  timeOfDay,
  onSetTimeOfDay,
  gameSpeed,
  onSetGameSpeed,
  isMuted,
  onToggleMute,
  isAmbiencePlaying,
  onToggleAmbience,
  isFreeMode = false,
}) => {
  const netDaily = metrics.dailyIncome - metrics.dailyExpenses;
  const isPowerDeficit = metrics.powerConsumed > metrics.powerProduced;
  const isWaterDeficit = metrics.waterConsumed > metrics.waterProduced;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs z-20 select-none">
      {/* City Vital Statistics */}
      <div className="flex items-center gap-6 overflow-x-auto py-1">
        {/* Treasury Funds */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Treasury</div>
            <div className="flex items-baseline gap-1.5 font-mono-data">
              <span className={`font-semibold text-sm ${isFreeMode ? 'text-amber-400 font-bold' : 'text-white'}`}>
                {isFreeMode ? 'FREE ∞' : `$${metrics.funds.toLocaleString()}`}
              </span>
              <span className={`text-[11px] ${isFreeMode ? 'text-amber-400/80' : netDaily >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isFreeMode ? 'Sandbox' : netDaily >= 0 ? `+$${netDaily}/d` : `-$${Math.abs(netDaily)}/d`}
              </span>
            </div>
          </div>
        </div>

        {/* Population */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Residents</div>
            <div className="font-semibold text-white text-sm font-mono-data">
              {metrics.population.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Citizen Happiness */}
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
            metrics.happiness >= 75 ? 'bg-emerald-500/10 text-emerald-400' : metrics.happiness >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <Smile className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Happiness</div>
            <div className="font-semibold text-white text-sm font-mono-data">
              {metrics.happiness}%
            </div>
          </div>
        </div>

        {/* Power Grid */}
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
            isPowerDeficit ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Power Grid</div>
            <div className="font-semibold font-mono-data text-white">
              <span className={isPowerDeficit ? 'text-rose-400' : 'text-slate-200'}>
                {metrics.powerConsumed}
              </span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-emerald-400">{metrics.powerProduced} MW</span>
            </div>
          </div>
        </div>

        {/* Water Supply */}
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
            isWaterDeficit ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'
          }`}>
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Water Grid</div>
            <div className="font-semibold font-mono-data text-white">
              <span className={isWaterDeficit ? 'text-rose-400' : 'text-slate-200'}>
                {metrics.waterConsumed}
              </span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-cyan-400">{metrics.waterProduced} ML</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment & Simulation Controls */}
      <div className="flex items-center gap-4">
        {/* Time of Day */}
        <div className="flex items-center bg-slate-950/70 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => onSetTimeOfDay('day')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              timeOfDay === 'day' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Day Lighting"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetTimeOfDay('sunset')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              timeOfDay === 'sunset' ? 'bg-slate-800 text-orange-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Sunset Golden Hour"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetTimeOfDay('night')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              timeOfDay === 'night' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Night Neon Sky"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center bg-slate-950/70 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={onToggleAmbience}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isAmbiencePlaying ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-white'
            }`}
            title={isAmbiencePlaying ? 'Mute City Lofi Music' : 'Play Calm City Lofi Music'}
          >
            <Music className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isMuted ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Game Speed */}
        <div className="flex items-center bg-slate-950/70 rounded-lg p-0.5 border border-slate-800 font-mono-data">
          <button
            onClick={() => onSetGameSpeed(0)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              gameSpeed === 0 ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Pause Simulation"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetGameSpeed(1)}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              gameSpeed === 1 ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Normal Speed (1x)"
          >
            <Play className="w-3 h-3 inline mr-0.5" /> 1x
          </button>
          <button
            onClick={() => onSetGameSpeed(2)}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              gameSpeed === 2 ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Fast Speed (2x)"
          >
            <FastForward className="w-3 h-3 inline mr-0.5" /> 2x
          </button>
          <button
            onClick={() => onSetGameSpeed(3)}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              gameSpeed === 3 ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Ultra Speed (3x)"
          >
            3x
          </button>
        </div>

        {/* Day Counter */}
        <div className="text-slate-400 font-mono-data text-xs whitespace-nowrap">
          Day <span className="text-white font-medium">{metrics.dayCount}</span>
        </div>
      </div>
    </div>
  );
};
