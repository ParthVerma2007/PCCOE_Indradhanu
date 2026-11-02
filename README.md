# SpatialCadastre3D – Unified 3D Spatial Indexing for Property Verification & Compliance

A full-stack Geospatial MVP prototype that converts conventional 2D property records into uniquely identifiable, georeferenced **3D Spatial Property Records** with automated permitted-versus-observed construction compliance auditing.

---

## 🚀 Quick Start

The application runs locally in `D:\Indradhanu`.

### Option 1: One-Click Launch (Windows)
Double-click `start.bat` or run:
```powershell
.\start.bat
```
*(or run `.\start.ps1` in PowerShell)*

This automatically starts both the **FastAPI Backend** and the **Vite React Frontend**.

### Option 2: Manual Terminal Launch

**Terminal 1 — Backend (FastAPI):**
```powershell
cd D:\Indradhanu\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API:* [http://127.0.0.1:8000](http://127.0.0.1:8000)  
*Interactive Swagger Docs:* [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Terminal 2 — Frontend (Vite + React + Three.js):**
```powershell
cd D:\Indradhanu\frontend
npm run dev
```
*Frontend UI:* [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Enterprise SaaS Geospatial Dashboard |
| **Styling** | Tailwind CSS v4 | Dark navy & blue precision theme |
| **3D Engine** | Three.js + OrbitControls | Procedural 3D floor geometry, Raycasting, Exploded view, Air parcel volume |
| **GIS Mapping** | Leaflet + OpenStreetMap | Interactive polygon parcels, custom marker pins, fly-to camera |
| **Backend** | Python FastAPI | REST endpoints for spatial registration, compliance, stats |
| **Database** | SQLite (`cadastre3d.db`) | Local persistent storage with auto-seeding |
| **Document Ingestion** | PyPDF + Rule-based Heuristics | Real stream text parser & municipal sanction plan extractor |

---

## 🏢 Core Modules

### 1. Dashboard
- **Executive KPIs**: Total Registered Properties, 3D-Mapped Air Parcels, Pending Verification, and Active Compliance Violations.
- **Workflow Pipeline Indicator**: 2D Record → 3D ULPIN → Spatial 3D Model → Geometric Audit.
- **Recent Registrations Ledger**: Live table with quick 3D model launch and compliance tags.

### 2. Property Registration & Document Extraction Studio
- **Document Ingestion**: Drag & drop PDF deeds or municipal sanction plans.
- **Stream Parser**: Real PyPDF stream analysis and heuristic pattern extraction for Survey/Parcel ID, Owner, Plot Area, and Sanctioned Floors.
- **Editable Form**: Full control over building length, width, floor heights, and basement levels.
- **Real-Time Preview**: Instant calculation of ground coverage %, building volume in $m^3$, and estimated municipal penalty before registration.

### 3. 3D Building Visualizer (Three.js)
- **Procedural Floor Generation**: Renders sub-surface basements (parking/utilities in slate grey) and above-ground floors according to dimensions.
- **Cadastral Air-Rights Envelope**: Neon cyan volumetric wireframe representing the legally sanctioned bounding envelope.
- **Floor Explosion Slider**: Dynamically pulls floors vertically apart in real-time 3D space to inspect individual floor slabs and interior usage zones.
- **Interactive Raycasting**: Click on any floor in the 3D viewport or floor list to reveal owner title, usage category (Commercial, Residential, Retail), built area, and elevation range.
- **Violation Highlighting**: Unauthorized floors pulse with a translucent red warning envelope and warning hazard badge.
- **Camera Presets**: Isometric, 2D Top-Down Footprint, Elevation Front, and Sub-surface Basement views.

### 4. Unique 3D ULPIN Generator
- Extends the national 14-digit **Bhu-Aadhaar ULPIN** into a 3D volumetric spatial identifier.
- Format: `3D-CAD-[LAT_GRID][LNG_GRID]-[Z_SPAN]-[HASH4]`
  - Centroid geodetic coordinate grid (WGS84).
  - Vertical air rights elevation span ($Z$ meters).
  - Cryptographic SHA256 integrity hash combining 2D parcel ID, spatial volume, and datum elevation.
- Comprehensive search by 3D ULPIN, 2D parcel ID, owner name, or address.

### 5. GIS Cadastral Map
- Interactive Leaflet map displaying registered parcel boundaries (polygons) and markers.
- Color-coded compliance states (Green = Compliant, Red = Non-Compliant, Amber = Pending).
- Clickable pins with property summary drawer and one-click fly-to 3D Model.

### 6. Compliance & Encroachment Detection
- Rule-based comparative audit between **Permitted Sanction Plans** and **Observed 3D Construction**.
- Highlights:
  - Unauthorized vertical floors (e.g. 6 permitted vs 8 observed $\rightarrow$ 2 excess floors).
  - Height limit deviations ($m$).
  - Floor Space Index (FSI / FAR) violations.
  - Setback & ground coverage encroachment.
  - Compounding penalty calculator based on municipal rate schedules (₹4,800 / excess sq.m).

---

## 📁 Pre-Loaded Sample Properties

The SQLite database includes 5 realistic sample properties:
1. **TechPark Horizon Tower** (Commercial Hub, 2 basements + 8 floors observed vs 6 permitted $\rightarrow$ Critical Violation: 2 excess floors, ₹1,574,400 penalty).
2. **Greenwood Villa Residency** (Residential Duplex, 1 basement + 2 floors $\rightarrow$ 100% Compliant).
3. **Silver Oak Commercial Plaza** (Mixed-Use Commercial/Residential, 1 basement + 5 floors observed vs 4 permitted $\rightarrow$ Non-Compliant: 1 excess floor).
4. **Apex Logistics & Transit Terminal** (Industrial High-Bay Warehouse, 9.5m vertical clearance $\rightarrow$ 100% Compliant).
5. **Skyline Grandeur Towers** (High-Rise Residential, 2 basements + 10 floors $\rightarrow$ Pending Local Body Verification).

Sample PDF files for document testing are provided in `D:\Indradhanu\sample_documents\`.
