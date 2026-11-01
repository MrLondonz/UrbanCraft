import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { City3DScene } from '../engine/city3dScene';
import { City2DCanvas } from '../engine/city2dCanvas';
import { PlacedBuilding, ToolMode, ViewPerspective, TimeOfDay, CutawayFloor, CameraPreset, RenderQuality } from '../types/city';

export interface CityCanvasHandle {
  captureSnapshot: () => string;
  spawnVehicle: (defId: string, coord: { x: number; z: number }) => void;
  setFirstPersonMode: (active: boolean) => void;
  focusOnObject: (coord: { x: number; z: number }) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  resetCamera: () => void;
  setRenderQuality: (quality: RenderQuality) => void;
  setSunExposure: (exposure: number) => void;
}

interface CityCanvasProps {
  buildings: PlacedBuilding[];
  toolMode: ToolMode;
  selectedDefId: string | null;
  rotation: 0 | 90 | 180 | 270;
  viewMode: ViewPerspective;
  timeOfDay: TimeOfDay;
  cutawayFloor?: CutawayFloor;
  renderQuality?: RenderQuality;
  selectedBuilding: PlacedBuilding | null;
  onTileClick: (coord: { x: number; z: number }) => void;
  onTileHover?: (coord: { x: number; z: number } | null) => void;
  onBuildingClick: (building: PlacedBuilding) => void;
  onExitFirstPerson?: () => void;
}

