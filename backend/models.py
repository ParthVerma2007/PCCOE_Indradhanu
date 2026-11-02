from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FloorRecord(BaseModel):
    floor_number: int # -1 for basement, 0 or 1 for ground, etc.
    floor_name: str
    floor_height_m: float = 3.2
    elevation_start_m: float = 0.0
    elevation_end_m: float = 3.2
    built_area_sqm: float = 240.0
    usage_type: str = "Commercial" # "Residential", "Commercial", "Parking", "Retail", "Mixed", "Utility"
    owner_name: str = "Primary Owner"
    unit_count: int = 2
    is_permitted: bool = True
    violation_notes: Optional[str] = None
    color_hint: Optional[str] = None

class CadastreDocument(BaseModel):
    id: str
    filename: str
    document_type: str # "Title Deed", "Municipal Sanction Plan", "Tax Receipt", "Structural Drawing"
    uploaded_at: str
    file_size_bytes: int = 0
    extracted_metadata: Dict[str, Any] = {}

class PropertyModel(BaseModel):
    id: str
    title: str
    parcel_id_2d: str
    ulpin_3d: str
    owner_name: str
    owner_contact: str = "+91 98765 43210"
    address: str
    city: str = "Bengaluru"
    state: str = "Karnataka"
    latitude: float
    longitude: float
    boundary_coordinates: List[List[float]] = [] # [[lat, lng], ...]
    plot_area_sqm: float
    building_length_m: float = 20.0
    building_width_m: float = 12.0
    building_footprint_sqm: float = 240.0
    
    # Floor parameters
    basement_floors: int = 0
    permitted_above_ground_floors: int = 4
    observed_above_ground_floors: int = 4
    
    # Height parameters
    permitted_height_m: float = 14.5
    observed_height_m: float = 14.5
    
    # FSI parameters
    permitted_fsi: float = 1.75
    observed_fsi: float = 1.75
    
    # 3D Bounding Spatial Enclosure
    cadastral_air_volume_cu_m: float = 0.0
    elevation_datum_msl: float = 920.0 # Height above Mean Sea Level
    
    # Compliance
    compliance_status: str = "Compliant" # "Compliant", "Non-Compliant", "Pending Verification", "Encroachment Warning"
    compliance_score_pct: int = 100
    excess_floors: int = 0
    excess_height_m: float = 0.0
    excess_area_sqm: float = 0.0
    violations: List[str] = []
    penalty_estimate_inr: float = 0.0
    
    floors: List[FloorRecord] = []
    documents: List[CadastreDocument] = []
    created_at: str
    updated_at: str

class PropertyCreateRequest(BaseModel):
    title: str
    parcel_id_2d: str
    owner_name: str
    owner_contact: Optional[str] = "+91 98765 43210"
    address: str
    city: Optional[str] = "Bengaluru"
    state: Optional[str] = "Karnataka"
    latitude: float
    longitude: float
    plot_area_sqm: float
    building_length_m: float = 20.0
    building_width_m: float = 15.0
    basement_floors: int = 0
    permitted_above_ground_floors: int = 3
    observed_above_ground_floors: int = 3
    permitted_fsi: Optional[float] = 1.75
    elevation_datum_msl: Optional[float] = 920.0
    floors: Optional[List[FloorRecord]] = None
    documents: Optional[List[Dict[str, Any]]] = None
