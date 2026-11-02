import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Box, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Layers,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { PropertyModel, FloorRecord } from '../types/cadastre';
import { cadastreApi } from '../services/api';

interface PropertiesViewProps {
  properties: PropertyModel[];
  onSelectProperty: (property: PropertyModel) => void;
  onLaunch3D: (property: PropertyModel) => void;
  onOpenMap: (property: PropertyModel) => void;
  onRefresh: () => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onSelectProperty,
  onLaunch3D,
  onOpenMap,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectProperty, setInspectProperty] = useState<PropertyModel | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUlpin = (ulpin: string) => {
    navigator.clipboard.writeText(ulpin);
    setCopiedId(ulpin);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this property record from the 3D cadastre?')) return;
    try {
      await cadastreApi.deleteProperty(id);
      onRefresh();
      if (inspectProperty?.id === id) {
        setInspectProperty(null);
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const filtered = properties.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (
      p.title.toLowerCase().includes(term) ||
      p.ulpin_3d.toLowerCase().includes(term) ||
      p.parcel_id_2d.toLowerCase().includes(term) ||
      p.owner_name.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term)
    );

    const matchStatus = statusFilter === 'ALL' || p.compliance_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-sky-400" />
            <span>3D Cadastral Land Parcel Registry</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Search, inspect, and verify spatial parcels with associated 3D ULPIN indices, elevation datums, and vertical ownership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            {filtered.length} of {properties.length} Parcels Listed
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by 3D ULPIN, 2D Parcel ID, Owner Name, or Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="Compliant">Compliant</option>
            <option value="Non-Compliant">Non-Compliant</option>
            <option value="Critical Violation">Critical Violation</option>
            <option value="Pending Verification">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((prop) => {
          const isCompliant = prop.compliance_status === 'Compliant';
          const isPending = prop.compliance_status === 'Pending Verification';

          return (
            <div
              key={prop.id}
              onClick={() => setInspectProperty(prop)}
              className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 rounded-xl p-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header: ULPIN & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                      {prop.ulpin_3d}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyUlpin(prop.ulpin_3d); }}
                      title="Copy 3D ULPIN"
                      className="text-slate-500 hover:text-sky-300 p-1 rounded"
                    >
                      {copiedId === prop.ulpin_3d ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    isCompliant
                      ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                      : (isPending
                          ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                          : 'bg-red-950/70 border-red-800 text-red-300')
                  }`}>
                    {prop.compliance_status}
                  </span>
                </div>

                {/* Title & 2D Parcel */}
                <h3 className="text-base font-bold text-white mt-3 group-hover:text-sky-300 transition-colors">
                  {prop.title}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                  <span>2D ID: {prop.parcel_id_2d}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>{prop.address}</span>
                </div>

                {/* Spatial Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Plot Area</span>
                    <span className="font-semibold text-slate-200">{prop.plot_area_sqm} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Floors (O/P)</span>
                    <span className="font-semibold text-slate-200">
                      {prop.observed_above_ground_floors} / {prop.permitted_above_ground_floors}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Air Volume</span>
                    <span className="font-semibold text-sky-300">{prop.cadastral_air_volume_cu_m} m³</span>
                  </div>
                </div>

                {/* Excess Floor Alert Banner if any */}
                {prop.excess_floors > 0 && (
                  <div className="mt-3 p-2 rounded bg-red-950/40 border border-red-900/60 text-red-300 text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span>+{prop.excess_floors} Unauthorized Vertical Levels</span>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onLaunch3D(prop); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-colors"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Model</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenMap(prop); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>GIS Map</span>
                  </button>
                </div>

                <button
                  onClick={(e) => handleDelete(prop.id, e)}
                  title="Delete Record"
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <p className="text-sm">No cadastral properties matched your search term.</p>
        </div>
      )}

      {/* Comprehensive Property Dossier Modal */}
      {inspectProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-sky-400 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  {inspectProperty.ulpin_3d}
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">{inspectProperty.title}</h3>
                <p className="text-xs text-slate-400">{inspectProperty.address}</p>
              </div>
              <button
                onClick={() => setInspectProperty(null)}
                className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                ✕ Close
              </button>
            </div>

            {/* Grid Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">2D Parcel ID</span>
                <span className="font-semibold text-white font-mono">{inspectProperty.parcel_id_2d}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Title Holder</span>
                <span className="font-semibold text-white">{inspectProperty.owner_name}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Coordinates (WGS84)</span>
                <span className="font-semibold text-sky-300 font-mono">
                  {inspectProperty.latitude.toFixed(4)}, {inspectProperty.longitude.toFixed(4)}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Elevation Datum</span>
                <span className="font-semibold text-slate-200">{inspectProperty.elevation_datum_msl}m MSL</span>
              </div>
            </div>

            {/* Dimensional & Compliance Snapshot */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3D Spatial Envelope &amp; Compliance Audit
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">FOOTPRINT DIMENSIONS</span>
                  <span className="font-semibold text-white">
                    {inspectProperty.building_length_m}m × {inspectProperty.building_width_m}m ({inspectProperty.building_footprint_sqm} m²)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FLOORS (PERMITTED / BUILT)</span>
                  <span className="font-semibold text-white">
                    {inspectProperty.permitted_above_ground_floors} Sanctioned / {inspectProperty.observed_above_ground_floors} Constructed
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CADASTRAL AIR VOLUME</span>
                  <span className="font-semibold text-sky-400">{inspectProperty.cadastral_air_volume_cu_m} m³</span>
                </div>
              </div>

              {inspectProperty.violations && inspectProperty.violations.length > 0 && (
                <div className="mt-3 p-3 rounded bg-red-950/50 border border-red-800 text-xs text-red-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Spatial Encroachments / Deviations:</span>
                  </div>
                  {inspectProperty.violations.map((v, i) => (
                    <div key={i} className="text-[11px] pl-5">• {v}</div>
                  ))}
                  {inspectProperty.penalty_estimate_inr > 0 && (
                    <div className="text-[11px] font-semibold text-amber-300 mt-2 pl-5">
                      Compounding Penalty Assessment: ₹{inspectProperty.penalty_estimate_inr.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vertical Sub-Parcels Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Floor-Wise Vertical Property Divisions ({inspectProperty.floors.length} Levels)
              </h4>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2">Level</th>
                      <th className="p-2">Designation</th>
                      <th className="p-2">Usage</th>
                      <th className="p-2">Area</th>
                      <th className="p-2">Elevation (m)</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {inspectProperty.floors.map((fl) => (
                      <tr key={fl.floor_number} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono font-semibold">
                          {fl.floor_number < 0 ? `B${Math.abs(fl.floor_number)}` : `L${fl.floor_number}`}
                        </td>
                        <td className="p-2">{fl.floor_name}</td>
                        <td className="p-2 text-sky-400">{fl.usage_type}</td>
                        <td className="p-2">{fl.built_area_sqm} m²</td>
                        <td className="p-2 font-mono">{fl.elevation_start_m} - {fl.elevation_end_m}m</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            fl.is_permitted ? 'text-emerald-400 bg-emerald-950/60' : 'text-red-400 bg-red-950 font-bold'
                          }`}>
                            {fl.is_permitted ? 'Permitted' : 'Unauthorized'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const p = inspectProperty;
                  setInspectProperty(null);
                  onLaunch3D(p);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Box className="w-4 h-4" />
                <span>Launch Interactive 3D Model</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
