import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Building2, 
  MapPin, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Loader2,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { cadastreApi } from '../services/api';
import { PropertyModel, DocumentExtractionResult } from '../types/cadastre';

interface PropertyRegistrationViewProps {
  onPropertyCreated: (property: PropertyModel) => void;
  onNavigateToView: (view: string) => void;
}

export const PropertyRegistrationView: React.FC<PropertyRegistrationViewProps> = ({
  onPropertyCreated,
  onNavigateToView
}) => {
  // Document Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DocumentExtractionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: 'Prestige Trade Hub',
    parcel_id_2d: 'SURV-883/KA-BLR',
    owner_name: 'Aditya Birla Assets Corp',
    owner_contact: '+91 98450 77122',
    address: 'Survey 883, MG Road Financial Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9754,
    longitude: 77.6050,
    plot_area_sqm: 1400.0,
    building_length_m: 24.0,
    building_width_m: 16.0,
    basement_floors: 1,
    permitted_above_ground_floors: 4,
    observed_above_ground_floors: 5,
    permitted_fsi: 2.0,
    elevation_datum_msl: 920.0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<PropertyModel | null>(null);

  // Dynamic calculations
  const footprintArea = formData.building_length_m * formData.building_width_m;
  const groundCoveragePct = formData.plot_area_sqm > 0 ? (footprintArea / formData.plot_area_sqm) * 100 : 0;
  const excessFloors = Math.max(0, formData.observed_above_ground_floors - formData.permitted_above_ground_floors);
  const permittedBuiltArea = formData.plot_area_sqm * formData.permitted_fsi;
  const observedBuiltArea = footprintArea * formData.observed_above_ground_floors;
  const excessArea = Math.max(0, observedBuiltArea - permittedBuiltArea);
  const estimatedPenalty = excessArea * 4800;

  // Handle Document Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await cadastreApi.uploadAndExtractDocument(file);
      setUploadResult(result);

      // Auto-populate form from extracted data
      const ext = result.extracted_data;
      setFormData(prev => ({
        ...prev,
        title: ext.title || prev.title,
        parcel_id_2d: ext.parcel_id_2d || prev.parcel_id_2d,
        owner_name: ext.owner_name || prev.owner_name,
        plot_area_sqm: ext.plot_area_sqm || prev.plot_area_sqm,
        building_length_m: ext.building_length_m || prev.building_length_m,
        building_width_m: ext.building_width_m || prev.building_width_m,
        basement_floors: ext.basement_floors !== undefined ? ext.basement_floors : prev.basement_floors,
        permitted_above_ground_floors: ext.permitted_above_ground_floors || prev.permitted_above_ground_floors,
        observed_above_ground_floors: ext.observed_above_ground_floors || prev.observed_above_ground_floors,
        permitted_fsi: ext.permitted_fsi || prev.permitted_fsi,
      }));
    } catch (err: any) {
      setUploadError(err.message || 'Error parsing document');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit and create 3D Property
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const documentsPayload = uploadResult ? [{
        filename: uploadResult.filename,
        document_type: "Municipal Sanction Plan",
        uploaded_at: uploadResult.uploaded_at,
        file_size_bytes: uploadResult.file_size_bytes,
        extracted_metadata: uploadResult.extracted_data
      }] : [];

      const created = await cadastreApi.createProperty({
        ...formData,
        documents: documentsPayload
      });

      setSubmitSuccess(created);
      onPropertyCreated(created);
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title & Process Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-7 h-7 text-sky-400" />
            <span>Register 3D Spatial Property Record</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Convert 2D cadastral records, deed drawings and sanction plans into georeferenced 3D spatial cadastre envelopes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow: 2D Record → 3D ULPIN → Spatial Audit</span>
          </span>
        </div>
      </div>

      {submitSuccess ? (
        /* Success Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">3D Spatial Property Successfully Registered!</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              A unique 3D ULPIN spatial index and volumetric cadastre envelope have been assigned and committed to the registry.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-w-xl mx-auto text-left font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">ASSIGNED 3D ULPIN:</span>
              <span className="text-sky-400 font-bold">{submitSuccess.ulpin_3d}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">2D PARCEL ID:</span>
              <span className="text-slate-300">{submitSuccess.parcel_id_2d}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CADASTRAL VOLUME:</span>
              <span className="text-slate-300">{submitSuccess.cadastral_air_volume_cu_m} m³</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">COMPLIANCE STATUS:</span>
              <span className={submitSuccess.compliance_status === 'Compliant' ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                {submitSuccess.compliance_status} ({submitSuccess.compliance_score_pct}%)
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigateToView('3d')}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition-colors"
            >
              <span>Explore in 3D Visualizer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setSubmitSuccess(null); setUploadResult(null); }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Register Another Property
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Document Upload & Extraction Studio */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-800">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Property Document Ingestion & Extraction</h3>
                  <p className="text-xs text-slate-400">Upload PDF deed, master sanction plan, or municipal layout</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                PyPDF Parser / Simulated Heuristics
              </span>
            </div>

            {/* Drag and Drop Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-6 transition-colors text-center relative group bg-slate-950/40">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-sm text-slate-300 font-medium">Extracting cadastral parameters from document stream...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-sky-400 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Drop document here, or <span className="text-sky-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Supports PDF Deeds, Municipal Drawings, Architectural Layouts</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Extraction Insights Card */}
            {uploadResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-sky-900/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-sky-300 font-semibold">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Extracted Metadata: {uploadResult.filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Engine:</span>
                    <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {uploadResult.extracted_data.extraction_method}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px]">
                      {Math.round(uploadResult.extracted_data.confidence_score * 100)}% Match
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PARCEL / SURVEY ID</span>
                    <span className="font-semibold text-slate-200">{uploadResult.extracted_data.parcel_id_2d}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">APPLICANT / OWNER</span>
                    <span className="font-semibold text-slate-200">{uploadResult.extracted_data.owner_name}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PLOT AREA</span>
                    <span className="font-semibold text-slate-200">{uploadResult.extracted_data.plot_area_sqm} sq.m</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">SANCTIONED FLOORS</span>
                    <span className="font-semibold text-slate-200">{uploadResult.extracted_data.permitted_above_ground_floors} Levels</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Note: Values above have been auto-populated into the registration form below. All fields remain fully editable before submission.
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Ownership & Geographic Identity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
              <div className="w-7 h-7 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-800">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Ownership & Geodetic Location</h3>
                <p className="text-xs text-slate-400">2D Cadastral boundary and geospatial anchor coordinates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Property / Project Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">2D Parcel ID / Revenue Survey No.</label>
                <input
                  type="text"
                  required
                  value={formData.parcel_id_2d}
                  onChange={e => setFormData({ ...formData, parcel_id_2d: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registered Owner / Title Holder</label>
                <input
                  type="text"
                  required
                  value={formData.owner_name}
                  onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Owner Contact / Authority</label>
                <input
                  type="text"
                  value={formData.owner_contact}
                  onChange={e => setFormData({ ...formData, owner_contact: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Cadastral Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Latitude (WGS84)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.latitude}
                  onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Longitude (WGS84)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.longitude}
                  onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Spatial Dimensions & Floor Configuration */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
              <div className="w-7 h-7 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-800">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">3D Spatial Dimensions & Construction Envelope</h3>
                <p className="text-xs text-slate-400">Building dimensions, floor levels, and vertical air boundaries</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Plot Area (sq.m)</label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={formData.plot_area_sqm}
                  onChange={e => setFormData({ ...formData, plot_area_sqm: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Building Length (m)</label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  value={formData.building_length_m}
                  onChange={e => setFormData({ ...formData, building_length_m: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Building Width (m)</label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  value={formData.building_width_m}
                  onChange={e => setFormData({ ...formData, building_width_m: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Basement Floors (Z &lt; 0)</label>
                <select
                  value={formData.basement_floors}
                  onChange={e => setFormData({ ...formData, basement_floors: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="0">0 (No Basement)</option>
                  <option value="1">1 Basement (Parking / Utility)</option>
                  <option value="2">2 Basements (Deep Parking)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Permitted Above-Ground Floors
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={formData.permitted_above_ground_floors}
                  onChange={e => setFormData({ ...formData, permitted_above_ground_floors: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observed Construction Floors (In-situ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={formData.observed_above_ground_floors}
                  onChange={e => setFormData({ ...formData, observed_above_ground_floors: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            {/* Live Compliance & Geometric Feedback Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Calculated Footprint</span>
                <span className="text-sm font-semibold text-white">{footprintArea} sq.m</span>
                <span className="text-[10px] text-slate-400 block">Ground Coverage: {Math.round(groundCoveragePct)}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Cadastral Volume</span>
                <span className="text-sm font-semibold text-sky-400">
                  {Math.round(footprintArea * formData.observed_above_ground_floors * 3.2)} m³
                </span>
                <span className="text-[10px] text-slate-400 block">Height: {formData.observed_above_ground_floors * 3.2}m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Compliance Status</span>
                <span className={`text-sm font-semibold ${excessFloors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {excessFloors > 0 ? `+${excessFloors} Unauthorized Floors` : 'Compliant'}
                </span>
                <span className="text-[10px] text-slate-400 block">Sanctioned: {formData.permitted_above_ground_floors} | Built: {formData.observed_above_ground_floors}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Penalty Estimate</span>
                <span className="text-sm font-semibold text-amber-400">
                  ₹{estimatedPenalty.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Rate: ₹4,800 / excess sq.m</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToView('dashboard')}
              className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-950 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating 3D Cadastre Record...</span>
                </>
              ) : (
                <>
                  <span>Register & Assign 3D ULPIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
