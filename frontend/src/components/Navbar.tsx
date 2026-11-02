import React from 'react';
import { 
  Box, 
  Search, 
  Bell, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  onSearchSelect?: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="text-xs font-medium text-slate-300">
            Cadastral Spatial Service: <strong className="text-emerald-400">ONLINE (Port 8000)</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Registry Data"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="font-semibold text-white">Karnataka Cadastral Directorate</span>
        </div>
      </div>
    </header>
  );
};