export const CityCanvas = forwardRef<CityCanvasHandle, CityCanvasProps>(({
  buildings,
  toolMode,
  selectedDefId,
  rotation: _rotation,
  viewMode,
  timeOfDay,
  cutawayFloor = 'all',
  renderQuality = 'ultra',
  selectedBuilding,
  onTileClick,
  onTileHover,
  onBuildingClick,
  onExitFirstPerson,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scene3dRef = useRef<City3DScene | null>(null);
  const canvas2dRef = useRef<City2DCanvas | null>(null);
  const [use2dFallback, setUse2dFallback] = useState<boolean>(false);

  // Initialize Scene with robust WebGL check & fallback
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Clean any prior children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    let active3D: City3DScene | null = null;
    let active2D: City2DCanvas | null = null;

    if (use2dFallback) {
      active2D = new City2DCanvas(container, {
        onTileClick,
        onTileHover,
        onBuildingClick,
      });
      canvas2dRef.current = active2D;
    } else {
      try {
        active3D = new City3DScene(container, {
          onTileClick,
          onTileHover,
          onBuildingClick,
          onFirstPersonExit: () => {
            if (onExitFirstPerson) {
              onExitFirstPerson();
            }
          },
          onContextLost: () => {
            console.warn('Switching to 2D isometric fallback engine due to WebGL context loss');
            setUse2dFallback(true);
          },
        });
        scene3dRef.current = active3D;
      } catch (err) {
        console.warn('WebGL initialization failed or unsupported, starting 2D isometric engine:', err);
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        active2D = new City2DCanvas(container, {
          onTileClick,
          onTileHover,
          onBuildingClick,
        });
        canvas2dRef.current = active2D;
        setUse2dFallback(true);
      }
    }

    return () => {
      if (active3D) {
        active3D.dispose();
        scene3dRef.current = null;
      }
      if (active2D) {
        active2D.dispose();
        canvas2dRef.current = null;
      }
    };
  }, [use2dFallback, onTileClick, onTileHover, onBuildingClick, onExitFirstPerson]);

  // Sync buildings
  useEffect(() => {
    if (scene3dRef.current) {
      scene3dRef.current.syncBuildings(buildings);
    }
    if (canvas2dRef.current) {
      canvas2dRef.current.syncBuildings(buildings);
    }
  }, [buildings]);

  // Sync view perspective (2D blueprint vs 3D isometric vs first_person)
  useEffect(() => {
    if (scene3dRef.current) {
      if (viewMode === 'first_person') {
        scene3dRef.current.setFirstPersonMode(
          true,
          selectedBuilding ? { x: selectedBuilding.x, z: selectedBuilding.z } : undefined
        );
      } else {
        scene3dRef.current.setFirstPersonMode(false);
        scene3dRef.current.setViewPerspective(viewMode);
      }
    }
    if (canvas2dRef.current && viewMode !== 'first_person') {
      canvas2dRef.current.setViewPerspective(viewMode);
    }
  }, [viewMode, selectedBuilding]);

  // Sync time of day
  useEffect(() => {
    if (scene3dRef.current) {
      scene3dRef.current.setTimeOfDay(timeOfDay);
    }
    if (canvas2dRef.current) {
      canvas2dRef.current.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay]);

  // Sync selection highlight
  useEffect(() => {
    if (scene3dRef.current) {
      scene3dRef.current.setSelection(selectedBuilding);
    }
    if (canvas2dRef.current) {
      canvas2dRef.current.setSelection(selectedBuilding);
    }
  }, [selectedBuilding]);

  // Sync ghost blueprint preview
  useEffect(() => {
    const ghostId = toolMode === 'plan' ? selectedDefId : null;
    if (scene3dRef.current) {
      scene3dRef.current.updateGhostPreview(ghostId, true);
    }
    if (canvas2dRef.current) {
      canvas2dRef.current.updateGhostPreview(ghostId);
    }
  }, [toolMode, selectedDefId]);

  // Sync cutaway floor
  useEffect(() => {
    if (scene3dRef.current) {
      scene3dRef.current.setCutawayFloor(cutawayFloor);
    }
  }, [cutawayFloor]);

  // Sync render quality
  useEffect(() => {
    if (scene3dRef.current) {
      scene3dRef.current.setRenderQuality(renderQuality);
    }
  }, [renderQuality]);

  // Expose snapshot, vehicle spawn, camera navigation, and rendering methods
  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      if (scene3dRef.current) {
        return scene3dRef.current.captureSnapshot();
      }
      if (canvas2dRef.current) {
        return canvas2dRef.current.captureSnapshot();
      }
      return '';
    },
    spawnVehicle: (defId: string, coord: { x: number; z: number }) => {
      if (scene3dRef.current) {
        scene3dRef.current.spawnUserVehicle(defId, coord);
      }
    },
    setFirstPersonMode: (active: boolean) => {
      if (scene3dRef.current) {
        scene3dRef.current.setFirstPersonMode(active);
      }
    },
    focusOnObject: (coord: { x: number; z: number }) => {
      if (scene3dRef.current) {
        scene3dRef.current.focusOnObject(coord);
      }
    },
    setCameraPreset: (preset: CameraPreset) => {
      if (scene3dRef.current) {
        scene3dRef.current.setCameraPreset(preset);
      }
    },
    resetCamera: () => {
      if (scene3dRef.current) {
        scene3dRef.current.resetCamera();
      }
    },
    setRenderQuality: (quality: RenderQuality) => {
      if (scene3dRef.current) {
        scene3dRef.current.setRenderQuality(quality);
      }
    },
    setSunExposure: (exposure: number) => {
      if (scene3dRef.current) {
        scene3dRef.current.setSunExposure(exposure);
      }
    },
  }));

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* First Person Active Indicator Badge */}
      {viewMode === 'first_person' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-sky-950/90 backdrop-blur-md border border-sky-500/60 px-4 py-2 rounded-2xl text-xs text-white shadow-2xl flex items-center gap-3 z-30 animate-in fade-in duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-sky-200">First-Person Street Walk Mode</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-300 font-mono text-[11px]">WASD / Arrows to Walk · Drag to Look</span>
          <button
            onClick={onExitFirstPerson}
            className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] cursor-pointer transition-all active:scale-95"
          >
            Exit (ESC)
          </button>
        </div>
      )}

      {/* Discreet Bottom-Left Viewport Controls Helper */}
      <div className="absolute bottom-10 left-6 bg-slate-950/70 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 select-none pointer-events-none hidden sm:flex items-center gap-3">
        <span><strong className="text-slate-200">Left-Click</strong> Place/Select</span>
        <span>·</span>
        <span><strong className="text-slate-200">Right-Drag</strong> Orbit</span>
        <span>·</span>
        <span><strong className="text-slate-200">Ctrl/Middle-Drag</strong> Pan</span>
        <span>·</span>
        <span><strong className="text-slate-200">Scroll</strong> Zoom</span>
        <span>·</span>
        <span><strong className="text-slate-200">F</strong> First-Person</span>
      </div>
    </div>
  );
});
