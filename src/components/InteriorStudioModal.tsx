import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Layers,
  Sun,
  Sunset,
  Moon,
  RotateCw,
  Trash2,
  Check,
  Smile,
  DollarSign,
  Users,
  Search,
  Sparkles,
  Palette,
  LayoutGrid,
  Columns,
  DoorOpen,
  Maximize2,
  Tag,
  MousePointer,
} from 'lucide-react';
import {
  PlacedBuilding,
  BuildingInterior,
  PlacedFurniture,
  ViewPerspective,
  TimeOfDay,
  FloorPlanWall,
  FloorPlanDoor,
  FloorPlanWindow,
  FloorPlanRoom,
} from '../types/city';
import { FURNITURE_CATALOG, FURNITURE_MAP, getDefaultInteriorForBuilding } from '../data/furnitureCatalog';
import { Interior3DScene } from '../engine/interior3dScene';
import { sound } from '../utils/audio';

interface InteriorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: PlacedBuilding | null;
  onSaveInterior: (buildingId: string, interior: BuildingInterior) => void;
  currentFunds: number;
  isFreeMode?: boolean;
  onDeductFunds: (amount: number) => void;
  onRefundFunds: (amount: number) => void;
  onOpenPhoto: (dataUrl: string) => void;
}

type FloorPlanTool = 'furniture' | 'wall' | 'door' | 'window' | 'room';

