/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CITY_TEMPLATES } from './data/templates';
import { BUILDING_MAP, BUILDINGS_CATALOG } from './data/buildingsCatalog';
import { VEHICLES_CATALOG } from './data/vehiclesCatalog';
import {
  BuildingDefinition,
  PlacedBuilding,
  TimeOfDay,
  ToolMode,
  ViewPerspective,
  BuildingInterior,
  CutawayFloor,
  VehicleDefinition,
  MeasurementUnit,
  CameraPreset,
  RenderQuality,
} from './types/city';
import { useCitySimulation } from './hooks/useCitySimulation';
import { sound } from './utils/audio';

import { TopBar } from './components/TopBar';
import { PlannerSidebarLeft, StudioTool } from './components/PlannerSidebarLeft';
import { PlannerPropertiesRight } from './components/PlannerPropertiesRight';
import { PlannerMinimap } from './components/PlannerMinimap';
import { ViewportCameraControls } from './components/ViewportCameraControls';
import { ViewportGizmo } from './components/ViewportGizmo';
import { BottomStatusBar } from './components/BottomStatusBar';
import { CityCanvas, CityCanvasHandle } from './components/CityCanvas';

import { CatalogDrawer } from './components/CatalogDrawer';
import { InteriorStudioModal } from './components/InteriorStudioModal';
import { PolicyModal } from './components/PolicyModal';
import { MilestonesModal } from './components/MilestonesModal';
import { TemplatesModal } from './components/TemplatesModal';
import { PhotoModal } from './components/PhotoModal';
import { VehiclesModal } from './components/VehiclesModal';
import { CustomBuildingModal } from './components/CustomBuildingModal';

