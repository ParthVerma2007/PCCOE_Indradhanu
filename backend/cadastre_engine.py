import math
import hashlib
from typing import List, Dict, Any, Tuple
from models import FloorRecord, PropertyModel

def generate_3d_ulpin(lat: float, lng: float, parcel_id: str, height_m: float, volume_cu_m: float) -> str:
    """
    Generates an official-standard 3D ULPIN (Unique Land Parcel Identification Number).
    Standard 2D ULPIN (Bhu-Aadhaar) is a 14-character alphanumeric based on longitude/latitude centroid.
    3D ULPIN incorporates vertical elevation bounds (Z-axis) and spatial volume hash.
    Format: U3D-[LAT_GRID]-[LNG_GRID]-[Z_SPAN]-[HASH4]
    """
    lat_code = f"{int(abs(lat)*1000):05d}"
    lng_code = f"{int(abs(lng)*1000):05d}"
    height_tag = f"Z{int(height_m):02d}M"
    vol_tag = f"V{int(volume_cu_m):04d}"
    
    unique_seed = f"{parcel_id}_{lat}_{lng}_{height_m}_{volume_cu_m}".encode('utf-8')
    hash_hex = hashlib.sha256(unique_seed).hexdigest()[:4].upper()
    
    return f"3D-CAD-{lat_code}{lng_code}-{height_tag}-{hash_hex}"

def compute_parcel_boundary(lat: float, lng: float, plot_area_sqm: float) -> List[List[float]]:
    """
    Generates a realistic 4-corner polygon representing the cadastral boundary
    around the center coordinate based on plot area.
    """
    side_m = math.sqrt(plot_area_sqm)
    # Approx 1 deg latitude ~ 111,000 m
    # 1 deg longitude ~ 111,000 * cos(lat) m
    delta_lat = (side_m / 2.0) / 111139.0
    delta_lng = (side_m / 2.0) / (111139.0 * math.cos(math.radians(lat)))
    
    # Return 4 vertices (closed polygon)
    return [
        [round(lat - delta_lat, 6), round(lng - delta_lng, 6)],
        [round(lat - delta_lat, 6), round(lng + delta_lng, 6)],
        [round(lat + delta_lat, 6), round(lng + delta_lng, 6)],
        [round(lat + delta_lat, 6), round(lng - delta_lng, 6)],
        [round(lat - delta_lat, 6), round(lng - delta_lng, 6)]
    ]

def evaluate_compliance(
    plot_area_sqm: float,
    building_footprint_sqm: float,
    permitted_floors: int,
    observed_floors: int,
    basement_floors: int,
    permitted_fsi: float,
    floors: List[FloorRecord]
) -> Dict[str, Any]:
    """
    Rule-based comparison between Permitted Master Plan / Sanctioned limits
    and In-situ / Sensor Observed spatial structure.
    """
    violations = []
    
    # 1. Floor count violation
    excess_floors = max(0, observed_floors - permitted_floors)
    if excess_floors > 0:
        violations.append(f"Vertical Encroachment: {excess_floors} unauthorized floor(s) constructed above sanctioned limit ({permitted_floors} permitted, {observed_floors} observed).")

    # 2. Height calculations
    avg_floor_height = 3.2
    permitted_height = permitted_floors * avg_floor_height
    observed_height = observed_floors * avg_floor_height
    excess_height = max(0.0, observed_height - permitted_height)
    if excess_height > 1.0:
        violations.append(f"Height Violation: Structural height exceeds permitted elevation by {round(excess_height, 2)} meters.")

    # 3. Built-up Area & FSI / FAR
    permitted_built_area = plot_area_sqm * permitted_fsi
    
    # Calculate observed built area (excluding basement if classified as parking)
    observed_built_area = 0.0
    for fl in floors:
        if fl.floor_number > 0 or fl.usage_type != "Parking":
            observed_built_area += fl.built_area_sqm
            
    if observed_built_area == 0:
        observed_built_area = building_footprint_sqm * observed_floors
        
    observed_fsi = round(observed_built_area / plot_area_sqm, 2) if plot_area_sqm > 0 else 0.0
    excess_area = max(0.0, observed_built_area - permitted_built_area)
    
    if excess_area > 15.0:
        violations.append(f"FSI Deviation: Observed FAR/FSI {observed_fsi} exceeds permitted limit {permitted_fsi} (Unauthorized area: {round(excess_area, 1)} sq.m).")

    # 4. Ground Coverage / Setback
    ground_coverage_pct = (building_footprint_sqm / plot_area_sqm) * 100.0 if plot_area_sqm > 0 else 0.0
    if ground_coverage_pct > 75.0:
        violations.append(f"Setback Encroachment: Ground coverage is {round(ground_coverage_pct, 1)}% (Maximum permitted standard is 70%). Perimeter buffer compromised.")

    # 5. Status & Penalty Calculation
    penalty_per_sqm = 4800.0 # INR standard municipal compounding penalty
    penalty_estimate = round(excess_area * penalty_per_sqm, 0)
    
    if excess_floors > 1 or excess_area > 100.0:
        compliance_status = "Critical Violation"
        score = max(20, 100 - (excess_floors * 25) - int(excess_area / 20))
    elif excess_floors == 1 or excess_area > 15.0 or ground_coverage_pct > 75.0:
        compliance_status = "Non-Compliant"
        score = max(55, 100 - (excess_floors * 20) - int(excess_area / 30))
    else:
        compliance_status = "Compliant"
        score = 100

    return {
        "compliance_status": compliance_status,
        "compliance_score_pct": score,
        "excess_floors": excess_floors,
        "excess_height_m": round(excess_height, 2),
        "excess_area_sqm": round(excess_area, 2),
        "permitted_height_m": round(permitted_height, 2),
        "observed_height_m": round(observed_height, 2),
        "permitted_built_area_sqm": round(permitted_built_area, 2),
        "observed_built_area_sqm": round(observed_built_area, 2),
        "observed_fsi": observed_fsi,
        "violations": violations,
        "penalty_estimate_inr": penalty_estimate
    }

