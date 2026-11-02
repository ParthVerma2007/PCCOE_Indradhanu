import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PropertyModel } from '../types/cadastre';
import { MapPin, Box, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Layers } from 'lucide-react';

interface GISMapViewProps {
  properties: PropertyModel[];
  selectedProperty: PropertyModel | null;
  onSelectProperty: (property: PropertyModel) => void;
  onOpen3DViewer: (property: PropertyModel) => void;
}

export const GISMapView: React.FC<GISMapViewProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  onOpen3DViewer
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Bangalore coordinates
    const defaultCenter: [number, number] = [12.9716, 77.5946];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    // OpenStreetMap standard tiles (100% Free, Zero API Key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    polygonsLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers and Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polygonsLayer = polygonsLayerRef.current;
    if (!map || !markersLayer || !polygonsLayer) return;

    markersLayer.clearLayers();
    polygonsLayer.clearLayers();

    const bounds: [number, number][] = [];

    properties.forEach((prop) => {
      bounds.push([prop.latitude, prop.longitude]);

      const isSelected = selectedProperty?.id === prop.id;
      const isCompliant = prop.compliance_status === 'Compliant';
      const isCritical = prop.compliance_status === 'Critical Violation' || prop.compliance_status === 'Non-Compliant';

      const color = isCritical ? '#ef4444' : (isCompliant ? '#10b981' : '#f59e0b');

      // Parcel Polygon
      if (prop.boundary_coordinates && prop.boundary_coordinates.length > 0) {
        const polygon = L.polygon(prop.boundary_coordinates as L.LatLngExpression[], {
          color: isSelected ? '#38bdf8' : color,
          weight: isSelected ? 3 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.2,
          dashArray: isSelected ? undefined : '4, 4'
        });

        polygon.on('click', () => {
          onSelectProperty(prop);
        });

        polygon.addTo(polygonsLayer);
      }

      // Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-cadastre-pin',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #0f172a;
            border: 2px solid ${isSelected ? '#38bdf8' : color};
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#38bdf8' : color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            ${isSelected ? '<span style="position: absolute; top: -6px; right: -6px; width: 10px; height: 10px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 8px #38bdf8;"></span>' : ''}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      const marker = L.marker([prop.latitude, prop.longitude], { icon: customIcon });
      marker.on('click', () => {
        onSelectProperty(prop);
      });

      marker.addTo(markersLayer);
    });

    // Auto fit bounds if properties exist
    if (bounds.length > 0 && !selectedProperty) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [properties, selectedProperty]);

  // Fly to selected property when clicked
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedProperty) return;
    mapInstanceRef.current.flyTo(
      [selectedProperty.latitude, selectedProperty.longitude],
      16,
      { animate: true, duration: 1.2 }
    );
  }, [selectedProperty]);

  return (
    <div className="relative w-full h-[650px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-700/80 shadow-lg">
        <Layers className="w-5 h-5 text-sky-400" />
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">GIS Cadastral Spatial Index</h3>
          <p className="text-xs text-slate-300">
            {properties.length} Geo-Referenced Land Parcels with 3D Spatial Enclosures
          </p>
        </div>
      </div>

      {/* Selected Property Quick Card */}
      {selectedProperty && (
        <div className="absolute bottom-6 left-6 z-[400] w-96 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                {selectedProperty.ulpin_3d}
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5">{selectedProperty.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-1">{selectedProperty.address}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              selectedProperty.compliance_status === 'Compliant'
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-red-950/70 border-red-800 text-red-300'
            }`}>
              {selectedProperty.compliance_status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Plot Area</span>
              <span className="font-medium text-slate-200">{selectedProperty.plot_area_sqm} sq.m</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Floors (Obs/Perm)</span>
              <span className="font-medium text-slate-200">
                {selectedProperty.observed_above_ground_floors} / {selectedProperty.permitted_above_ground_floors}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">3D Volume</span>
              <span className="font-medium text-sky-300">{selectedProperty.cadastral_air_volume_cu_m} m³</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onOpen3DViewer(selectedProperty)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Box className="w-4 h-4" />
              <span>Launch 3D Spatial Model</span>
            </button>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