export default function App() {
  const initialTemplate = CITY_TEMPLATES[0]; // Downtown Block A

  // City simulation state
  const {
    buildings,
    metrics,
    gameSpeed,
    setGameSpeed,
    isFreeMode,
    toggleFreeMode,
    clearToScratch,
    taxRates,
    setTaxRates,
    serviceFunding,
    setServiceFunding,
    milestones,
    claimMilestone,
    newsLog,
    addBuilding,
    removeBuilding,
    upgradeBuilding,
    customizeBuilding,
    saveBuildingInterior,
    deductFunds,
    refundFunds,
    loadCity,
    undo,
    redo,
    canUndo,
    canRedo,
    duplicateBuilding,
    addCustomBuilding,
    paveRoadSegment,
  } = useCitySimulation(initialTemplate.buildings, initialTemplate.startingFunds);

  // Studio Tools state (matching user screenshot)
  const [currentStudioTool, setCurrentStudioTool] = useState<StudioTool>('place_building');
  const [selectedDef, setSelectedDef] = useState<BuildingDefinition | null>(
    BUILDING_MAP.get('res_condo') || BUILDINGS_CATALOG[0]
  );
  const [toolMode, setToolMode] = useState<ToolMode>('plan');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);

  // Viewport, Camera, & Diagnostics
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [cameraAngles, setCameraAngles] = useState({ angleH: 0.62, angleV: 0.54 });
  const [viewMode, setViewMode] = useState<ViewPerspective>('3d');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [cutawayFloor, setCutawayFloor] = useState<CutawayFloor>('all');
  const [unit, setUnit] = useState<MeasurementUnit>('metric');
  const [hoveredCoord, setHoveredCoord] = useState<{ x: number; z: number } | null>(null);

  // Selected building (defaults to Building_006 as in screenshot)
  const [inspectedBuilding, setInspectedBuilding] = useState<PlacedBuilding | null>(
    initialTemplate.buildings[0] || null
  );
  const [furnishingBuilding, setFurnishingBuilding] = useState<PlacedBuilding | null>(null);

  // City tools toggles
  const [isTrafficActive, setIsTrafficActive] = useState<boolean>(true);
  const [isZoningActive, setIsZoningActive] = useState<boolean>(false);

  // Vehicles placement
  const [isVehiclesOpen, setIsVehiclesOpen] = useState(false);
  const [vehicleToPlace, setVehicleToPlace] = useState<{ def: VehicleDefinition; color: string } | null>(null);

  // Dialogs & Drawers
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCustomBuildingOpen, setIsCustomBuildingOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<CityCanvasHandle>(null);

  // Unsaved changes tracker
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(true);

  // Handle studio tool selection
  const handleSelectStudioTool = useCallback((tool: StudioTool) => {
    setCurrentStudioTool(tool);
    if (tool === 'select') {
      setToolMode('inspect');
    } else if (tool === 'place_building') {
      setToolMode('plan');
      const bDef = BUILDING_MAP.get('res_condo') || BUILDINGS_CATALOG[0];
      setSelectedDef(bDef);
    } else if (tool === 'road') {
      setToolMode('plan');
      const road = BUILDING_MAP.get('road_paved');
      if (road) setSelectedDef(road);
    } else if (tool === 'zone') {
      setToolMode('plan');
      const apt = BUILDING_MAP.get('res_apartment');
      if (apt) setSelectedDef(apt);
    } else if (tool === 'terrain') {
      setToolMode('plan');
      const plaza = BUILDING_MAP.get('nat_plaza');
      if (plaza) setSelectedDef(plaza);
    } else if (tool === 'greenery') {
      setToolMode('plan');
      const park = BUILDING_MAP.get('nat_park_fountain');
      if (park) setSelectedDef(park);
    } else if (tool === 'water') {
      setToolMode('plan');
      const canal = BUILDING_MAP.get('nat_canal');
      if (canal) setSelectedDef(canal);
    } else if (tool === 'utilities') {
      setToolMode('plan');
      const infra = BUILDING_MAP.get('infra_substation');
      if (infra) setSelectedDef(infra);
    } else if (tool === 'demolish') {
      setToolMode('demolish');
    }
  }, []);

  // Live building move callback (from 3D TransformControls gizmo or numeric panel)
  const handleBuildingMove = useCallback(
    (instanceId: string, x: number, z: number, y?: number) => {
      customizeBuilding(instanceId, { x, z, y });
      setInspectedBuilding((prev) =>
        prev && prev.instanceId === instanceId ? { ...prev, x, z, y } : prev
      );
      setHasUnsavedChanges(true);
    },
    [customizeBuilding]
  );

  // Camera angle update from Three.js scene
  const handleCameraAngleChange = useCallback((angleH: number, angleV: number) => {
    setCameraAngles({ angleH, angleV });
  }, []);

  // Camera preset selector
  const handleSelectCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    if (preset === 'top') {
      setViewMode('2d_blueprint');
    } else {
      setViewMode('3d');
    }
    canvasRef.current?.setCameraPreset(preset);
  }, []);

  // Minimap jump-to-coord
  const handleJumpToCoord = useCallback((coord: { x: number; z: number }) => {
    canvasRef.current?.focusOnObject(coord);
    sound.playClick();
  }, []);

  // Tile click on ground
  const handleTileClick = useCallback(
    (coord: { x: number; z: number }) => {
      if (toolMode === 'vehicle' && vehicleToPlace) {
        canvasRef.current?.spawnVehicle(vehicleToPlace.def.id, coord);
        sound.playPlace();
        return;
      }

      if (toolMode === 'demolish') {
        const target = buildings.find((b) => {
          const def = BUILDING_MAP.get(b.defId);
          if (!def) return false;
          const w = b.customWidth || def.size[0];
          const d = b.customDepth || def.size[1];
          return coord.x >= b.x && coord.x < b.x + w && coord.z >= b.z && coord.z < b.z + d;
        });
        if (target) {
          removeBuilding(target.instanceId);
          setHasUnsavedChanges(true);
        }
        return;
      }

      if (toolMode === 'inspect') {
        setInspectedBuilding(null);
        return;
      }

      // Placement tool (place_building, road, greenery, water, etc.)
      if (selectedDef) {
        const isOccupied = buildings.some((b) => {
          const def = BUILDING_MAP.get(b.defId);
          if (!def) return false;
          const w = b.customWidth || def.size[0];
          const d = b.customDepth || def.size[1];
          return coord.x >= b.x && coord.x < b.x + w && coord.z >= b.z && coord.z < b.z + d;
        });

        if (!isOccupied) {
          addBuilding(selectedDef.id, coord.x, coord.z, rotation);
          setHasUnsavedChanges(true);
        }
      }
    },
    [toolMode, selectedDef, vehicleToPlace, buildings, rotation, addBuilding, removeBuilding, currentStudioTool]
  );

  // Building clicked on canvas
  const handleBuildingClick = useCallback(
    (b: PlacedBuilding) => {
      if (toolMode === 'demolish') {
        removeBuilding(b.instanceId);
        setHasUnsavedChanges(true);
      } else {
        setInspectedBuilding(b);
        sound.playClick();
      }
    },
    [toolMode, removeBuilding]
  );

  // Duplicate building handler
  const handleDuplicateBuilding = useCallback(
    (instanceId: string) => {
      const clone = duplicateBuilding(instanceId);
      if (clone) {
        setInspectedBuilding(clone);
        setHasUnsavedChanges(true);
      }
    },
    [duplicateBuilding]
  );

  // Real-Time Interior Studio Mode
  const handleOpenInterior = useCallback((b: PlacedBuilding) => {
    setFurnishingBuilding(b);
    sound.playClick();
  }, []);

  const handleSaveInterior = useCallback(
    (buildingId: string, interior: BuildingInterior) => {
      saveBuildingInterior(buildingId, interior);
      setFurnishingBuilding(null);
      setHasUnsavedChanges(true);
    },
    [saveBuildingInterior]
  );

  // First-Person Walk
  const handleToggleFirstPerson = useCallback(() => {
    setViewMode((prev) => (prev === 'first_person' ? '3d' : 'first_person'));
    sound.playClick();
  }, []);

  // Save Project to localStorage
  const handleSaveProject = useCallback(() => {
    try {
      const projectData = {
        version: '2024.5.1',
        name: 'Downtown Block A',
        savedAt: Date.now(),
        buildings,
        funds: metrics.funds,
      };
      localStorage.setItem('urbancraft_saved_project', JSON.stringify(projectData));
      setHasUnsavedChanges(false);
      sound.playPlace();
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  }, [buildings, metrics.funds]);

  // Export Project JSON
  const handleExportProject = useCallback(() => {
    const projectData = {
      version: '2024.5.1',
      name: 'Downtown Block A',
      savedAt: Date.now(),
      buildings,
      funds: metrics.funds,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbancraft-5d-downtown-block-a-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sound.playClick();
  }, [buildings, metrics.funds]);

  // Capture Snapshot Photo
  const handleOpenPhoto = useCallback(() => {
    if (canvasRef.current) {
      const url = canvasRef.current.captureSnapshot();
      setSnapshotUrl(url);
      setIsPhotoOpen(true);
      sound.playClick();
    }
  }, []);

  // Traffic fleet toggle
  const handleToggleTraffic = useCallback(() => {
    const next = !isTrafficActive;
    setIsTrafficActive(next);
    if (next) {
      const roadBuildings = buildings.filter(
        (b) => b.defId.includes('road') || b.defId.includes('bridge')
      );
      if (roadBuildings.length > 0) {
        for (let i = 0; i < Math.min(8, roadBuildings.length); i++) {
          const b = roadBuildings[i];
          const veh = VEHICLES_CATALOG[i % VEHICLES_CATALOG.length];
          canvasRef.current?.spawnVehicle(veh.id, { x: b.x, z: b.z });
        }
      }
    }
    sound.playClick();
  }, [isTrafficActive, buildings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFirstPerson();
      } else if (e.key === 'd' || e.key === 'D') {
        if (inspectedBuilding) {
          handleDuplicateBuilding(inspectedBuilding.instanceId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (inspectedBuilding) {
          removeBuilding(inspectedBuilding.instanceId);
          setInspectedBuilding(null);
        }
      } else if (e.key === 'Escape') {
        if (viewMode === 'first_person') {
          setViewMode('3d');
        }
        setIsCatalogOpen(false);
        setIsCustomBuildingOpen(false);
        setIsPoliciesOpen(false);
        setIsMilestonesOpen(false);
        setIsTemplatesOpen(false);
        setIsPhotoOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    handleSaveProject,
    handleToggleFirstPerson,
    handleDuplicateBuilding,
    removeBuilding,
    inspectedBuilding,
    viewMode,
  ]);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#070b14] overflow-hidden font-sans select-none text-slate-100">
      {/* 1. Top Bar */}
      <TopBar
        projectName="Downtown Block A"
        hasUnsavedChanges={hasUnsavedChanges}
        onNew={clearToScratch}
        onSave={handleSaveProject}
        onExport={handleExportProject}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenPhoto={handleOpenPhoto}
        onOpenSettings={() => setIsPoliciesOpen(true)}
      />

      {/* 2. Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 min-h-0 bg-[#070b14]">
        {/* Left Sidebar Toolbar */}
        <PlannerSidebarLeft
          currentTool={currentStudioTool}
          onSelectTool={handleSelectStudioTool}
          onOpenTraffic={handleToggleTraffic}
          onOpenPedestrian={handleToggleFirstPerson}
          onToggleZoning={() => setIsZoningActive((z) => !z)}
          onOpenAnalytics={() => setIsMilestonesOpen(true)}
          isTrafficActive={isTrafficActive}
          isZoningActive={isZoningActive}
          onOpenCatalog={() => setIsCatalogOpen(true)}
        />

        {/* Center 3D Viewport Framed Container */}
        <div className="flex-1 relative rounded-xl border border-slate-800/90 overflow-hidden bg-slate-950 shadow-inner flex flex-col">
          {/* Interactive 3D Canvas */}
          <CityCanvas
            ref={canvasRef}
            buildings={buildings}
            toolMode={toolMode}
            selectedDefId={selectedDef?.id || null}
            rotation={rotation}
            viewMode={viewMode}
            timeOfDay={timeOfDay}
            cutawayFloor={cutawayFloor}
            selectedBuilding={inspectedBuilding}
            onTileClick={handleTileClick}
            onTileHover={setHoveredCoord}
            onBuildingClick={handleBuildingClick}
            onBuildingMove={handleBuildingMove}
            onCameraAngleChange={handleCameraAngleChange}
            onExitFirstPerson={() => setViewMode('3d')}
          />

          {/* Top-Left Viewport Camera Controls [Perspective, Top, Front, Orbit] */}
          <ViewportCameraControls
            currentPreset={cameraPreset}
            onSelectPreset={handleSelectCameraPreset}
          />

          {/* Bottom-Left 3D XYZ Orientation Gizmo */}
          <ViewportGizmo
            angleH={cameraAngles.angleH}
            angleV={cameraAngles.angleV}
          />

          {/* Bottom-Right Radar Minimap */}
          <PlannerMinimap
            buildings={buildings}
            onJumpToCoord={handleJumpToCoord}
            selectedBuilding={inspectedBuilding}
          />
        </div>

        {/* Right Properties Panel */}
        <PlannerPropertiesRight
          building={inspectedBuilding}
          allBuildings={buildings}
          onCustomize={customizeBuilding}
          onDemolish={removeBuilding}
          onDuplicate={handleDuplicateBuilding}
          onOpenInterior={handleOpenInterior}
          unit={unit}
        />
      </div>

      {/* 3. Bottom Status Bar */}
      <BottomStatusBar
        statusMessage="Ready"
        snapSetting="Grid 1m"
        layerSetting="Buildings"
        cameraAngleDeg={(cameraAngles.angleV * 180) / Math.PI}
        selectedBuilding={inspectedBuilding}
        cursorCoord={hoveredCoord}
        scaleRatio="1:200"
        version="2024.5.1"
      />

      {/* 4. Modals & Dialogs */}
      <CatalogDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        selectedDefId={selectedDef?.id || null}
        onSelectBuilding={(def) => {
          setSelectedDef(def);
          setCurrentStudioTool('place_building');
          setToolMode('plan');
          setIsCatalogOpen(false);
          sound.playClick();
        }}
        currentFunds={metrics.funds}
        isFreeMode={isFreeMode}
      />

      <CustomBuildingModal
        isOpen={isCustomBuildingOpen}
        onClose={() => setIsCustomBuildingOpen(false)}
        onCreateCustomBuilding={(params) => {
          addCustomBuilding({
            ...params,
            x: 10,
            z: 11,
          });
        }}
        unit={unit}
      />

      <VehiclesModal
        isOpen={isVehiclesOpen}
        onClose={() => setIsVehiclesOpen(false)}
        onSelectVehicleToPlace={(veh, color) => {
          setVehicleToPlace({ def: veh, color });
          setToolMode('vehicle');
          setIsVehiclesOpen(false);
        }}
        onSpawnTrafficFleet={handleToggleTraffic}
        isFreeMode={isFreeMode}
      />

      <InteriorStudioModal
        isOpen={!!furnishingBuilding}
        onClose={() => setFurnishingBuilding(null)}
        building={furnishingBuilding}
        onSaveInterior={handleSaveInterior}
        currentFunds={metrics.funds}
        isFreeMode={isFreeMode}
        onDeductFunds={deductFunds}
        onRefundFunds={refundFunds}
        onOpenPhoto={(url) => {
          setSnapshotUrl(url);
          setIsPhotoOpen(true);
        }}
      />

      <PolicyModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        taxRates={taxRates}
        onUpdateTaxRates={setTaxRates}
        serviceFunding={serviceFunding}
        onUpdateServiceFunding={setServiceFunding}
        metrics={metrics}
      />

      <MilestonesModal
        isOpen={isMilestonesOpen}
        onClose={() => setIsMilestonesOpen(false)}
        milestones={milestones}
        onClaim={claimMilestone}
        metrics={metrics}
        buildingCount={buildings.length}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={(newBuildings, startingFunds) => {
          loadCity(newBuildings, startingFunds);
          if (newBuildings.length > 0) {
            setInspectedBuilding(newBuildings[0]);
          }
        }}
        currentBuildings={buildings}
        currentFunds={metrics.funds}
      />

      <PhotoModal
        isOpen={isPhotoOpen}
        onClose={() => setIsPhotoOpen(false)}
        imageUrl={snapshotUrl}
      />
    </div>
  );
}
