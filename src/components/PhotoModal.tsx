import React from 'react';
import { X, Download, Camera } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `urbancraft_render_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Architectural Photo Snapshot</h3>
              <p className="text-xs text-slate-400">High-resolution export rendered from your current camera angle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Image Preview */}
        <div className="p-4 bg-slate-900/50 flex items-center justify-center">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl max-h-[60vh]">
            <img
              src={imageUrl}
              alt="UrbanCraft 5D Snapshot Render"
              className="w-full h-auto object-contain max-h-[60vh]"
              referrerPolicy="no-referrer"
            />
            {/* Architectural Grid Watermark / Stamp */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-white/80 font-mono-data border border-white/10">
              UrbanCraft 5D · Architectural Render
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Exported in full WebGL canvas resolution</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
