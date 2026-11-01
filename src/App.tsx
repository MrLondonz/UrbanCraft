/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CITY_TEMPLATES } from './data/templates';
import { BUILDING_MAP } from './data/buildingsCatalog';
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
  SnappingMode,
} from './types/city';
import { useCitySimulation } from './hooks/useCitySimulation';
import { sound } from './utils/audio';

import { TopBar } from './components/TopBar';
import { HudBar } from './components/HudBar';
import { Toolbar } from './components/Toolbar';
import { CatalogDrawer } from './components/CatalogDrawer';
import { PlannerSidebarLeft } from './components/PlannerSidebarLeft';
import { PlannerPropertiesRight } from './components/PlannerPropertiesRight';
import { PlannerMinimap } from './components/PlannerMinimap';
import { InteriorStudioModal } from './components/InteriorStudioModal';
import { PolicyModal } from './components/PolicyModal';
import { MilestonesModal } from './components/MilestonesModal';
import { TemplatesModal } from './components/TemplatesModal';
import { PhotoModal } from './components/PhotoModal';
import { NewsTicker } from './components/NewsTicker';
import { VehiclesModal } from './components/VehiclesModal';
import { CustomBuildingModal } from './components/CustomBuildingModal';
import { BottomStatusBar } from './components/BottomStatusBar';
import { CityCanvas, CityCanvasHandle } from './components/CityCanvas';

