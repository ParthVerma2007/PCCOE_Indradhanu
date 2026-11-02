import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from models import PropertyModel, FloorRecord, CadastreDocument
from sample_data import get_initial_sample_properties

DB_PATH = os.path.join(os.path.dirname(__file__), "cadastre3d.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        parcel_id_2d TEXT NOT NULL,
        ulpin_3d TEXT NOT NULL UNIQUE,
        owner_name TEXT NOT NULL,
        owner_contact TEXT,
        address TEXT NOT NULL,
        city TEXT,
        state TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        boundary_coordinates TEXT,
        plot_area_sqm REAL NOT NULL,
        building_length_m REAL NOT NULL,
        building_width_m REAL NOT NULL,
        building_footprint_sqm REAL NOT NULL,
        basement_floors INTEGER DEFAULT 0,
        permitted_above_ground_floors INTEGER DEFAULT 1,
        observed_above_ground_floors INTEGER DEFAULT 1,
        permitted_height_m REAL,
        observed_height_m REAL,
        permitted_fsi REAL,
        observed_fsi REAL,
        cadastral_air_volume_cu_m REAL,
        elevation_datum_msl REAL,
        compliance_status TEXT,
        compliance_score_pct INTEGER,
        excess_floors INTEGER DEFAULT 0,
        excess_height_m REAL DEFAULT 0,
        excess_area_sqm REAL DEFAULT 0,
        violations TEXT,
        penalty_estimate_inr REAL DEFAULT 0,
        floors TEXT,
        documents TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)
    conn.commit()
    
    # Check if we need to seed initial sample data
    cursor.execute("SELECT COUNT(*) as count FROM properties")
    row = cursor.fetchone()
    if row["count"] == 0:
        samples = get_initial_sample_properties()
        for prop in samples:
            insert_property(prop, conn)
        conn.commit()
        
    conn.close()

def insert_property(prop: PropertyModel, conn=None):
    close_after = False
    if conn is None:
        conn = get_connection()
        close_after = True
        
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO properties (
        id, title, parcel_id_2d, ulpin_3d, owner_name, owner_contact,
        address, city, state, latitude, longitude, boundary_coordinates,
        plot_area_sqm, building_length_m, building_width_m, building_footprint_sqm,
        basement_floors, permitted_above_ground_floors, observed_above_ground_floors,
        permitted_height_m, observed_height_m, permitted_fsi, observed_fsi,
        cadastral_air_volume_cu_m, elevation_datum_msl, compliance_status,
        compliance_score_pct, excess_floors, excess_height_m, excess_area_sqm,
        violations, penalty_estimate_inr, floors, documents, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        prop.id, prop.title, prop.parcel_id_2d, prop.ulpin_3d, prop.owner_name, prop.owner_contact,
        prop.address, prop.city, prop.state, prop.latitude, prop.longitude,
        json.dumps(prop.boundary_coordinates),
        prop.plot_area_sqm, prop.building_length_m, prop.building_width_m, prop.building_footprint_sqm,
        prop.basement_floors, prop.permitted_above_ground_floors, prop.observed_above_ground_floors,
        prop.permitted_height_m, prop.observed_height_m, prop.permitted_fsi, prop.observed_fsi,
        prop.cadastral_air_volume_cu_m, prop.elevation_datum_msl, prop.compliance_status,
        prop.compliance_score_pct, prop.excess_floors, prop.excess_height_m, prop.excess_area_sqm,
        json.dumps(prop.violations), prop.penalty_estimate_inr,
        json.dumps([f.model_dump() for f in prop.floors]),
        json.dumps([d.model_dump() for d in prop.documents]),
        prop.created_at, prop.updated_at
    ))
    
    if close_after:
        conn.commit()
        conn.close()

def row_to_property(row: sqlite3.Row) -> PropertyModel:
    boundary = json.loads(row["boundary_coordinates"]) if row["boundary_coordinates"] else []
    violations = json.loads(row["violations"]) if row["violations"] else []
    floors_raw = json.loads(row["floors"]) if row["floors"] else []
    floors = [FloorRecord(**f) for f in floors_raw]
    docs_raw = json.loads(row["documents"]) if row["documents"] else []
    docs = [CadastreDocument(**d) for d in docs_raw]
    
    return PropertyModel(
        id=row["id"],
        title=row["title"],
        parcel_id_2d=row["parcel_id_2d"],
        ulpin_3d=row["ulpin_3d"],
        owner_name=row["owner_name"],
        owner_contact=row["owner_contact"] or "",
        address=row["address"],
        city=row["city"] or "Bengaluru",
        state=row["state"] or "Karnataka",
        latitude=row["latitude"],
        longitude=row["longitude"],
        boundary_coordinates=boundary,
        plot_area_sqm=row["plot_area_sqm"],
        building_length_m=row["building_length_m"],
        building_width_m=row["building_width_m"],
        building_footprint_sqm=row["building_footprint_sqm"],
        basement_floors=row["basement_floors"],
        permitted_above_ground_floors=row["permitted_above_ground_floors"],
        observed_above_ground_floors=row["observed_above_ground_floors"],
        permitted_height_m=row["permitted_height_m"],
        observed_height_m=row["observed_height_m"],
        permitted_fsi=row["permitted_fsi"],
        observed_fsi=row["observed_fsi"],
        cadastral_air_volume_cu_m=row["cadastral_air_volume_cu_m"],
        elevation_datum_msl=row["elevation_datum_msl"],
        compliance_status=row["compliance_status"],
        compliance_score_pct=row["compliance_score_pct"],
        excess_floors=row["excess_floors"],
        excess_height_m=row["excess_height_m"],
        excess_area_sqm=row["excess_area_sqm"],
        violations=violations,
        penalty_estimate_inr=row["penalty_estimate_inr"],
        floors=floors,
        documents=docs,
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

def get_all_properties() -> List[PropertyModel]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM properties ORDER BY created_at DESC")
    rows = cursor.fetchall()
    properties = [row_to_property(r) for r in rows]
    conn.close()
    return properties

def get_property_by_id(property_id: str) -> Optional[PropertyModel]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM properties WHERE id = ? OR ulpin_3d = ? OR parcel_id_2d = ?", (property_id, property_id, property_id))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row_to_property(row)
    return None

def delete_property_by_id(property_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM properties WHERE id = ?", (property_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
