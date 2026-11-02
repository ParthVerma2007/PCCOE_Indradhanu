import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PropertyModel, FloorRecord } from '../types/cadastre';
import { 
  Layers, 
  Maximize2, 
  Box, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Compass, 
  RotateCcw,
  Sliders,
  Sparkles
} from 'lucide-react';

interface Viewer3DProps {
  property: PropertyModel;
  onSelectFloor?: (floor: FloorRecord | null) => void;
  selectedFloorNumber?: number | null;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ 
  property, 
  onSelectFloor, 
  selectedFloorNumber: propSelectedFloor 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedFloor, setSelectedFloor] = useState<FloorRecord | null>(null);
  const [explosionFactor, setExplosionFactor] = useState<number>(0);
  const [showAirParcelVolume, setShowAirParcelVolume] = useState<boolean>(true);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'front' | 'basement'>('iso');
  const [hoveredFloorNumber, setHoveredFloorNumber] = useState<number | null>(null);

  // References to keep Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const boundingVolumeMeshRef = useRef<THREE.Mesh | null>(null);

  // Sync internal selected floor with prop
  useEffect(() => {
    if (propSelectedFloor !== undefined) {
      const match = property.floors.find(f => f.floor_number === propSelectedFloor) || null;
      setSelectedFloor(match);
    }
  }, [propSelectedFloor, property.floors]);

  // Main Three.js Scene Setup & Rebuilding on Property Change
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.008);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(45, 35, 45);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clean previous canvas if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Allow slight underground view
    controls.minDistance = 5;
    controls.maxDistance = 180;
    controls.target.set(0, (property.observed_above_ground_floors * 3.2) / 2, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(40, 60, 40);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5); // Subtle cyan fill
    dirLight2.position.set(-40, 20, -40);
    scene.add(dirLight2);

    const groundLight = new THREE.DirectionalLight(0x1e3a8a, 0.4); // Blue ground accent
    groundLight.position.set(0, -30, 0);
    scene.add(groundLight);

    // 6. Cadastral Ground Plane & Parcel Boundary
    const plotSide = Math.max(Math.sqrt(property.plot_area_sqm), Math.max(property.building_length_m, property.building_width_m) * 1.5);
    const gridHelper = new THREE.GridHelper(plotSide * 2, 40, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Ground cadastre boundary line
    const parcelGeo = new THREE.PlaneGeometry(plotSide, plotSide);
    const parcelMat = new THREE.MeshBasicMaterial({ 
      color: 0x0f172a, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const parcelMesh = new THREE.Mesh(parcelGeo, parcelMat);
    parcelMesh.rotation.x = -Math.PI / 2;
    parcelMesh.position.y = -0.06;
    scene.add(parcelMesh);

    // Cadastre parcel boundary outline
    const parcelBorderGeo = new THREE.EdgesGeometry(parcelGeo);
    const parcelBorderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const parcelBorderLines = new THREE.LineSegments(parcelBorderGeo, parcelBorderMat);
    parcelBorderLines.rotation.x = -Math.PI / 2;
    parcelBorderLines.position.y = -0.04;
    scene.add(parcelBorderLines);

    // 7. Procedural Floors
    const floorMeshes = new Map<number, THREE.Group>();
    const bLength = property.building_length_m || 20;
    const bWidth = property.building_width_m || 15;
    const floorHeight = 3.2;

    property.floors.forEach((floor) => {
      const floorGroup = new THREE.Group();
      floorGroup.userData = { floorRecord: floor, floorNumber: floor.floor_number };

      const isBasement = floor.floor_number < 0;
      const isUnauthorized = !floor.is_permitted;

      // Base Y position
      let baseY: number;
      if (isBasement) {
        baseY = floor.floor_number * floorHeight;
      } else {
        baseY = (floor.floor_number - 1) * floorHeight;
      }

      // Main Floor Volume Mesh
      const slabThickness = 0.35;
      const wallHeight = floorHeight - slabThickness;
      
      // Bottom Concrete Slab
      const slabGeo = new THREE.BoxGeometry(bLength, slabThickness, bWidth);
      const slabMat = new THREE.MeshStandardMaterial({
        color: isBasement ? 0x334155 : (isUnauthorized ? 0x7f1d1d : 0x1e293b),
        roughness: 0.7,
        metalness: 0.2
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.y = slabThickness / 2;
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      floorGroup.add(slabMesh);

      // Floor Usable Volume / Curtain Glass
      const innerLength = bLength * 0.96;
      const innerWidth = bWidth * 0.96;
      const glassGeo = new THREE.BoxGeometry(innerLength, wallHeight, innerWidth);

      // Color mapping by usage or compliance
      let volumeColor = 0x0284c7; // default cyan
      if (isUnauthorized) {
        volumeColor = 0xef4444; // unauthorized pulsing red
      } else if (isBasement) {
        volumeColor = 0x475569; // slate grey
      } else if (floor.usage_type.includes("Retail") || floor.usage_type.includes("Commercial")) {
        volumeColor = 0x0ea5e9; // bright blue
      } else if (floor.usage_type.includes("Residential")) {
        volumeColor = 0x10b981; // emerald green
      } else {
        volumeColor = 0x8b5cf6; // violet
      }

      const volumeMat = new THREE.MeshStandardMaterial({
        color: volumeColor,
        transparent: true,
        opacity: isUnauthorized ? 0.75 : (isBasement ? 0.45 : 0.55),
        roughness: 0.2,
        metalness: 0.4,
        wireframe: isWireframe
      });
      const volumeMesh = new THREE.Mesh(glassGeo, volumeMat);
      volumeMesh.position.y = slabThickness + wallHeight / 2;
      volumeMesh.castShadow = true;
      floorGroup.add(volumeMesh);

      // Architectural Wireframe Accent Lines
      const edgeGeo = new THREE.EdgesGeometry(glassGeo);
      const edgeMat = new THREE.LineBasicMaterial({ 
        color: isUnauthorized ? 0xf87171 : 0x7dd3fc, 
        linewidth: 1.5 
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.position.copy(volumeMesh.position);
      floorGroup.add(edgeLines);

      // Corner Pillars
      const pillarGeo = new THREE.BoxGeometry(0.6, wallHeight, 0.6);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const offsets = [
        [-bLength / 2 + 0.4, -bWidth / 2 + 0.4],
        [bLength / 2 - 0.4, -bWidth / 2 + 0.4],
        [-bLength / 2 + 0.4, bWidth / 2 - 0.4],
        [bLength / 2 - 0.4, bWidth / 2 - 0.4],
      ];
      offsets.forEach(([ox, oz]) => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(ox, slabThickness + wallHeight / 2, oz);
        floorGroup.add(pillar);
      });

      // Ceiling Slab
      const ceilMesh = new THREE.Mesh(slabGeo, slabMat);
      ceilMesh.position.y = floorHeight;
      floorGroup.add(ceilMesh);

      // Set base position and store in map
      floorGroup.position.set(0, baseY, 0);
      floorGroup.userData.originalY = baseY;
      scene.add(floorGroup);
      floorMeshes.set(floor.floor_number, floorGroup);
    });

    floorMeshesRef.current = floorMeshes;

    // 8. Permitted Cadastral Air-Rights Bounding Box (Sanctioned Spatial Envelope)
    const permittedHeight = property.permitted_above_ground_floors * floorHeight;
    const airParcelGeo = new THREE.BoxGeometry(bLength * 1.05, permittedHeight, bWidth * 1.05);
    const airParcelMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const airParcelMesh = new THREE.Mesh(airParcelGeo, airParcelMat);
    airParcelMesh.position.set(0, permittedHeight / 2, 0);
    airParcelMesh.visible = showAirParcelVolume;
    scene.add(airParcelMesh);
    boundingVolumeMeshRef.current = airParcelMesh;

    // 9. Raycasting for Floor Selection on Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Collect meshes from all floor groups
      const interactiveMeshes: THREE.Object3D[] = [];
      floorMeshes.forEach(group => {
        group.children.forEach(child => interactiveMeshes.push(child));
      });

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        while (parent && !parent.userData.floorRecord) {
          parent = parent.parent;
        }
        if (parent && parent.userData.floorRecord) {
          const clickedFloor: FloorRecord = parent.userData.floorRecord;
          setSelectedFloor(clickedFloor);
          if (onSelectFloor) {
            onSelectFloor(clickedFloor);
          }
        }
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const interactiveMeshes: THREE.Object3D[] = [];
      floorMeshes.forEach(group => {
        group.children.forEach(child => interactiveMeshes.push(child));
      });

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        while (parent && !parent.userData.floorRecord) {
          parent = parent.parent;
        }
        if (parent && parent.userData.floorNumber !== undefined) {
          setHoveredFloorNumber(parent.userData.floorNumber);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredFloorNumber(null);
      container.style.cursor = 'default';
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // 10. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 11. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      const time = clock.getElapsedTime();

      // Subtle pulse on unauthorized floor wireframes to highlight compliance violation
      floorMeshes.forEach(group => {
        const floor: FloorRecord = group.userData.floorRecord;
        if (floor && !floor.is_permitted) {
          const pulse = (Math.sin(time * 3) + 1) / 2; // 0 to 1
          group.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              if (child.material.color.getHex() === 0xef4444 || child.material.color.getHex() === 0xff2222) {
                child.material.opacity = 0.55 + pulse * 0.35;
              }
            }
          });
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [property, isWireframe]);

  // Handle Explosion Factor Updates
  useEffect(() => {
    floorMeshesRef.current.forEach((group, floorNumber) => {
      const origY = group.userData.originalY || 0;
      // Explode outwards vertically from ground level 0
      let offset = 0;
      if (floorNumber > 0) {
        offset = (floorNumber - 1) * explosionFactor * 4.5;
      } else if (floorNumber < 0) {
        offset = floorNumber * explosionFactor * 3.5;
      }
      group.position.y = origY + offset;
    });
  }, [explosionFactor]);

  // Handle Cadastral Volume Visibility Toggle
  useEffect(() => {
    if (boundingVolumeMeshRef.current) {
      boundingVolumeMeshRef.current.visible = showAirParcelVolume;
    }
  }, [showAirParcelVolume]);

  // Handle View Presets
  const setCameraView = (preset: 'iso' | 'top' | 'front' | 'basement') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const totalHeight = (property.observed_above_ground_floors * 3.2);
    const targetY = totalHeight / 2;

    setViewPreset(preset);

    if (preset === 'iso') {
      camera.position.set(40, 32, 40);
      controls.target.set(0, targetY, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 75, 0.01);
      controls.target.set(0, 0, 0);
    } else if (preset === 'front') {
      camera.position.set(0, targetY, 55);
      controls.target.set(0, targetY, 0);
    } else if (preset === 'basement') {
      camera.position.set(25, -15, 25);
      controls.target.set(0, -3.2, 0);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-full min-h-[580px] flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D Top Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-700/80 shadow-lg">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-sky-400" />
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Spatial Cadastre 3D View</h4>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{property.title}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {property.ulpin_3d}
              </span>
            </div>
          </div>
        </div>

        {property.compliance_status !== 'Compliant' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/70 border border-red-800/80 text-red-300 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>{property.excess_floors > 0 ? `${property.excess_floors} Unauthorized Floors` : property.compliance_status}</span>
          </div>
        )}
      </div>

      {/* Floating Camera & Control Presets */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 shadow-lg">
        <button
          onClick={() => setCameraView('iso')}
          title="Isometric View"
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            viewPreset === 'iso' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Isometric
        </button>
        <button
          onClick={() => setCameraView('top')}
          title="Cadastral Top-Down Footprint"
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            viewPreset === 'top' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          2D Footprint
        </button>
        <button
          onClick={() => setCameraView('front')}
          title="Elevation View"
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            viewPreset === 'front' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Elevation
        </button>
        {property.basement_floors > 0 && (
          <button
            onClick={() => setCameraView('basement')}
            title="Underground Basement Cutaway"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
              viewPreset === 'basement' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Sub-surface
          </button>
        )}
      </div>

      {/* Controls Overlay Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-700/80 shadow-lg">
        {/* Explosion Slider */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-medium text-slate-300">Explode Cadastre:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explosionFactor}
            onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <span className="text-xs font-mono text-sky-300 w-8">{Math.round(explosionFactor * 100)}%</span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Air Parcel Volume Toggle */}
        <button
          onClick={() => setShowAirParcelVolume(!showAirParcelVolume)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
            showAirParcelVolume ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Cadastral Air Parcel Boundary Box"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Air Rights Envelope</span>
        </button>

        {/* Wireframe Toggle */}
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
            isWireframe ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Wireframe Structural View"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>X-Ray Wireframe</span>
        </button>
      </div>

      {/* Legend & Interaction Guide (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Permitted
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Unauthorized
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Sub-Surface
        </span>
        <span className="text-slate-500">| Left Click: Inspect Floor | Drag: Rotate | Scroll: Zoom</span>
      </div>

      {/* The Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 h-full min-h-[500px]" />

      {/* Selected Floor Inspection Side Drawer */}
      {selectedFloor && (
        <div className="absolute top-20 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${selectedFloor.is_permitted ? 'bg-emerald-500' : 'bg-red-500 ring-4 ring-red-950'}`} />
              <h4 className="font-semibold text-white text-sm">
                {selectedFloor.floor_number < 0 
                  ? `Basement Level ${Math.abs(selectedFloor.floor_number)}`
                  : `Floor Level ${selectedFloor.floor_number}`}
              </h4>
            </div>
            <button
              onClick={() => { setSelectedFloor(null); if (onSelectFloor) onSelectFloor(null); }}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Designation</span>
              <span className="font-medium text-slate-200">{selectedFloor.floor_name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Usage Category</span>
                <span className="font-medium text-sky-300">{selectedFloor.usage_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Units / Tenancies</span>
                <span className="font-medium text-slate-200">{selectedFloor.unit_count} Individual Units</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Built-up Area</span>
                <span className="font-medium text-slate-200">{selectedFloor.built_area_sqm} sq.m</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Elevation Range</span>
                <span className="font-medium text-slate-200">
                  {selectedFloor.elevation_start_m}m to {selectedFloor.elevation_end_m}m
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Vertical Title Holder</span>
              <span className="font-medium text-slate-200">{selectedFloor.owner_name}</span>
            </div>

            {/* Compliance Badge */}
            <div className={`p-2.5 rounded-lg border ${
              selectedFloor.is_permitted 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                : 'bg-red-950/50 border-red-800 text-red-200'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                {selectedFloor.is_permitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Permitted Cadastral Volume</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Unauthorized Floor Deviation</span>
                  </>
                )}
              </div>
              {selectedFloor.violation_notes && (
                <p className="mt-1 text-[11px] leading-relaxed text-red-300/90">
                  {selectedFloor.violation_notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