export default function App() {
  const initialTemplate = CITY_TEMPLATES[0]; // Metropolis Bay

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

  // Interaction & UI State
  const [toolMode, setToolMode] = useState<ToolMode>('plan');
  const [selectedDef, setSelectedDef] = useState<BuildingDefinition | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [viewMode, setViewMode] = useState<ViewPerspective>('3d');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [cutawayFloor, setCutawayFloor] = useState<CutawayFloor>('all');
  const [inspectedBuilding, setInspectedBuilding] = useState<PlacedBuilding | null>(null);
  const [furnishingBuilding, setFurnishingBuilding] = useState<PlacedBuilding | null>(null);
  const [unit, setUnit] = useState<MeasurementUnit>('metric');
  const [hoveredCoord, setHoveredCoord] = useState<{ x: number; z: number } | null>(null);

  // Live Hovered Building identification for Status Bar
  const hoveredBuilding = useMemo(() => {
    if (!hoveredCoord) return null;
    return (
      buildings.find((b) => {
        const def = BUILDING_MAP.get(b.defId);
        if (!def) return false;
        const w = b.customWidth || def.size[0];
        const d = b.customDepth || def.size[1];
        return (
          hoveredCoord.x >= b.x &&
          hoveredCoord.x < b.x + w &&
          hoveredCoord.z >= b.z &&
          hoveredCoord.z < b.z + d
        );
      }) || null
    );
  }, [hoveredCoord, buildings]);

  // Vehicles state
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

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState(false);

  // Canvas ref for snapshot export
  const canvasRef = useRef<CityCanvasHandle>(null);

  // Unclaimed milestones count
  const unclaimedMilestonesCount = milestones.filter((m) => m.completed && !m.claimed).length;

  // Toggle Measurement Unit
  const handleToggleUnit = useCallback(() => {
    setUnit((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
    sound.playClick();
  }, []);

  // Rotate blueprint
  const handleRotate = useCallback(() => {
    setRotation((r) => ((r + 90) % 360) as 0 | 90 | 180 | 270);
    sound.playRotate();
  }, []);

  // Handle building selection from catalog
  const handleSelectBuildingFromCatalog = useCallback((def: BuildingDefinition) => {
    setSelectedDef(def);
    setToolMode('plan');
    setIsCatalogOpen(false);
    setInspectedBuilding(null);
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

      if (toolMode === 'plan' && selectedDef) {
        // Check if tile is occupied
        const isOccupied = buildings.some((b) => {
          const def = BUILDING_MAP.get(b.defId);
          if (!def) return false;
          const w = b.customWidth || def.size[0];
          const d = b.customDepth || def.size[1];
          return coord.x >= b.x && coord.x < b.x + w && coord.z >= b.z && coord.z < b.z + d;
        });

        if (!isOccupied) {
          addBuilding(selectedDef.id, coord.x, coord.z, rotation);
        }
      } else if (toolMode === 'demolish') {
        const target = buildings.find((b) => {
          const def = BUILDING_MAP.get(b.defId);
          if (!def) return false;
          const w = b.customWidth || def.size[0];
          const d = b.customDepth || def.size[1];
          return coord.x >= b.x && coord.x < b.x + w && coord.z >= b.z && coord.z < b.z + d;
        });
        if (target) {
          removeBuilding(target.instanceId);
        }
      } else if (toolMode === 'inspect') {
        setInspectedBuilding(null);
      }
    },
    [toolMode, selectedDef, vehicleToPlace, buildings, rotation, addBuilding, removeBuilding]
  );

  // Quick road constructor shortcut
  const handleQuickRoad = useCallback(() => {
    const road = BUILDING_MAP.get('road_paved');
    if (road) {
      setSelectedDef(road);
      setToolMode('plan');
      setVehicleToPlace(null);
      sound.playClick();
    }
  }, []);

  // Handle vehicle placement selection
  const handleSelectVehicleToPlace = useCallback((vehDef: VehicleDefinition, color: string) => {
    setVehicleToPlace({ def: vehDef, color });
    setToolMode('vehicle');
    setSelectedDef(null);
    setInspectedBuilding(null);
  }, []);

  // Spawn random traffic fleet across roads
  const handleSpawnTrafficFleet = useCallback(() => {
    const roadBuildings = buildings.filter(
      (b) => b.defId.includes('road') || b.defId.includes('bridge') || b.defId.includes('parking')
    );
    if (roadBuildings.length === 0) return;
    const count = Math.min(roadBuildings.length, 12);
    for (let i = 0; i < count; i++) {
      const b = roadBuildings[i % roadBuildings.length];
      const randomVeh = VEHICLES_CATALOG[Math.floor(Math.random() * VEHICLES_CATALOG.length)];
      canvasRef.current?.spawnVehicle(randomVeh.id, { x: b.x, z: b.z });
    }
  }, [buildings]);

  // Building clicked on canvas
  const handleBuildingClick = useCallback(
    (b: PlacedBuilding) => {
      if (toolMode === 'demolish') {
        removeBuilding(b.instanceId);
      } else {
        setInspectedBuilding(b);
        setSelectedDef(null);
        sound.playClick();
      }
    },
    [toolMode, removeBuilding]
  );

  // Duplicate building handler (Core Requirement 9)
  const handleDuplicateBuilding = useCallback((instanceId: string) => {
    const clone = duplicateBuilding(instanceId);
    if (clone) {
      setInspectedBuilding(clone);
    }
  }, [duplicateBuilding]);

  // Real-Time Interior Studio Mode
  const handleOpenInterior = useCallback((b: PlacedBuilding) => {
    setFurnishingBuilding(b);
    setInspectedBuilding(null);
    sound.playClick();
  }, []);

  const handleSaveInterior = useCallback(
    (buildingId: string, interior: BuildingInterior) => {
      saveBuildingInterior(buildingId, interior);
      setFurnishingBuilding(null);
    },
    [saveBuildingInterior]
  );

  const handleDeductFunds = useCallback((amount: number) => {
    deductFunds(amount);
  }, [deductFunds]);

  const handleRefundFunds = useCallback((amount: number) => {
    refundFunds(amount);
  }, [refundFunds]);

  // Toggle 2D Blueprint / 3D Isometric View
  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === '3d' ? '2d_blueprint' : '3d'));
    sound.playClick();
  }, []);

  // Toggle First-Person Exploration View (Core Requirement 1)
  const handleToggleFirstPerson = useCallback(() => {
    setViewMode((prev) => (prev === 'first_person' ? '3d' : 'first_person'));
    sound.playClick();
  }, []);

  // Capture snapshot photo
  const handleOpenPhoto = useCallback(() => {
    if (canvasRef.current) {
      const url = canvasRef.current.captureSnapshot();
      setSnapshotUrl(url);
      setIsPhotoOpen(true);
      sound.playClick();
    }
  }, []);

  // Audio toggles
  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  }, [isMuted]);

  const handleToggleAmbience = useCallback(() => {
    const active = sound.toggleAmbience();
    setIsAmbiencePlaying(active);
  }, []);

  // Keyboard shortcuts (Undo, Redo, Walk, Duplicate, Rotate, Speed)
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
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFirstPerson();
      } else if (e.key === 'd' || e.key === 'D') {
        if (inspectedBuilding) {
          handleDuplicateBuilding(inspectedBuilding.instanceId);
        }
      } else if (e.key === 'Escape') {
        if (viewMode === 'first_person') {
          setViewMode('3d');
        }
        setSelectedDef(null);
        setInspectedBuilding(null);
        setIsCatalogOpen(false);
        setIsCustomBuildingOpen(false);
        setIsPoliciesOpen(false);
        setIsMilestonesOpen(false);
        setIsTemplatesOpen(false);
        setIsPhotoOpen(false);
      } else if (e.key === 'b' || e.key === 'B') {
        handleToggleViewMode();
      } else if (e.key === ' ') {
        e.preventDefault();
        setGameSpeed((s) => (s === 0 ? 1 : 0));
      } else if (e.key === '1') {
        setGameSpeed(1);
      } else if (e.key === '2') {
        setGameSpeed(2);
      } else if (e.key === '3') {
        setGameSpeed(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleRotate,
    handleToggleViewMode,
    handleToggleFirstPerson,
    handleDuplicateBuilding,
    inspectedBuilding,
    viewMode,
    undo,
    redo,
    setGameSpeed,
  ]);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 overflow-hidden font-sans select-none">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onToggleFirstPerson={handleToggleFirstPerson}
        onOpenPolicies={() => {
          setIsPoliciesOpen(true);
          sound.playClick();
        }}
        onOpenMilestones={() => {
          setIsMilestonesOpen(true);
          sound.playClick();
        }}
        onOpenTemplates={() => {
          setIsTemplatesOpen(true);
          sound.playClick();
        }}
        onOpenPhoto={handleOpenPhoto}
        unclaimedMilestonesCount={unclaimedMilestonesCount}
        isFreeMode={isFreeMode}
        onToggleFreeMode={toggleFreeMode}
        onClearToScratch={clearToScratch}
        unit={unit}
        onToggleUnit={handleToggleUnit}
      />

      {/* 2. City HUD & Speed Bar */}
      <HudBar
        metrics={metrics}
        timeOfDay={timeOfDay}
        onSetTimeOfDay={(t) => {
          setTimeOfDay(t);
          sound.playClick();
        }}
        gameSpeed={gameSpeed}
        onSetGameSpeed={(s) => {
          setGameSpeed(s);
          sound.playClick();
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isAmbiencePlaying={isAmbiencePlaying}
        onToggleAmbience={handleToggleAmbience}
        isFreeMode={isFreeMode}
      />

      {/* 3. Live News Ticker */}
      <NewsTicker newsLog={newsLog} />

      {/* 4. Three.js 3D & 2D Blueprint Interactive Canvas */}
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
        onExitFirstPerson={() => setViewMode('3d')}
      />

      {/* 5. Floating Architectural Toolbar */}
      <Toolbar
        toolMode={toolMode}
        onSetToolMode={(mode) => {
          setToolMode(mode);
          if (mode !== 'vehicle') setVehicleToPlace(null);
          sound.playClick();
        }}
        selectedDef={selectedDef}
        onClearSelectedDef={() => {
          setSelectedDef(null);
          setVehicleToPlace(null);
        }}
        onOpenCatalog={() => {
          setIsCatalogOpen((v) => !v);
          sound.playClick();
        }}
        onOpenCustomBuilder={() => {
          setIsCustomBuildingOpen(true);
          sound.playClick();
        }}
        onQuickRoad={handleQuickRoad}
        onOpenVehicles={() => {
          setIsVehiclesOpen(true);
          sound.playClick();
        }}
        rotation={rotation}
        onRotate={handleRotate}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onToggleFirstPerson={handleToggleFirstPerson}
        hasSelectedBuilding={!!inspectedBuilding}
        onOpenInterior={() => inspectedBuilding && handleOpenInterior(inspectedBuilding)}
        cutawayFloor={cutawayFloor}
        onSetCutawayFloor={setCutawayFloor}
        isFreeMode={isFreeMode}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* 5.5 Professional Architectural Bottom Status Bar (Core Requirement 2 & 8) */}
      <BottomStatusBar
        hoveredCoord={hoveredCoord}
        selectedBuilding={inspectedBuilding}
        hoveredBuilding={hoveredBuilding}
        selectedDef={selectedDef}
        toolMode={toolMode}
        viewMode={viewMode}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        totalBuildingsCount={buildings.length}
        gameSpeed={gameSpeed}
      />

      {/* 6. Building & Infrastructure Catalog Drawer */}
      <CatalogDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        selectedDefId={selectedDef?.id || null}
        onSelectBuilding={handleSelectBuildingFromCatalog}
        currentFunds={metrics.funds}
        isFreeMode={isFreeMode}
      />

      {/* 6.2 Custom Building Scratch Studio Modal (Core Requirement 2) */}
      <CustomBuildingModal
        isOpen={isCustomBuildingOpen}
        onClose={() => setIsCustomBuildingOpen(false)}
        onCreateCustomBuilding={(params) => {
          // Place near city center or at (8, 8)
          addCustomBuilding({
            ...params,
            x: 8,
            z: 8,
          });
        }}
        unit={unit}
      />

      {/* 6.5 Real-Time Vehicles Showroom & Fleet Modal */}
      <VehiclesModal
        isOpen={isVehiclesOpen}
        onClose={() => setIsVehiclesOpen(false)}
        onSelectVehicleToPlace={handleSelectVehicleToPlace}
        onSpawnTrafficFleet={handleSpawnTrafficFleet}
        isFreeMode={isFreeMode}
      />

      {/* 7. Building Inspector & Level/Color/Dimensions Customizer */}
      <InspectorModal
        building={inspectedBuilding}
        allBuildings={buildings}
        onClose={() => setInspectedBuilding(null)}
        onUpgrade={upgradeBuilding}
        onCustomize={customizeBuilding}
        onDemolish={removeBuilding}
        onDuplicate={handleDuplicateBuilding}
        onOpenInterior={handleOpenInterior}
        currentFunds={metrics.funds}
        unit={unit}
      />

      {/* 7.5 Real-Time Floor-Plan & Interior Studio */}
      <InteriorStudioModal
        isOpen={!!furnishingBuilding}
        onClose={() => setFurnishingBuilding(null)}
        building={furnishingBuilding}
        onSaveInterior={handleSaveInterior}
        currentFunds={metrics.funds}
        isFreeMode={isFreeMode}
        onDeductFunds={handleDeductFunds}
        onRefundFunds={handleRefundFunds}
        onOpenPhoto={(url) => {
          setSnapshotUrl(url);
          setIsPhotoOpen(true);
        }}
      />

      {/* 8. City Budget & Taxation Modal */}
      <PolicyModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        taxRates={taxRates}
        onUpdateTaxRates={setTaxRates}
        serviceFunding={serviceFunding}
        onUpdateServiceFunding={setServiceFunding}
        metrics={metrics}
      />

      {/* 9. City Milestones & Quests Modal */}
      <MilestonesModal
        isOpen={isMilestonesOpen}
        onClose={() => setIsMilestonesOpen(false)}
        milestones={milestones}
        onClaim={claimMilestone}
        metrics={metrics}
        buildingCount={buildings.length}
      />

      {/* 10. Projects, Save/Load & Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={loadCity}
        currentBuildings={buildings}
        currentFunds={metrics.funds}
      />

      {/* 11. High-Res Snapshot Photo Modal */}
      <PhotoModal
        isOpen={isPhotoOpen}
        onClose={() => setIsPhotoOpen(false)}
        imageUrl={snapshotUrl}
      />
    </div>
  );
}
