import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Box, 
  Info, 
  ArrowRight,
  TrendingDown,
  Building,
  Scale,
  ExternalLink,
  Coins
} from 'lucide-react';
import { PropertyModel } from '../types/cadastre';

interface ComplianceViewProps {
  properties: PropertyModel[];
  onLaunch3D: (property: PropertyModel) => void;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  properties,
  onLaunch3D
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties[0]?.id || ''
  );

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Legal Disclaimer Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-sky-400" />
            <span>Permitted vs Observed Construction Compliance Center</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Automated volumetric verification comparing master plan sanction permits with observed 3D spatial cadastre models.
          </p>
        </div>

        {/* Prototype Disclaimer Badge */}
        <div className="bg-amber-950/60 border border-amber-800/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 max-w-md">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-[11px] text-amber-200/90 leading-tight">
            <strong>Prototype Notice:</strong> Simulated rule-based geometric audit for demonstration. Not a legally certified structural inspection.
          </p>
        </div>
      </div>

      {/* Property Selector Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Property to Audit:</span>
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => {
            const isSelected = p.id === selectedProperty?.id;
            const hasViolation = p.compliance_status !== 'Compliant';

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPropertyId(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-lg'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{p.title}</span>
                {hasViolation ? (
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedProperty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Side-by-Side Permitted vs Observed Audit */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-xs text-sky-400 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                    {selectedProperty.ulpin_3d}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedProperty.title}</h3>
                  <p className="text-xs text-slate-400">{selectedProperty.address}</p>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedProperty.compliance_status === 'Compliant'
                      ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/70 border-red-800 text-red-300'
                  }`}>
                    {selectedProperty.compliance_status}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                    Score: {selectedProperty.compliance_score_pct} / 100
                  </span>
                </div>
              </div>

              {/* Side-by-Side Comparison Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Permitted Plan */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sanctioned Approval</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Master Plan 2022</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Permitted Above-Ground Floors:</span>
                      <span className="font-bold text-white">{selectedProperty.permitted_above_ground_floors} Floors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sanctioned Height Limit:</span>
                      <span className="font-bold text-white">{selectedProperty.permitted_height_m} meters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Permitted FSI / FAR:</span>
                      <span className="font-bold text-white">{selectedProperty.permitted_fsi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Permitted Built-up Area:</span>
                      <span className="font-bold text-white">
                        {Math.round(selectedProperty.plot_area_sqm * selectedProperty.permitted_fsi)} sq.m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observed Construction */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  selectedProperty.excess_floors > 0
                    ? 'bg-red-950/20 border-red-900/60'
                    : 'bg-slate-950/80 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Box className="w-4 h-4" />
                      <span>In-situ 3D Observation</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Sensors / 3D Model</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Observed Above-Ground Floors:</span>
                      <span className={`font-bold ${selectedProperty.excess_floors > 0 ? 'text-red-400' : 'text-white'}`}>
                        {selectedProperty.observed_above_ground_floors} Floors
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Observed Height:</span>
                      <span className="font-bold text-white">{selectedProperty.observed_height_m} meters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Observed FSI:</span>
                      <span className="font-bold text-white">{selectedProperty.observed_fsi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Observed Built-up Area:</span>
                      <span className="font-bold text-white">
                        {Math.round(selectedProperty.building_footprint_sqm * selectedProperty.observed_above_ground_floors)} sq.m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identified Violations Report */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Compliance Findings &amp; Deviation Audit
                </h4>
                {selectedProperty.violations && selectedProperty.violations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProperty.violations.map((violation, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-red-950/40 border border-red-900/80 flex items-start gap-2.5 text-xs text-red-200"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-300">Deviation #{idx + 1}</p>
                          <p className="text-slate-300 mt-0.5">{violation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>No structural deviations or vertical encroachments detected. Building fully conforms to Sanction Plan.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Financial & Spatial Penalty Card */}
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Compounding Assessment</span>
              </h3>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Excess Vertical Floors:</span>
                  <span className="font-bold text-red-400 text-sm">
                    +{selectedProperty.excess_floors} Floors
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Excess Built Area:</span>
                  <span className="font-bold text-white">
                    {selectedProperty.excess_area_sqm} sq.m
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Penalty Rate:</span>
                  <span className="font-mono text-slate-300">₹4,800 / sq.m</span>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                    Total Estimated Compounding Fine
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">
                    ₹{selectedProperty.penalty_estimate_inr.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Subject to Municipal Corporation compounding tribunal review
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onLaunch3D(selectedProperty)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Box className="w-4 h-4" />
                <span>Inspect Unauthorized Floors in 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
