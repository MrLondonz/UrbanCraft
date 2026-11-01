import React from 'react';
import { Newspaper, BellRing } from 'lucide-react';
import { CityEventNews } from '../types/city';

interface NewsTickerProps {
  newsLog: CityEventNews[];
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ newsLog }) => {
  if (newsLog.length === 0) return null;
  const latest = newsLog[0];

  return (
    <div className="absolute top-28 left-6 max-w-sm pointer-events-none z-20 select-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-xl p-2.5 shadow-xl flex items-center gap-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
          latest.type === 'positive'
            ? 'bg-emerald-500/10 text-emerald-400'
            : latest.type === 'warning'
            ? 'bg-rose-500/10 text-rose-400'
            : 'bg-sky-500/10 text-sky-400'
        }`}>
          {latest.type === 'positive' ? (
            <BellRing className="w-3.5 h-3.5" />
          ) : (
            <Newspaper className="w-3.5 h-3.5" />
          )}
        </div>
        <p className="text-xs text-slate-300 leading-snug line-clamp-2">
          {latest.text}
        </p>
      </div>
    </div>
  );
};
