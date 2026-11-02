import React, { useState } from 'react';
import { 
  Settings, 
  RotateCcw, 
  Database, 
  Check, 
  AlertCircle, 
  Info, 
  Layers, 
  Globe2, 
  Compass, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { cadastreApi } from '../services/api';

interface SettingsViewProps {
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleResetData = async () => {
    if (!confirm('This will restore all default 5 realistic sample properties in the SQLite database. Continue?')) return;
    setIsResetting(true);
    try {
      await cadastreApi.resetSampleData();
      setResetDone(true);
      onRefreshData();
      setTimeout(() => setResetDone(false), 3000);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-sky-400" />
          <span>System Specifications &amp; Administration</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure geodetic standards, spatial indexing schemas, and manage sample database states.
        </p>
      </div>

      {/* Database Management Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-white text-base">Sample Database State Management</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
            SQLite Local Engine
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The database is pre-seeded with 5 realistic multi-story properties covering commercial towers with unauthorized vertical expansions, compliant residential duplexes, industrial high-bay depots, and Whitefield high-rises.
        </p>

        <div className="pt-2 flex items-center gap-4">
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Restore Default Sample Cadastre Data</span>
          </button>

          {resetDone && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sample properties restored successfully!</span>
            </span>
          )}
        </div>
      </div>

      {/* 3D ULPIN Specification Standard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Globe2 className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-white text-base">3D ULPIN Standardization Specification</h3>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <p>
            The national <strong>Bhu-Aadhaar ULPIN</strong> uses a 14-character alphanumeric identifier generated from centroid longitude and latitude coordinates.
            <strong> SpatialCadastre3D</strong> extends this into 3-dimensional air parcels by incorporating:
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
            <div className="text-sky-300 font-bold">
              3D-CAD-[LAT_GRID][LNG_GRID]-[Z_SPAN]-[HASH4]
            </div>
            <div className="text-slate-400 text-[10px]">
              • [LAT_GRID][LNG_GRID]: 10-digit centroid coordinate spatial grid reference (WGS84).<br />
              • [Z_SPAN]: Vertical air rights elevation span (e.g., Z24M = 24 meters above datum).<br />
              • [HASH4]: SHA256 integrity hash combining 2D parcel ID, volume, and datum elevation.
            </div>
          </div>
        </div>
      </div>

      {/* Geodetic Reference Frame */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Compass className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-white text-base">Geodetic Reference Frame &amp; Vertical Datum</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">HORIZONTAL DATUM</span>
            <span className="font-semibold text-white">WGS84 / EPSG:4326</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">VERTICAL DATUM</span>
            <span className="font-semibold text-white">Mean Sea Level (MSL)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">SPATIAL PRECISION</span>
            <span className="font-semibold text-sky-400">0.05 meters (Decimetric)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
