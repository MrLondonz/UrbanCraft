import React, { useRef, useState } from 'react';
import { X, BookOpen, Download, Upload, Sparkles, Save, FolderOpen, Check, AlertCircle } from 'lucide-react';
import { CITY_TEMPLATES } from '../data/templates';
import { PlacedBuilding } from '../types/city';
import { sound } from '../utils/audio';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (buildings: PlacedBuilding[], startingFunds?: number) => void;
  currentBuildings: PlacedBuilding[];
  currentFunds: number;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  currentBuildings,
  currentFunds,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCity = () => {
    const data = JSON.stringify(
      {
        format: 'cityforge',
        version: '2.0.0',
        savedAt: new Date().toISOString(),
        timestamp: Date.now(),
        funds: currentFunds,
        buildingsCount: currentBuildings.length,
        buildings: currentBuildings,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cityforge_project_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sound.playClick();
  };

  const handleImportCity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json.buildings)) {
          onLoadTemplate(json.buildings, json.funds || 10000);
          sound.playUpgrade();
          onClose();
        } else {
          setSaveStatus('Invalid save file: missing structures array');
        }
      } catch (err) {
        console.error('Invalid city save file', err);
        setSaveStatus('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleQuickSave = () => {
    try {
      const payload = JSON.stringify({
        format: 'cityforge',
        version: '2.0.0',
        timestamp: Date.now(),
        funds: currentFunds,
        buildings: currentBuildings,
      });
      localStorage.setItem('cityforge_quicksave', payload);
      setSaveStatus('Project saved successfully to browser storage!');
      sound.playClick();
      setTimeout(() => setSaveStatus(null), 3500);
    } catch {
      setSaveStatus('Could not save to browser storage');
    }
  };

  const handleQuickLoad = () => {
    try {
      const saved = localStorage.getItem('cityforge_quicksave');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.buildings)) {
          onLoadTemplate(parsed.buildings, parsed.funds || 10000);
          sound.playUpgrade();
          onClose();
          return;
        }
      }
      setSaveStatus('No quick-save found in browser storage.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Error loading quick-save');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Projects, Saves & City Templates</h3>
              <p className="text-xs text-slate-400">Save and load versioned JSON projects or explore pre-built metropolises</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {saveStatus && (
          <div className="mx-6 mt-4 p-2.5 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Quick Save / Quick Load Actions */}
        <div className="px-6 pt-4 flex items-center gap-3">
          <button
            onClick={handleQuickSave}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Save (Browser)</span>
          </button>
          <button
            onClick={handleQuickLoad}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Quick Load</span>
          </button>
        </div>

        {/* Templates List */}
        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Pre-Engineered Masterplans
          </div>
          {CITY_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white text-sm">{tmpl.name}</h4>
                  <span className="text-[10px] text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/50 border border-indigo-800/40">
                    {tmpl.tagline}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">
                  {tmpl.description}
                </p>
                <div className="text-[11px] text-slate-500 font-mono-data mt-2">
                  {tmpl.buildings.length} structures · Starter Treasury: ${tmpl.startingFunds.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => {
                  onLoadTemplate(tmpl.buildings, tmpl.startingFunds);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Template</span>
              </button>
            </div>
          ))}
        </div>

        {/* Save / Export / Import Footer (Versioned JSON) */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Project JSON (v2.0)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCity}
              accept=".json"
              className="hidden"
            />
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
