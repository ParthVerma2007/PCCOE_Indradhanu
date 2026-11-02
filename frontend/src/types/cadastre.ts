export interface FloorRecord {
  floor_number: number;
  floor_name: string;
  floor_height_m: number;
  elevation_start_m: number;
  elevation_end_m: number;
  built_area_sqm: number;
  usage_type: string;
  owner_name: string;
  unit_count: number;
  is_permitted: boolean;
  violation_notes?: string | null;
  color_hint?: string | null;
}

export interface CadastreDocument {
  id: string;
  filename: string;
  document_type: string;
  uploaded_at: string;
  file_size_bytes: number;
  extracted_metadata?: Record<string, any>;
}

export interface PropertyModel {
  id: string;
  title: string;
  parcel_id_2d: string;
  ulpin_3d: string;
  owner_name: string;
  owner_contact: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  boundary_coordinates: [number, number][];
  plot_area_sqm: number;
  building_length_m: number;
  building_width_m: number;
  building_footprint_sqm: number;
  basement_floors: number;
  permitted_above_ground_floors: number;
  observed_above_ground_floors: number;
  permitted_height_m: number;
  observed_height_m: number;
  permitted_fsi: number;
  observed_fsi: number;
  cadastral_air_volume_cu_m: number;
  elevation_datum_msl: number;
  compliance_status: "Compliant" | "Non-Compliant" | "Pending Verification" | "Critical Violation";
  compliance_score_pct: number;
  excess_floors: number;
  excess_height_m: number;
  excess_area_sqm: number;
  violations: string[];
  penalty_estimate_inr: number;
  floors: FloorRecord[];
  documents: CadastreDocument[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_properties: number;
  total_3d_mapped: number;
  pending_verification: number;
  compliance_violations: number;
  total_cadastral_volume_cu_m: number;
  total_plot_area_sqm: number;
  recent_properties: PropertyModel[];
}

export interface DocumentExtractionResult {
  filename: string;
  file_size_bytes: number;
  uploaded_at: string;
  extracted_data: {
    title: string;
    parcel_id_2d: string;
    owner_name: string;
    owner_contact: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    plot_area_sqm: number;
    building_length_m: number;
    building_width_m: number;
    basement_floors: number;
    permitted_above_ground_floors: number;
    observed_above_ground_floors: number;
    permitted_fsi: number;
    extraction_method: string;
    confidence_score: number;
    extracted_snippets: string[];
  };
}