export const InteriorStudioModal: React.FC<InteriorStudioModalProps> = ({
  isOpen,
  onClose,
  building,
  onSaveInterior,
  currentFunds,
  isFreeMode = false,
  onDeductFunds,
  onRefundFunds,
  onOpenPhoto,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Interior3DScene | null>(null);

  // Interior state
  const [interior, setInterior] = useState<BuildingInterior>(() => {
    return building?.interior || getDefaultInteriorForBuilding(building?.defId || 'res_cottage', building?.level || 1);
  });

  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedFurniture, setSelectedFurniture] = useState<PlacedFurniture | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'living' | 'bedroom' | 'kitchen' | 'office' | 'cafe' | 'lifts' | 'decor'>('living');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewPerspective>('3d');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  // Floor-Plan Editor Tools State (Core Requirement 3)
  const [planTool, setPlanTool] = useState<FloorPlanTool>('furniture');
  const [wallStart, setWallStart] = useState<{ x: number; z: number } | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('Living Space');

  // When building changes, sync interior
  useEffect(() => {
    if (building) {
      const initialInt = building.interior || getDefaultInteriorForBuilding(building.defId, building.level);
      setInterior(initialInt);
    }
  }, [building]);

  // Initialize Interior3DScene
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const scene = new Interior3DScene(container, interior, {
      onFurnitureSelect: (f) => {
        setSelectedFurniture(f);
        sound.playClick();
      },
      onFurnitureMove: (instanceId, x, z) => {
        setInterior((prev) => ({
          ...prev,
          furniture: prev.furniture.map((item) =>
            item.instanceId === instanceId ? { ...item, x, z } : item
          ),
        }));
      },
      onFloorClick: (x, z) => {
        handleFloorClick3D(x, z);
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [isOpen]);

  // Sync furniture updates to 3D scene (filtered by active floor)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncFurniture(interior.furniture, currentFloor);
      sceneRef.current.syncInteriorData(interior);
    }
  }, [interior.furniture, interior.walls, interior.doors, interior.windows, currentFloor]);

  // Handle 3D / 2D click for floorplan tools
  const handleFloorClick3D = (x: number, z: number) => {
    const snapX = Math.round(x * 2) / 2;
    const snapZ = Math.round(z * 2) / 2;

    if (planTool === 'furniture') {
      if (selectedCatalogItem) {
        handlePlaceFurnitureAt(selectedCatalogItem, snapX, snapZ);
      }
    } else if (planTool === 'wall') {
      if (!wallStart) {
        setWallStart({ x: snapX, z: snapZ });
        sound.playClick();
      } else {
        const newWall: FloorPlanWall = {
          id: `wall_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          start: { x: wallStart.x, z: wallStart.z },
          end: { x: snapX, z: snapZ },
          thickness: 0.18,
          height: 2.6,
          floorNumber: currentFloor,
          wallType: 'solid',
        };
        setInterior((prev) => ({
          ...prev,
          walls: [...(prev.walls || []), newWall],
        }));
        setWallStart(null);
        sound.playPlace();
      }
    } else if (planTool === 'door') {
      const newDoor: FloorPlanDoor = {
        id: `door_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x: snapX,
        z: snapZ,
        rotation: 0,
        width: 0.9,
        floorNumber: currentFloor,
        doorType: 'standard',
      };
      setInterior((prev) => ({
        ...prev,
        doors: [...(prev.doors || []), newDoor],
      }));
      sound.playPlace();
    } else if (planTool === 'window') {
      const newWin: FloorPlanWindow = {
        id: `win_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x: snapX,
        z: snapZ,
        rotation: 0,
        width: 1.4,
        floorNumber: currentFloor,
        windowType: 'standard',
      };
      setInterior((prev) => ({
        ...prev,
        windows: [...(prev.windows || []), newWin],
      }));
      sound.playPlace();
    } else if (planTool === 'room') {
      const newRoom: FloorPlanRoom = {
        id: `room_${Date.now()}`,
        name: newRoomName,
        bounds: { x: snapX - 1.5, z: snapZ - 1.5, width: 3.0, depth: 3.0 },
        color: '#38bdf8',
        floorNumber: currentFloor,
      };
      setInterior((prev) => ({
        ...prev,
        rooms: [...(prev.rooms || []), newRoom],
      }));
      sound.playPlace();
    }
  };

  // Calculate live Interior Scores
  const totalComfort = Math.min(
    100,
    interior.furniture.reduce((acc, f) => {
      const def = FURNITURE_MAP.get(f.defId);
      return acc + (def?.comfortBonus || 0);
    }, 20)
  );

  const totalRentBonus = interior.furniture.reduce((acc, f) => {
    const def = FURNITURE_MAP.get(f.defId);
    return acc + (def?.rentBonus || 0);
  }, 0);

  // Actions
  const handlePlaceFurnitureAt = (defId: string, x: number, z: number) => {
    const def = FURNITURE_MAP.get(defId);
    if (!def) return;

    if (!isFreeMode && currentFunds < def.cost) {
      return;
    }

    const newPiece: PlacedFurniture = {
      instanceId: `furn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      defId,
      x: Math.round(x * 4) / 4,
      z: Math.round(z * 4) / 4,
      y: 0,
      floorNumber: currentFloor,
      rotation: 0,
      color: def.colorOptions[0] || '#475569',
      finish: def.finishes[0] || 'Standard',
    };

    if (!isFreeMode) {
      onDeductFunds(def.cost);
    }
    sound.playPlace();

    setInterior((prev) => ({
      ...prev,
      furniture: [...prev.furniture, newPiece],
    }));

    setSelectedFurniture(newPiece);
    setSelectedCatalogItem(null);
    if (sceneRef.current) {
      sceneRef.current.updateGhostPreview(null);
    }
  };

  const handleRotateSelected = () => {
    if (!selectedFurniture) return;
    const newRot = (selectedFurniture.rotation + 45) % 360;
    const updated = { ...selectedFurniture, rotation: newRot };
    setSelectedFurniture(updated);
    setInterior((prev) => ({
      ...prev,
      furniture: prev.furniture.map((f) =>
        f.instanceId === updated.instanceId ? updated : f
      ),
    }));
    sound.playRotate();
  };

  const handleRemoveSelected = () => {
    if (!selectedFurniture) return;
    const def = FURNITURE_MAP.get(selectedFurniture.defId);
    if (!isFreeMode && def) {
      onRefundFunds(Math.round(def.cost * 0.7)); // 70% refund on furniture return
    }
    sound.playDemolish();

    setInterior((prev) => ({
      ...prev,
      furniture: prev.furniture.filter((f) => f.instanceId !== selectedFurniture.instanceId),
    }));
    setSelectedFurniture(null);
    if (sceneRef.current) {
      sceneRef.current.setSelection(null);
    }
  };

  const handleDeleteWall = (id: string) => {
    setInterior((prev) => ({
      ...prev,
      walls: (prev.walls || []).filter((w) => w.id !== id),
    }));
    setSelectedWallId(null);
    sound.playDemolish();
  };

  const handleDeleteDoor = (id: string) => {
    setInterior((prev) => ({
      ...prev,
      doors: (prev.doors || []).filter((d) => d.id !== id),
    }));
    setSelectedDoorId(null);
    sound.playDemolish();
  };

  const handleDeleteWindow = (id: string) => {
    setInterior((prev) => ({
      ...prev,
      windows: (prev.windows || []).filter((w) => w.id !== id),
    }));
    setSelectedWindowId(null);
    sound.playDemolish();
  };

  const handleChangeWallColor = (color: string) => {
    setInterior((prev) => ({ ...prev, wallColor: color }));
    if (sceneRef.current) {
      sceneRef.current.updateInteriorStyling(color, interior.floorType);
    }
    sound.playClick();
  };

  const handleChangeFloorType = (floor: BuildingInterior['floorType']) => {
    setInterior((prev) => ({ ...prev, floorType: floor }));
    if (sceneRef.current) {
      sceneRef.current.updateInteriorStyling(interior.wallColor, floor);
    }
    sound.playClick();
  };

  const handleSaveAndClose = () => {
    if (building) {
      onSaveInterior(building.instanceId, interior);
    }
    onClose();
    sound.playClick();
  };

  const handleCaptureSnapshot = () => {
    if (sceneRef.current) {
      const dataUrl = sceneRef.current.captureSnapshot();
      onOpenPhoto(dataUrl);
      sound.playClick();
    }
  };

  if (!isOpen || !building) return null;

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    const matchesCategory = searchQuery.trim() ? true : item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const rw = interior.roomWidth || 8;
  const rd = interior.roomDepth || 8;
  const floorAreaM2 = Math.round(rw * rd);
  const floorAreaSqFt = Math.round(floorAreaM2 * 10.764);

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Studio Navigation Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between gap-6 z-20">
        <div className="flex items-center gap-4">
          <div className="font-display font-bold text-white text-base flex items-center gap-2">
            <span className="text-sky-400">CityForge</span>
            <span className="text-slate-400 text-xs font-normal">· Architectural Floor-Plan Studio</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-white">{building.customName || 'Building Interior'}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">{floorAreaM2} m² ({floorAreaSqFt} sq ft)</span>
          </div>
        </div>

        {/* Floor Level Navigation & Controls */}
        <div className="flex items-center gap-2">
          {/* Multi-Floor Selector (Core Requirement 4) */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Floor:</span>
            </span>
            {[1, 2, 3, 4].map((fl) => {
              const label = fl === 1 ? 'L1 Ground' : fl === 4 ? 'Roof' : `L${fl}`;
              const isActive = currentFloor === fl;
              return (
                <button
                  key={fl}
                  onClick={() => {
                    setCurrentFloor(fl);
                    sound.playClick();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Clear Floor (Start from Scratch) */}
          <button
            onClick={() => {
              setInterior((prev) => ({
                ...prev,
                furniture: prev.furniture.filter((f) => (f.floorNumber || 1) !== currentFloor),
                walls: (prev.walls || []).filter((w) => w.floorNumber !== currentFloor),
                doors: (prev.doors || []).filter((d) => d.floorNumber !== currentFloor),
                windows: (prev.windows || []).filter((w) => w.floorNumber !== currentFloor),
              }));
              sound.playDemolish();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors cursor-pointer"
            title="Wipe this floor clean to design from scratch"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">From Scratch</span>
          </button>

          {/* 2D / 3D Switch */}
          <button
            onClick={() => {
              const next = viewMode === '3d' ? '2d_blueprint' : '3d';
              setViewMode(next);
              sceneRef.current?.setViewPerspective(next);
              sound.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === '2d_blueprint' ? 'bg-sky-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === '3d' ? '3D Room View' : '2D Floorplan'}</span>
          </button>

          {/* Time of Day */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={() => {
                setTimeOfDay('day');
                sceneRef.current?.setTimeOfDay('day');
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                timeOfDay === 'day' ? 'bg-slate-700 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Day Sunlight"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTimeOfDay('sunset');
                sceneRef.current?.setTimeOfDay('sunset');
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                timeOfDay === 'sunset' ? 'bg-slate-700 text-orange-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Sunset Ambient"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTimeOfDay('night');
                sceneRef.current?.setTimeOfDay('night');
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                timeOfDay === 'night' ? 'bg-slate-700 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Night Warm Lamps"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Snapshot */}
          <button
            onClick={handleCaptureSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>

          {/* Save & Return */}
          <button
            onClick={handleSaveAndClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save & Return</span>
          </button>
        </div>
      </header>

      {/* Floor-Plan Tool Strip (Core Requirement 3: Drawing walls, rooms, doors, windows) */}
      <div className="h-11 bg-slate-920 border-b border-slate-800 px-6 flex items-center justify-between gap-4 z-10 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold mr-1">Architectural Tools:</span>
          
          <button
            onClick={() => {
              setPlanTool('furniture');
              setWallStart(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              planTool === 'furniture'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Furniture & Lifts</span>
          </button>

          <button
            onClick={() => {
              setPlanTool('wall');
              setSelectedCatalogItem(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              planTool === 'wall'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-amber-400" />
            <span>Draw Wall</span>
          </button>

          <button
            onClick={() => {
              setPlanTool('door');
              setSelectedCatalogItem(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              planTool === 'door'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Place Door</span>
          </button>

          <button
            onClick={() => {
              setPlanTool('window');
              setSelectedCatalogItem(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              planTool === 'window'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Place Window</span>
          </button>

          <button
            onClick={() => {
              setPlanTool('room');
              setSelectedCatalogItem(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              planTool === 'room'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Define Room</span>
          </button>
        </div>

        {planTool === 'wall' && (
          <div className="text-amber-300 text-[11px] font-mono animate-pulse">
            {wallStart
              ? `Wall start set at (${wallStart.x}, ${wallStart.z}) — click floor to complete wall`
              : 'Click floor to set wall start point'}
          </div>
        )}

        {planTool === 'room' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Room Zone:</span>
            <select
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-0.5 text-xs focus:outline-none"
            >
              <option value="Living Room">Living Room</option>
              <option value="Master Bedroom">Master Bedroom</option>
              <option value="Chef Kitchen">Chef Kitchen</option>
              <option value="Executive Office">Executive Office</option>
              <option value="Luxury Ensuite">Luxury Ensuite</option>
              <option value="Dining Hall">Dining Hall</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Furniture & Architectural Catalog Drawer */}
        <aside className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col z-10 shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search furniture, lifts, stairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Category tabs */}
            {!searchQuery && (
              <div className="grid grid-cols-4 gap-1 text-[11px] font-medium text-slate-400">
                {(['living', 'bedroom', 'kitchen', 'office', 'cafe', 'lifts', 'decor'] as const).map((cat) => {
                  const label = cat === 'lifts' ? 'Lifts & Stairs' : cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`py-1 rounded-md capitalize transition-colors cursor-pointer text-center truncate px-1 ${
                        activeTab === cat
                          ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                          : cat === 'lifts'
                          ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'hover:bg-slate-800 hover:text-slate-200'
                      }`}
                      title={label}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Furniture Items Grid */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {filteredCatalog.map((item) => {
              const isSelected = selectedCatalogItem === item.id;
              const canAfford = isFreeMode || currentFunds >= item.cost;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (canAfford) {
                      setSelectedCatalogItem(item.id);
                      setPlanTool('furniture');
                      sceneRef.current?.updateGhostPreview(item.id);
                      sound.playClick();
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/20'
                      : canAfford
                      ? 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                      : 'bg-slate-850 border-slate-800 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-white text-xs leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                    <div className="text-xs font-mono-data font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
                      {isFreeMode ? 'FREE' : `$${item.cost}`}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono-data">
                    <span>{item.dimensions[0]}×{item.dimensions[2]}m</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sky-400">+{item.comfortBonus} comfort</span>
                      {item.rentBonus > 0 && <span className="text-emerald-400">+${item.rentBonus}/d</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Central 3D / 2D Interior Viewport */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Real-time placement helper banner */}
          {selectedCatalogItem && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-sky-500/50 px-4 py-2 rounded-full text-xs text-white shadow-xl flex items-center gap-3">
              <span className="font-medium text-sky-300">
                Placing: {FURNITURE_MAP.get(selectedCatalogItem)?.name}
              </span>
              <span className="text-slate-400">Click anywhere on floor to place</span>
              <button
                onClick={() => {
                  setSelectedCatalogItem(null);
                  sceneRef.current?.updateGhostPreview(null);
                }}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Viewport instruction badge */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 flex items-center gap-3 pointer-events-none">
            <span><strong>Click Floor</strong> Place item / Wall</span>
            <span>·</span>
            <span><strong>Right-Click Drag</strong> Orbit Room</span>
            <span>·</span>
            <span><strong>Scroll</strong> Zoom</span>
          </div>
        </div>

        {/* Right Side: Selected Furniture & Floor-Plan Customizer */}
        <aside className="w-80 bg-slate-900/95 border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto shrink-0 space-y-4">
          <div>
            {/* Live Room Metrics Strip */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-4">
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <Smile className="w-3 h-3 text-sky-400" />
                  <span>Interior Comfort</span>
                </div>
                <div className="font-bold text-white text-base font-mono-data">{totalComfort}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>Rent Dividend</span>
                </div>
                <div className="font-bold text-emerald-400 text-base font-mono-data">+${totalRentBonus}/d</div>
              </div>
            </div>

            {/* Selected Furniture Editor */}
            {selectedFurniture ? (
              <div className="space-y-4 border-b border-slate-800 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {FURNITURE_MAP.get(selectedFurniture.defId)?.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rotation: {selectedFurniture.rotation}°
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFurniture(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Rotate & Delete controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotateSelected}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate (+45°)</span>
                  </button>

                  <button
                    onClick={handleRemoveSelected}
                    className="py-2 px-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-900/40"
                    title="Remove piece and receive refund"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color & Material Finish Switcher */}
                {FURNITURE_MAP.get(selectedFurniture.defId)?.colorOptions && (
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-sky-400" />
                      <span>Upholstery & Finish Color</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {FURNITURE_MAP.get(selectedFurniture.defId)?.colorOptions.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => {
                            const updated = { ...selectedFurniture, color: hex };
                            setSelectedFurniture(updated);
                            setInterior((prev) => ({
                              ...prev,
                              furniture: prev.furniture.map((f) =>
                                f.instanceId === updated.instanceId ? updated : f
                              ),
                            }));
                            sound.playClick();
                          }}
                          className={`w-7 h-7 rounded-lg border cursor-pointer transition-transform ${
                            selectedFurniture.color === hex
                              ? 'scale-110 border-white ring-2 ring-sky-400'
                              : 'border-slate-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed mb-4">
                Click any furniture in the 3D room to rotate, recolor, or reposition it.
              </div>
            )}

            {/* Drawn Walls & Openings List */}
            {((interior.walls && interior.walls.length > 0) || (interior.doors && interior.doors.length > 0)) && (
              <div className="space-y-2 border-b border-slate-800 pb-3 mb-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Drawn Walls & Openings</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {interior.walls?.length || 0} walls · {interior.doors?.length || 0} doors
                  </span>
                </h4>
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                  {interior.walls?.map((w, idx) => (
                    <div
                      key={w.id}
                      className="p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300">
                        Wall #{idx + 1} ({w.start.x}, {w.start.z}) → ({w.end.x}, {w.end.z})
                      </span>
                      <button
                        onClick={() => handleDeleteWall(w.id)}
                        className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                        title="Delete Wall"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {interior.doors?.map((d, idx) => (
                    <div
                      key={d.id}
                      className="p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-emerald-300">Door #{idx + 1} at ({d.x}, {d.z})</span>
                      <button
                        onClick={() => handleDeleteDoor(d.id)}
                        className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                        title="Delete Door"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Architecture Customizer */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                <span>Room Finishes</span>
              </h4>

              {/* Floor Material */}
              <div>
                <label className="text-xs text-slate-300 block mb-1.5">Floor Surface</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'oak_parquet', label: 'Oak Parquet' },
                    { id: 'marble_tile', label: 'Carrara Marble' },
                    { id: 'polished_concrete', label: 'Raw Concrete' },
                    { id: 'cozy_carpet', label: 'Navy Carpet' },
                  ].map((fl) => (
                    <button
                      key={fl.id}
                      onClick={() => handleChangeFloorType(fl.id as BuildingInterior['floorType'])}
                      className={`p-2 rounded-lg text-left transition-colors cursor-pointer border ${
                        interior.floorType === fl.id
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-medium'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                      }`}
                    >
                      {fl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wall Paint Color */}
              <div>
                <label className="text-xs text-slate-300 block mb-1.5">Wall Paint</label>
                <div className="flex items-center gap-2">
                  {['#f1f5f9', '#e2e8f0', '#334155', '#1e293b', '#0f766e', '#78350f'].map((col) => (
                    <button
                      key={col}
                      onClick={() => handleChangeWallColor(col)}
                      className={`w-7 h-7 rounded-lg border cursor-pointer transition-transform ${
                        interior.wallColor === col
                          ? 'scale-110 border-white ring-2 ring-sky-400'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Living Citizens Inside */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Active Occupants ({interior.occupants.length})</span>
              </h4>
              <div className="space-y-1.5">
                {interior.occupants.map((occ) => (
                  <div key={occ.id} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                    <div className="font-semibold text-white flex items-center justify-between">
                      <span>{occ.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{occ.role}</span>
                    </div>
                    <div className="text-[11px] text-sky-400 mt-0.5">{occ.activity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Return Button */}
          <button
            onClick={handleSaveAndClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Done Furnishing</span>
          </button>
        </aside>
      </div>
    </div>
  );
};
