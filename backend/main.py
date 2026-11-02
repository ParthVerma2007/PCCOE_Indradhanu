import os
import uuid
import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from models import PropertyModel, PropertyCreateRequest, FloorRecord, CadastreDocument
import database
from cadastre_engine import generate_3d_ulpin, compute_parcel_boundary, evaluate_compliance, generate_floors_for_building
from document_parser import parse_property_document
from sample_data import get_initial_sample_properties

# Initialize database
database.init_db()

app = FastAPI(
    title="SpatialCadastre3D API",
    description="Unified 3D Spatial Indexing for Property Verification & Compliance",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def root():
    return {
        "service": "SpatialCadastre3D Backend",
        "status": "online",
        "version": "1.0.0",
        "description": "Unified 3D Spatial Indexing for Property Verification & Compliance"
    }

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    properties = database.get_all_properties()
    
    total_properties = len(properties)
    total_3d_mapped = total_properties
    pending_verification = sum(1 for p in properties if p.compliance_status == "Pending Verification")
    violations_count = sum(1 for p in properties if p.compliance_status in ["Non-Compliant", "Critical Violation"])
    total_volume = sum(p.cadastral_air_volume_cu_m for p in properties)
    total_plot_area = sum(p.plot_area_sqm for p in properties)
    
    recent = sorted(properties, key=lambda x: x.created_at, reverse=True)[:5]
    
    return {
        "total_properties": total_properties,
        "total_3d_mapped": total_3d_mapped,
        "pending_verification": pending_verification,
        "compliance_violations": violations_count,
        "total_cadastral_volume_cu_m": round(total_volume, 1),
        "total_plot_area_sqm": round(total_plot_area, 1),
        "recent_properties": recent
    }

@app.get("/api/properties", response_model=List[PropertyModel])
def list_properties(query: Optional[str] = None):
    properties = database.get_all_properties()
    if query:
        q = query.lower()
        properties = [
            p for p in properties
            if q in p.title.lower()
            or q in p.ulpin_3d.lower()
            or q in p.parcel_id_2d.lower()
            or q in p.owner_name.lower()
            or q in p.address.lower()
        ]
    return properties

@app.get("/api/properties/{property_id}", response_model=PropertyModel)
def get_property(property_id: str):
    prop = database.get_property_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@app.post("/api/properties", response_model=PropertyModel)
def create_property(req: PropertyCreateRequest):
    prop_id = f"prop-{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # 1. Calculate Footprint
    footprint = req.building_length_m * req.building_width_m
    
    # 2. Generate or accept floor records
    if req.floors and len(req.floors) > 0:
        floors = req.floors
    else:
        floors = generate_floors_for_building(
            basement_floors=req.basement_floors,
            permitted_above=req.permitted_above_ground_floors,
            observed_above=req.observed_above_ground_floors,
            footprint_area=footprint,
            owner_name=req.owner_name
        )
        
    # 3. Evaluate Rule-based Compliance
    comp = evaluate_compliance(
        plot_area_sqm=req.plot_area_sqm,
        building_footprint_sqm=footprint,
        permitted_floors=req.permitted_above_ground_floors,
        observed_floors=req.observed_above_ground_floors,
        basement_floors=req.basement_floors,
        permitted_fsi=req.permitted_fsi or 1.75,
        floors=floors
    )
    
    # 4. Total height & Cadastral Air Volume
    total_height = req.observed_above_ground_floors * 3.2
    cadastral_volume = round(footprint * total_height, 1)
    
    # 5. Generate official 3D ULPIN
    ulpin_3d = generate_3d_ulpin(
        lat=req.latitude,
        lng=req.longitude,
        parcel_id=req.parcel_id_2d,
        height_m=total_height,
        volume_cu_m=cadastral_volume
    )
    
    # 6. Generate Boundary
    boundary = compute_parcel_boundary(req.latitude, req.longitude, req.plot_area_sqm)
    
    # 7. Document models
    docs = []
    if req.documents:
        for d in req.documents:
            docs.append(CadastreDocument(
                id=d.get("id", f"doc-{uuid.uuid4().hex[:6]}"),
                filename=d.get("filename", "Uploaded_Doc.pdf"),
                document_type=d.get("document_type", "Municipal Sanction Plan"),
                uploaded_at=d.get("uploaded_at", now),
                file_size_bytes=d.get("file_size_bytes", 1024),
                extracted_metadata=d.get("extracted_metadata", {})
            ))

    prop = PropertyModel(
        id=prop_id,
        title=req.title,
        parcel_id_2d=req.parcel_id_2d,
        ulpin_3d=ulpin_3d,
        owner_name=req.owner_name,
        owner_contact=req.owner_contact or "+91 98765 43210",
        address=req.address,
        city=req.city or "Bengaluru",
        state=req.state or "Karnataka",
        latitude=req.latitude,
        longitude=req.longitude,
        boundary_coordinates=boundary,
        plot_area_sqm=req.plot_area_sqm,
        building_length_m=req.building_length_m,
        building_width_m=req.building_width_m,
        building_footprint_sqm=footprint,
        basement_floors=req.basement_floors,
        permitted_above_ground_floors=req.permitted_above_ground_floors,
        observed_above_ground_floors=req.observed_above_ground_floors,
        permitted_height_m=comp["permitted_height_m"],
        observed_height_m=comp["observed_height_m"],
        permitted_fsi=req.permitted_fsi or 1.75,
        observed_fsi=comp["observed_fsi"],
        cadastral_air_volume_cu_m=cadastral_volume,
        elevation_datum_msl=req.elevation_datum_msl or 920.0,
        compliance_status=comp["compliance_status"],
        compliance_score_pct=comp["compliance_score_pct"],
        excess_floors=comp["excess_floors"],
        excess_height_m=comp["excess_height_m"],
        excess_area_sqm=comp["excess_area_sqm"],
        violations=comp["violations"],
        penalty_estimate_inr=comp["penalty_estimate_inr"],
        floors=floors,
        documents=docs,
        created_at=now,
        updated_at=now
    )
    
    database.insert_property(prop)
    return prop

@app.delete("/api/properties/{property_id}")
def delete_property(property_id: str):
    success = database.delete_property_by_id(property_id)
    if not success:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"status": "deleted", "id": property_id}

@app.post("/api/documents/upload-extract")
async def upload_and_extract_document(file: UploadFile = File(...)):
    contents = await file.read()
    
    # Save file to uploads folder
    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as f:
        f.write(contents)
        
    extracted = parse_property_document(file.filename, contents)
    
    return {
        "filename": file.filename,
        "file_size_bytes": len(contents),
        "uploaded_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "extracted_data": extracted
    }

@app.post("/api/reset-sample-data")
def reset_samples():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM properties")
    conn.commit()
    samples = get_initial_sample_properties()
    for s in samples:
        database.insert_property(s, conn)
    conn.commit()
    conn.close()
    return {"status": "reset_successful", "count": len(samples)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
