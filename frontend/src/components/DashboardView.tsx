import React from 'react';
import { 
  Building, 
  Box, 
  Clock, 
  AlertOctagon, 
  Layers, 
  ArrowUpRight, 
  ShieldCheck, 
  MapPin, 
  Plus, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { DashboardStats, PropertyModel } from '../types/cadastre';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onSelectProperty: (property: PropertyModel) => void;
  onNavigateToView: (view: string) => void;
  onLaunch3D: (property: PropertyModel) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onSelectProperty,
  onNavigateToView,
  onLaunch3D
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Unified 3D Spatial Cadastre Platform</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Spatial Property Verification &amp; Compliance Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Transforming conventional 2D title registries into 3D volumetric parcels with automated spatial compliance auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToView('register')}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-sky-950/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add 3D Property</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Properties */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Registered</span>
            <div className="w-9 h-9 rounded-lg bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{stats?.total_properties ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium mt-1">
              <span>100% 2D-3D Linked</span>
            </div>
          </div>
        </div>

        {/* 3D-Mapped Buildings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">3D-Mapped Enclosures</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{stats?.total_3d_mapped ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mt-1">
              <span>{stats?.total_cadastral_volume_cu_m?.toLocaleString() ?? 0} m³ Indexed</span>
            </div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Verification</span>
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-400">{stats?.pending_verification ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
              <span>Field audit or drone scan due</span>
            </div>
          </div>
        </div>

        {/* Compliance Violations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Violations Detected</span>
            <div className="w-9 h-9 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-red-400">{stats?.compliance_violations ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1">
              <span>Unauthorized vertical levels</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Explainer Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Core Spatial Cadastre 3D Workflow</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <span className="text-sky-400 font-mono font-bold">01. INGESTION</span>
            <p className="text-slate-300 font-semibold mt-1">Upload 2D Records</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Title deeds, sanctioned master plans &amp; survey boundaries.</p>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <span className="text-sky-400 font-mono font-bold">02. 3D ULPIN INDEX</span>
            <p className="text-slate-300 font-semibold mt-1">Spatial Hash &amp; Datum</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Extend Bhu-Aadhaar 14-char ULPIN into 3D vertical volume space.</p>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <span className="text-sky-400 font-mono font-bold">03. 3D RECONSTRUCTION</span>
            <p className="text-slate-300 font-semibold mt-1">Procedural Floor Geometry</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Vertical sub-parcels, basement parking, usage zones &amp; ownership.</p>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <span className="text-sky-400 font-mono font-bold">04. COMPLIANCE AUDIT</span>
            <p className="text-slate-300 font-semibold mt-1">Permitted vs Observed</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Instant detection of unauthorized floors, FSI abuse, and penalties.</p>
          </div>
        </div>
      </div>

      {/* Recent Property Registrations Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Cadastre Registrations</h3>
            <p className="text-xs text-slate-400">Recently indexed 3D spatial properties and compliance audit results</p>
          </div>
          <button
            onClick={() => onNavigateToView('properties')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All Records</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">3D ULPIN / Title</th>
                <th className="py-3 px-4 font-semibold">Title Holder</th>
                <th className="py-3 px-4 font-semibold">Footprint / Plot</th>
                <th className="py-3 px-4 font-semibold">Floors (Perm/Obs)</th>
                <th className="py-3 px-4 font-semibold">Volume (m³)</th>
                <th className="py-3 px-4 font-semibold">Compliance</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats?.recent_properties && stats.recent_properties.length > 0 ? (
                stats.recent_properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                        {prop.title}
                      </div>
                      <div className="font-mono text-[10px] text-sky-400 flex items-center gap-1 mt-0.5">
                        <Box className="w-3 h-3 text-sky-400" />
                        <span>{prop.ulpin_3d}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {prop.owner_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{prop.building_footprint_sqm} sq.m</div>
                      <div className="text-[10px] text-slate-500">Plot: {prop.plot_area_sqm} sq.m</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium">
                        {prop.permitted_above_ground_floors} Permitted / {prop.observed_above_ground_floors} Observed
                      </span>
                      {prop.excess_floors > 0 && (
                        <span className="block text-[10px] text-red-400 font-semibold">
                          +{prop.excess_floors} Unauthorized
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sky-300">
                      {prop.cadastral_air_volume_cu_m?.toLocaleString()} m³
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        prop.compliance_status === 'Compliant'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : (prop.compliance_status === 'Pending Verification'
                              ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                              : 'bg-red-950/70 border-red-800 text-red-300')
                      }`}>
                        {prop.compliance_status === 'Compliant' && <ShieldCheck className="w-3 h-3" />}
                        {prop.compliance_status !== 'Compliant' && <AlertOctagon className="w-3 h-3" />}
                        <span>{prop.compliance_status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onLaunch3D(prop)}
                          className="px-2.5 py-1 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800 font-medium text-xs flex items-center gap-1 transition-colors"
                        >
                          <Box className="w-3 h-3" />
                          <span>3D View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No property records indexed yet. Click "Add 3D Property" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