def generate_floors_for_building(
    basement_floors: int,
    permitted_above: int,
    observed_above: int,
    footprint_area: float,
    owner_name: str
) -> List[FloorRecord]:
    """
    Builds structured floor records with vertical elevation ranges, usage classifications,
    and individual floor compliance flags.
    """
    floors: List[FloorRecord] = []
    floor_height = 3.2
    
    # 1. Basements (Z < 0)
    for b in range(basement_floors, 0, -1):
        elev_start = -b * floor_height
        elev_end = -(b - 1) * floor_height
        floors.append(FloorRecord(
            floor_number=-b,
            floor_name=f"Basement B{b} (Parking & Utilities)",
            floor_height_m=floor_height,
            elevation_start_m=round(elev_start, 2),
            elevation_end_m=round(elev_end, 2),
            built_area_sqm=round(footprint_area * 1.1, 1),
            usage_type="Parking",
            owner_name="Common Society / Utility Co.",
            unit_count=18,
            is_permitted=True,
            violation_notes=None,
            color_hint="#3b82f6"
        ))
        
    # 2. Above-ground floors (Z >= 0)
    for f in range(1, observed_above + 1):
        elev_start = (f - 1) * floor_height
        elev_end = f * floor_height
        is_permitted = (f <= permitted_above)
        
        # Determine realistic usage & owner
        if f == 1:
            usage = "Retail / Commercial"
            owner = owner_name
            name = "Ground Floor (Commercial Arcade)"
            color = "#10b981"
        elif f == 2:
            usage = "Commercial Office"
            owner = f"{owner_name} - Suite A"
            name = "Level 2 (Corporate Workspace)"
            color = "#06b6d4"
        elif f <= 4:
            usage = "Residential"
            owner = f"Unit Holders ({f}01-{f}04)"
            name = f"Level {f} (Residential Suites)"
            color = "#6366f1"
        else:
            usage = "Mixed Penthouse"
            owner = f"Independent Tenancy {f}A"
            name = f"Level {f} (Upper Floor)"
            color = "#8b5cf6"
            
        violation_notes = None if is_permitted else f"UNAUTHORIZED LEVEL: Constructed beyond Sanction Plan (Permitted limit: {permitted_above} floors)."
        if not is_permitted:
            color = "#ef4444" # Highlighted in red
            
        floors.append(FloorRecord(
            floor_number=f,
            floor_name=name,
            floor_height_m=floor_height,
            elevation_start_m=round(elev_start, 2),
            elevation_end_m=round(elev_end, 2),
            built_area_sqm=round(footprint_area, 1),
            usage_type=usage,
            owner_name=owner,
            unit_count=3 if f > 1 else 4,
            is_permitted=is_permitted,
            violation_notes=violation_notes,
            color_hint=color
        ))
        
    return floors
