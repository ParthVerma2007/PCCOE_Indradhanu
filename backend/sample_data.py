import datetime
from typing import List
from models import PropertyModel, FloorRecord, CadastreDocument
from cadastre_engine import generate_3d_ulpin, compute_parcel_boundary, evaluate_compliance, generate_floors_for_building

def get_initial_sample_properties() -> List[PropertyModel]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # 1. TechPark Horizon Tower (Commercial, 2 excess floors violation)
    lat1, lng1 = 12.9716, 77.5946
    plot1 = 1800.0
    len1, wid1 = 30.0, 24.0
    footprint1 = len1 * wid1
    floors1 = generate_floors_for_building(
        basement_floors=2,
        permitted_above=6,
        observed_above=8,
        footprint_area=footprint1,
        owner_name="Horizon Realty Assets LLP"
    )
    comp1 = evaluate_compliance(plot1, footprint1, 6, 8, 2, 2.5, floors1)
    height1 = 8 * 3.2
    vol1 = round(footprint1 * height1, 1)
    ulpin1 = generate_3d_ulpin(lat1, lng1, "BLR-CBD-4019", height1, vol1)
    
    p1 = PropertyModel(
        id="prop-001",
        title="TechPark Horizon Tower",
        parcel_id_2d="SURV-4019/BBMP-CBD",
        ulpin_3d=ulpin1,
        owner_name="Horizon Realty Assets LLP",
        owner_contact="+91 98450 11223",
        address="Plot 42, Outer Ring Road, Central Business District",
        city="Bengaluru",
        state="Karnataka",
        latitude=lat1,
        longitude=lng1,
        boundary_coordinates=compute_parcel_boundary(lat1, lng1, plot1),
        plot_area_sqm=plot1,
        building_length_m=len1,
        building_width_m=wid1,
        building_footprint_sqm=footprint1,
        basement_floors=2,
        permitted_above_ground_floors=6,
        observed_above_ground_floors=8,
        permitted_height_m=comp1["permitted_height_m"],
        observed_height_m=comp1["observed_height_m"],
        permitted_fsi=2.5,
        observed_fsi=comp1["observed_fsi"],
        cadastral_air_volume_cu_m=vol1,
        elevation_datum_msl=920.0,
        compliance_status=comp1["compliance_status"],
        compliance_score_pct=comp1["compliance_score_pct"],
        excess_floors=comp1["excess_floors"],
        excess_height_m=comp1["excess_height_m"],
        excess_area_sqm=comp1["excess_area_sqm"],
        violations=comp1["violations"],
        penalty_estimate_inr=comp1["penalty_estimate_inr"],
        floors=floors1,
        documents=[
            CadastreDocument(
                id="doc-101",
                filename="Sanctioned_Master_Plan_2022.pdf",
                document_type="Municipal Sanction Plan",
                uploaded_at="2026-03-15T10:30:00Z",
                file_size_bytes=4250000,
                extracted_metadata={"approved_floors": 6, "sanction_num": "BBMP/WD-12/2022-89"}
            ),
            CadastreDocument(
                id="doc-102",
                filename="Title_Deed_Katha_A.pdf",
                document_type="Title Deed",
                uploaded_at="2026-03-15T10:32:00Z",
                file_size_bytes=1840000,
                extracted_metadata={"katha_category": "A-Katha", "registration_date": "2018-09-12"}
            )
        ],
        created_at=now,
        updated_at=now
    )

    # 2. Greenwood Villa Residency (Residential Duplex, Fully Compliant)
    lat2, lng2 = 12.9784, 77.6408
    plot2 = 450.0
    len2, wid2 = 16.0, 12.0
    footprint2 = len2 * wid2
    floors2 = generate_floors_for_building(
        basement_floors=1,
        permitted_above=2,
        observed_above=2,
        footprint_area=footprint2,
        owner_name="Col. Rajeshwar Rao & Dr. Anita Rao"
    )
    comp2 = evaluate_compliance(plot2, footprint2, 2, 2, 1, 1.5, floors2)
    height2 = 2 * 3.2
    vol2 = round(footprint2 * height2, 1)
    ulpin2 = generate_3d_ulpin(lat2, lng2, "BLR-IDR-118", height2, vol2)

    p2 = PropertyModel(
        id="prop-002",
        title="Greenwood Villa Residency",
        parcel_id_2d="SURV-118/INDIRANAGAR",
        ulpin_3d=ulpin2,
        owner_name="Col. Rajeshwar Rao & Dr. Anita Rao",
        owner_contact="+91 94480 55670",
        address="House 89, 12th Main Road, HAL 2nd Stage, Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        latitude=lat2,
        longitude=lng2,
        boundary_coordinates=compute_parcel_boundary(lat2, lng2, plot2),
        plot_area_sqm=plot2,
        building_length_m=len2,
        building_width_m=wid2,
        building_footprint_sqm=footprint2,
        basement_floors=1,
        permitted_above_ground_floors=2,
        observed_above_ground_floors=2,
        permitted_height_m=comp2["permitted_height_m"],
        observed_height_m=comp2["observed_height_m"],
        permitted_fsi=1.5,
        observed_fsi=comp2["observed_fsi"],
        cadastral_air_volume_cu_m=vol2,
        elevation_datum_msl=914.5,
        compliance_status="Compliant",
        compliance_score_pct=100,
        excess_floors=0,
        excess_height_m=0.0,
        excess_area_sqm=0.0,
        violations=[],
        penalty_estimate_inr=0.0,
        floors=floors2,
        documents=[
            CadastreDocument(
                id="doc-201",
                filename="Indiranagar_Sanction_Plan.pdf",
                document_type="Municipal Sanction Plan",
                uploaded_at="2026-04-02T11:20:00Z",
                file_size_bytes=2100000,
                extracted_metadata={"approved_floors": 2, "residential_class": "R-1"}
            )
        ],
        created_at=now,
        updated_at=now
    )

    # 3. Silver Oak Commercial Plaza (Mixed Use, 1 excess floor violation)
    lat3, lng3 = 12.9352, 77.6245
    plot3 = 1200.0
    len3, wid3 = 25.0, 18.0
    footprint3 = len3 * wid3
    floors3 = generate_floors_for_building(
        basement_floors=1,
        permitted_above=4,
        observed_above=5,
        footprint_area=footprint3,
        owner_name="Silver Oak Commercial Properties"
    )
    comp3 = evaluate_compliance(plot3, footprint3, 4, 5, 1, 2.0, floors3)
    height3 = 5 * 3.2
    vol3 = round(footprint3 * height3, 1)
    ulpin3 = generate_3d_ulpin(lat3, lng3, "BLR-KRM-882", height3, vol3)

    p3 = PropertyModel(
        id="prop-003",
        title="Silver Oak Commercial Plaza",
        parcel_id_2d="SURV-882/KORAMANGALA-5B",
        ulpin_3d=ulpin3,
        owner_name="Silver Oak Commercial Properties",
        owner_contact="+91 99001 77889",
        address="100 Feet Road, 5th Block Koramangala",
        city="Bengaluru",
        state="Karnataka",
        latitude=lat3,
        longitude=lng3,
        boundary_coordinates=compute_parcel_boundary(lat3, lng3, plot3),
        plot_area_sqm=plot3,
        building_length_m=len3,
        building_width_m=wid3,
        building_footprint_sqm=footprint3,
        basement_floors=1,
        permitted_above_ground_floors=4,
        observed_above_ground_floors=5,
        permitted_height_m=comp3["permitted_height_m"],
        observed_height_m=comp3["observed_height_m"],
        permitted_fsi=2.0,
        observed_fsi=comp3["observed_fsi"],
        cadastral_air_volume_cu_m=vol3,
        elevation_datum_msl=905.0,
        compliance_status=comp3["compliance_status"],
        compliance_score_pct=comp3["compliance_score_pct"],
        excess_floors=comp3["excess_floors"],
        excess_height_m=comp3["excess_height_m"],
        excess_area_sqm=comp3["excess_area_sqm"],
        violations=comp3["violations"],
        penalty_estimate_inr=comp3["penalty_estimate_inr"],
        floors=floors3,
        documents=[
            CadastreDocument(
                id="doc-301",
                filename="Commercial_Lease_Registry.pdf",
                document_type="Title Deed",
                uploaded_at="2026-05-10T14:15:00Z",
                file_size_bytes=3120000,
                extracted_metadata={"tenant_count": 8, "zoning": "C-2 Commercial"}
            )
        ],
        created_at=now,
        updated_at=now
    )

    # 4. Apex Logistics & Transit Terminal (Industrial / Utility, Compliant)
    lat4, lng4 = 13.0285, 77.5192
    plot4 = 3200.0
    len4, wid4 = 50.0, 35.0
    footprint4 = len4 * wid4
    floors4 = [
        FloorRecord(
            floor_number=1,
            floor_name="High-Bay Distribution Warehouse Ground Deck",
            floor_height_m=9.5,
            elevation_start_m=0.0,
            elevation_end_m=9.5,
            built_area_sqm=footprint4,
            usage_type="Industrial / Warehousing",
            owner_name="Apex Logistics Infra Corp",
            unit_count=4,
            is_permitted=True,
            violation_notes=None,
            color_hint="#0284c7"
        )
    ]
    height4 = 9.5
    vol4 = round(footprint4 * height4, 1)
    ulpin4 = generate_3d_ulpin(lat4, lng4, "BLR-PNY-902", height4, vol4)

    p4 = PropertyModel(
        id="prop-004",
        title="Apex Logistics & Transit Terminal",
        parcel_id_2d="SURV-902/PEENYA-IND",
        ulpin_3d=ulpin4,
        owner_name="Apex Logistics Infra Corp",
        owner_contact="+91 97420 33445",
        address="Peenya Industrial Area Phase II, Near Tumkur Road",
        city="Bengaluru",
        state="Karnataka",
        latitude=lat4,
        longitude=lng4,
        boundary_coordinates=compute_parcel_boundary(lat4, lng4, plot4),
        plot_area_sqm=plot4,
        building_length_m=len4,
        building_width_m=wid4,
        building_footprint_sqm=footprint4,
        basement_floors=0,
        permitted_above_ground_floors=1,
        observed_above_ground_floors=1,
        permitted_height_m=10.0,
        observed_height_m=9.5,
        permitted_fsi=1.0,
        observed_fsi=round(footprint4 / plot4, 2),
        cadastral_air_volume_cu_m=vol4,
        elevation_datum_msl=890.0,
        compliance_status="Compliant",
        compliance_score_pct=100,
        excess_floors=0,
        excess_height_m=0.0,
        excess_area_sqm=0.0,
        violations=[],
        penalty_estimate_inr=0.0,
        floors=floors4,
        documents=[
            CadastreDocument(
                id="doc-401",
                filename="KIADB_Allotment_Deed.pdf",
                document_type="Title Deed",
                uploaded_at="2026-06-12T09:00:00Z",
                file_size_bytes=5200000,
                extracted_metadata={"industrial_clearance": "PCB-Green", "allotment_id": "KIADB-PNY-44"}
            )
        ],
        created_at=now,
        updated_at=now
    )

    # 5. Skyline Grandeur Towers (High-Rise Residential, Pending Verification)
    lat5, lng5 = 12.9856, 77.7290
    plot5 = 2600.0
    len5, wid5 = 32.0, 22.0
    footprint5 = len5 * wid5
    floors5 = generate_floors_for_building(
        basement_floors=2,
        permitted_above=10,
        observed_above=10,
        footprint_area=footprint5,
        owner_name="Skyline Resident Welfare Association"
    )
    comp5 = evaluate_compliance(plot5, footprint5, 10, 10, 2, 3.0, floors5)
    height5 = 10 * 3.2
    vol5 = round(footprint5 * height5, 1)
    ulpin5 = generate_3d_ulpin(lat5, lng5, "BLR-WTF-553", height5, vol5)

    p5 = PropertyModel(
        id="prop-005",
        title="Skyline Grandeur Towers",
        parcel_id_2d="SURV-553/WHITEFIELD",
        ulpin_3d=ulpin5,
        owner_name="Skyline Resident Welfare Association",
        owner_contact="+91 96111 22334",
        address="ITPL Main Road, Prestige Shantiniketan Corridor, Whitefield",
        city="Bengaluru",
        state="Karnataka",
        latitude=lat5,
        longitude=lng5,
        boundary_coordinates=compute_parcel_boundary(lat5, lng5, plot5),
        plot_area_sqm=plot5,
        building_length_m=len5,
        building_width_m=wid5,
        building_footprint_sqm=footprint5,
        basement_floors=2,
        permitted_above_ground_floors=10,
        observed_above_ground_floors=10,
        permitted_height_m=comp5["permitted_height_m"],
        observed_height_m=comp5["observed_height_m"],
        permitted_fsi=3.0,
        observed_fsi=comp5["observed_fsi"],
        cadastral_air_volume_cu_m=vol5,
        elevation_datum_msl=885.0,
        compliance_status="Pending Verification",
        compliance_score_pct=95,
        excess_floors=0,
        excess_height_m=0.0,
        excess_area_sqm=0.0,
        violations=["Structural occupancy certificate inspection scheduled by Urban Local Body."],
        penalty_estimate_inr=0.0,
        floors=floors5,
        documents=[
            CadastreDocument(
                id="doc-501",
                filename="HighRise_Fire_Clearance_NOC.pdf",
                document_type="Structural Drawing",
                uploaded_at="2026-08-20T16:45:00Z",
                file_size_bytes=3800000,
                extracted_metadata={"fire_safety_noc": "FS-NOC-2026-09", "evacuation_shafts": 3}
            )
        ],
        created_at=now,
        updated_at=now
    )

    return [p1, p2, p3, p4, p5]
