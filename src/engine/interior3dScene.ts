/**
 * Planner 5D-Style Real-Time Interior 3D Room Studio Engine
 * Full real-time furniture manipulation, procedural 3D furniture meshes,
 * wall/floor styling, dynamic occupants, and 2D/3D blueprint mode.
 */
import * as THREE from 'three';
import { PlacedFurniture, BuildingInterior, TimeOfDay, ViewPerspective } from '../types/city';
import { FURNITURE_MAP } from '../data/furnitureCatalog';

export interface InteriorInteractionCallbacks {
  onFurnitureSelect?: (furniture: PlacedFurniture | null) => void;
  onFurnitureMove?: (instanceId: string, x: number, z: number) => void;
  onFloorClick?: (x: number, z: number) => void;
}

export class Interior3DScene {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // View state
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0.5, 0);
  private cameraDistance: number = 14;
  private cameraAngleH: number = Math.PI / 4;
  private cameraAngleV: number = 0.75;
  private targetCameraAngleV: number = 0.75;
  private is2DMode: boolean = false;

  // Dragging & Interaction
  private isPointerDown: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private pointerButton: number = 0;
  private isDraggingFurniture: boolean = false;
  private selectedFurnitureId: string | null = null;
  private hoveredFloorCoord: { x: number; z: number } | null = null;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private mainLight: THREE.DirectionalLight;
  private warmLampLight: THREE.PointLight;
  private currentTimeOfDay: TimeOfDay = 'day';

  // Scene Objects
  private floorMesh: THREE.Mesh;
  private wallGroup: THREE.Group = new THREE.Group();
  private furnitureMeshes: Map<string, THREE.Group> = new Map();
  private animatedProps: Array<{ mesh: THREE.Object3D; update: (dt: number, time: number) => void }> = [];
  private occupantMeshes: Map<string, THREE.Group> = new Map();
  private selectionBox: THREE.Mesh | null = null;
  private ghostMesh: THREE.Group | null = null;
  private floorGridHelper: THREE.GridHelper;

  private currentInterior: BuildingInterior;
  private callbacks: InteriorInteractionCallbacks;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  constructor(
    container: HTMLElement,
    interior: BuildingInterior,
    callbacks: InteriorInteractionCallbacks = {}
  ) {
    this.container = container;
    this.currentInterior = interior;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);

    const width = Math.max(container.clientWidth || 800, 320);
    const height = Math.max(container.clientHeight || 600, 240);
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 150);
    this.updateCameraPosition();

    // Safe WebGLRenderer
    const canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'default',
      precision: 'mediump',
      depth: true,
      failIfMajorPerformanceCaveat: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1);
    this.renderer.debug.checkShaderErrors = false; // Suppresses false-positive Shader Error VALIDATE_STATUS
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    // Interior Studio Lighting
    this.ambientLight = new THREE.AmbientLight(0xfff5ea, 0.9);
    this.scene.add(this.ambientLight);

    this.mainLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    this.mainLight.position.set(12, 18, 10);
    this.scene.add(this.mainLight);

    this.warmLampLight = new THREE.PointLight(0xfef08a, 1.2, 18);
    this.warmLampLight.position.set(0, 3.5, 0);
    this.scene.add(this.warmLampLight);

    // Floor & Room Perimeter
    const rw = interior.roomWidth;
    const rd = interior.roomDepth;
    const floorGeo = new THREE.PlaneGeometry(rw, rd);
    const floorMat = this.createFloorMaterial(interior.floorType);
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.scene.add(this.floorMesh);

    // Architectural Grid Overlay
    this.floorGridHelper = new THREE.GridHelper(Math.max(rw, rd), Math.round(Math.max(rw, rd)), 0x38bdf8, 0x1e3a5f);
    this.floorGridHelper.position.y = 0.01;
    this.scene.add(this.floorGridHelper);

    // Perimeter Cutaway Walls (open view so camera never clips)
    this.scene.add(this.wallGroup);
    this.rebuildWalls(rw, rd, interior.wallColor);

    // Initial Furniture & Occupants
    this.syncFurniture(interior.furniture);
    this.syncOccupants(interior.occupants);

    this.bindEvents();
    this.animate();
  }

  private createFloorMaterial(floorType: string): THREE.MeshLambertMaterial {
    switch (floorType) {
      case 'oak_parquet':
        return new THREE.MeshLambertMaterial({ color: 0xc2884a });
      case 'marble_tile':
        return new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
      case 'polished_concrete':
        return new THREE.MeshLambertMaterial({ color: 0x475569 });
      case 'cozy_carpet':
        return new THREE.MeshLambertMaterial({ color: 0x334155 });
      default:
        return new THREE.MeshLambertMaterial({ color: 0xc2884a });
    }
  }

  public updateInteriorStyling(wallColor: string, floorType: BuildingInterior['floorType']) {
    this.currentInterior.wallColor = wallColor;
    this.currentInterior.floorType = floorType;
    this.floorMesh.material = this.createFloorMaterial(floorType);
    this.rebuildWalls(this.currentInterior.roomWidth, this.currentInterior.roomDepth, wallColor);
  }

  private rebuildWalls(rw: number, rd: number, wallColor: string) {
    while (this.wallGroup.children.length > 0) {
      this.wallGroup.remove(this.wallGroup.children[0]);
    }

    const wallHeight = 2.8;
    const wallMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(wallColor) });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

    // Back North Wall
    const northGeo = new THREE.BoxGeometry(rw, wallHeight, 0.2);
    const northWall = new THREE.Mesh(northGeo, wallMat);
    northWall.position.set(0, wallHeight / 2, -rd / 2);
    this.wallGroup.add(northWall);

    // Baseboard trim
    const trimNorthGeo = new THREE.BoxGeometry(rw, 0.15, 0.24);
    const trimNorth = new THREE.Mesh(trimNorthGeo, trimMat);
    trimNorth.position.set(0, 0.08, -rd / 2);
    this.wallGroup.add(trimNorth);

    // West Side Wall
    const westGeo = new THREE.BoxGeometry(0.2, wallHeight, rd);
    const westWall = new THREE.Mesh(westGeo, wallMat);
    westWall.position.set(-rw / 2, wallHeight / 2, 0);
    this.wallGroup.add(westWall);

    const trimWestGeo = new THREE.BoxGeometry(0.24, 0.15, rd);
    const trimWest = new THREE.Mesh(trimWestGeo, trimMat);
    trimWest.position.set(-rw / 2, 0.08, 0);
    this.wallGroup.add(trimWest);

    // Large architectural window on West Wall with view
    const windowFrameGeo = new THREE.BoxGeometry(0.24, 1.6, 2.8);
    const windowFrameMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    windowFrame.position.set(-rw / 2, 1.6, 0);
    this.wallGroup.add(windowFrame);

    const glassGeo = new THREE.BoxGeometry(0.1, 1.4, 2.6);
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(-rw / 2, 1.6, 0);
    this.wallGroup.add(glass);

    // Render custom architectural floor-plan partition walls
    if (this.currentInterior.walls && this.currentInterior.walls.length > 0) {
      this.currentInterior.walls.forEach((w) => {
        const dx = w.end.x - w.start.x;
        const dz = w.end.z - w.start.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.1) return;

        const angle = Math.atan2(dz, dx);
        const midX = (w.start.x + w.end.x) / 2;
        const midZ = (w.start.z + w.end.z) / 2;

        const pWallGeo = new THREE.BoxGeometry(length, w.height || 2.6, w.thickness || 0.16);
        const pWallMat = w.wallType === 'glass'
          ? new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
          : wallMat;
        const pWall = new THREE.Mesh(pWallGeo, pWallMat);
        pWall.position.set(midX, (w.height || 2.6) / 2, midZ);
        pWall.rotation.y = -angle;
        this.wallGroup.add(pWall);
      });
    }

    // Render custom doors
    if (this.currentInterior.doors && this.currentInterior.doors.length > 0) {
      this.currentInterior.doors.forEach((door) => {
        const doorGeo = new THREE.BoxGeometry(door.width || 0.9, 2.2, 0.1);
        const doorMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(door.x, 1.1, door.z);
        doorMesh.rotation.y = (door.rotation * Math.PI) / 180;
        this.wallGroup.add(doorMesh);
      });
    }

    // Render custom windows
    if (this.currentInterior.windows && this.currentInterior.windows.length > 0) {
      this.currentInterior.windows.forEach((win) => {
        const winGeo = new THREE.BoxGeometry(win.width || 1.4, 1.4, 0.08);
        const winMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
        const winMesh = new THREE.Mesh(winGeo, winMat);
        winMesh.position.set(win.x, 1.6, win.z);
        winMesh.rotation.y = (win.rotation * Math.PI) / 180;
        this.wallGroup.add(winMesh);
      });
    }
  }

  public syncInteriorData(interior: BuildingInterior) {
    this.currentInterior = interior;
    this.rebuildWalls(interior.roomWidth, interior.roomDepth, interior.wallColor);
  }

  // --- CAMERA ---

  private updateCameraPosition() {
    const x = this.cameraTarget.x + this.cameraDistance * Math.cos(this.cameraAngleH) * Math.cos(this.cameraAngleV);
    const y = this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraAngleV);
    const z = this.cameraTarget.z + this.cameraDistance * Math.sin(this.cameraAngleH) * Math.cos(this.cameraAngleV);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  public setViewPerspective(mode: ViewPerspective) {
    this.is2DMode = mode === '2d_blueprint';
    if (this.is2DMode) {
      this.targetCameraAngleV = Math.PI / 2 - 0.01;
      this.scene.background = new THREE.Color(0x070d1e);
    } else {
      this.targetCameraAngleV = 0.75;
      this.applyTimeOfDay(this.currentTimeOfDay);
    }
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.currentTimeOfDay = time;
    this.applyTimeOfDay(time);
  }

  private applyTimeOfDay(time: TimeOfDay) {
    if (this.is2DMode) {
      this.scene.background = new THREE.Color(0x070d1e);
      return;
    }

    if (time === 'day') {
      this.scene.background = new THREE.Color(0x0f172a);
      this.ambientLight.color.setHex(0xfff5ea);
      this.ambientLight.intensity = 0.9;
      this.mainLight.color.setHex(0xfffaed);
      this.mainLight.intensity = 1.3;
      this.warmLampLight.intensity = 0.4;
    } else if (time === 'sunset') {
      this.scene.background = new THREE.Color(0x1e1222);
      this.ambientLight.color.setHex(0xf472b6);
      this.ambientLight.intensity = 0.7;
      this.mainLight.color.setHex(0xfb923c);
      this.mainLight.intensity = 1.1;
      this.warmLampLight.intensity = 1.0;
    } else if (time === 'night') {
      this.scene.background = new THREE.Color(0x04060d);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.35;
      this.mainLight.color.setHex(0x38bdf8);
      this.mainLight.intensity = 0.3;
      this.warmLampLight.intensity = 1.8;
    }
  }

  // --- EVENTS & GESTURES ---

  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    el.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onPointerDown(e: PointerEvent) {
    this.isPointerDown = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.pointerButton = e.button;
    this.isDraggingFurniture = false;

    // Check if clicked directly on a furniture piece
    if (this.pointerButton === 0) {
      const clickedPiece = this.getFurnitureUnderMouse();
      if (clickedPiece) {
        this.selectedFurnitureId = clickedPiece.instanceId;
        this.isDraggingFurniture = true;
        this.setSelection(clickedPiece);
        if (this.callbacks.onFurnitureSelect) {
          this.callbacks.onFurnitureSelect(clickedPiece);
        }
      }
    }
  }

  private onPointerMove(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast floor position
    const floorPt = this.getFloorIntersection();
    if (floorPt) {
      this.hoveredFloorCoord = { x: floorPt.x, z: floorPt.z };

      if (this.ghostMesh) {
        this.ghostMesh.position.set(floorPt.x, 0.02, floorPt.z);
        this.ghostMesh.visible = true;
      }

      // If actively dragging a piece of furniture across the floor
      if (this.isPointerDown && this.isDraggingFurniture && this.selectedFurnitureId) {
        const mesh = this.furnitureMeshes.get(this.selectedFurnitureId);
        if (mesh) {
          mesh.position.x = Math.round(floorPt.x * 4) / 4; // 0.25m snap
          mesh.position.z = Math.round(floorPt.z * 4) / 4;
          if (this.selectionBox) {
            const box = new THREE.Box3().setFromObject(mesh);
            const center = new THREE.Vector3();
            box.getCenter(center);
            this.selectionBox.position.copy(center);
          }

          if (this.callbacks.onFurnitureMove) {
            this.callbacks.onFurnitureMove(this.selectedFurnitureId, mesh.position.x, mesh.position.z);
          }
        }
      }
    } else {
      if (this.ghostMesh) this.ghostMesh.visible = false;
    }

    // Camera orbit / pan
    if (this.isPointerDown && !this.isDraggingFurniture) {
      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;

      if (this.pointerButton === 2 || (this.pointerButton === 0 && e.shiftKey)) {
        this.cameraAngleH -= deltaX * 0.007;
        if (!this.is2DMode) {
          this.cameraAngleV = THREE.MathUtils.clamp(this.cameraAngleV + deltaY * 0.007, 0.15, Math.PI / 2 - 0.05);
          this.targetCameraAngleV = this.cameraAngleV;
        }
        this.updateCameraPosition();
      } else if (this.pointerButton === 1 || (this.pointerButton === 0 && (e.ctrlKey || e.metaKey))) {
        const panSpeed = 0.02 * (this.cameraDistance / 14);
        const forward = new THREE.Vector3(-Math.sin(this.cameraAngleH), 0, -Math.cos(this.cameraAngleH));
        const right = new THREE.Vector3(Math.cos(this.cameraAngleH), 0, -Math.sin(this.cameraAngleH));
        this.cameraTarget.addScaledVector(right, -deltaX * panSpeed);
        this.cameraTarget.addScaledVector(forward, deltaY * panSpeed);
        this.updateCameraPosition();
      }

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  }

  private onPointerUp(_e: PointerEvent) {
    if (!this.isDraggingFurniture && this.pointerButton === 0) {
      const clickedPiece = this.getFurnitureUnderMouse();
      if (!clickedPiece && this.hoveredFloorCoord) {
        // Clicked bare floor
        this.selectedFurnitureId = null;
        this.setSelection(null);
        if (this.callbacks.onFurnitureSelect) {
          this.callbacks.onFurnitureSelect(null);
        }
        if (this.callbacks.onFloorClick) {
          this.callbacks.onFloorClick(this.hoveredFloorCoord.x, this.hoveredFloorCoord.z);
        }
      }
    }

    this.isPointerDown = false;
    this.isDraggingFurniture = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance * zoomFactor, 4, 30);
    this.updateCameraPosition();
  }

  private onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private getFloorIntersection(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.floorMesh);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  private getFurnitureUnderMouse(): PlacedFurniture | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    for (const [, group] of this.furnitureMeshes) {
      const intersects = this.raycaster.intersectObjects(group.children, true);
      if (intersects.length > 0) {
        return group.userData.furniture as PlacedFurniture;
      }
    }
    return null;
  }

  // --- SELECTION & GHOST ---

  public setSelection(furniture: PlacedFurniture | null) {
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox = null;
    }

    if (!furniture) {
      this.selectedFurnitureId = null;
      return;
    }

    this.selectedFurnitureId = furniture.instanceId;
    const group = this.furnitureMeshes.get(furniture.instanceId);
    if (!group) return;

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const selGeo = new THREE.BoxGeometry(
      Math.max(size.x + 0.1, 0.4),
      Math.max(size.y + 0.1, 0.4),
      Math.max(size.z + 0.1, 0.4)
    );
    const selMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    this.selectionBox = new THREE.Mesh(selGeo, selMat);
    this.selectionBox.position.copy(center);
    this.scene.add(this.selectionBox);
  }

  public updateGhostPreview(defId: string | null) {
    if (!defId) {
      if (this.ghostMesh) {
        this.scene.remove(this.ghostMesh);
        this.ghostMesh = null;
      }
      return;
    }

    const def = FURNITURE_MAP.get(defId);
    if (!def) return;

    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }

    const ghost = new THREE.Group();
    const [w, h, d] = def.dimensions;
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = h / 2;
    ghost.add(box);

    this.ghostMesh = ghost;
    this.scene.add(ghost);

    if (this.hoveredFloorCoord) {
      ghost.position.set(this.hoveredFloorCoord.x, 0.02, this.hoveredFloorCoord.z);
    } else {
      ghost.visible = false;
    }
  }

  // --- REAL-TIME PROCEDURAL 3D FURNITURE MESHES ---

  public syncFurniture(furnitureList: PlacedFurniture[], activeFloor?: number) {
    const visibleList = activeFloor
      ? furnitureList.filter((f) => {
          // Lifts, elevator shafts, stairs and escalators span all floors
          if (
            f.defId === 'furn_panoramic_elevator' ||
            f.defId === 'furn_passenger_lift' ||
            f.defId === 'furn_spiral_staircase' ||
            f.defId === 'furn_floating_stairs' ||
            f.defId === 'furn_escalator'
          ) {
            return true;
          }
          return !f.floorNumber || f.floorNumber === activeFloor;
        })
      : furnitureList;

    const activeIds = new Set(visibleList.map((f) => f.instanceId));

    this.furnitureMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.furnitureMeshes.delete(id);
      }
    });

    visibleList.forEach((f) => {
      let group = this.furnitureMeshes.get(f.instanceId);
      if (!group) {
        group = this.buildFurnitureMesh(f);
        group.userData = { furniture: f };
        this.scene.add(group);
        this.furnitureMeshes.set(f.instanceId, group);
      } else {
        const prev = group.userData.furniture as PlacedFurniture;
        if (prev.color !== f.color || prev.finish !== f.finish) {
          this.scene.remove(group);
          group = this.buildFurnitureMesh(f);
          group.userData = { furniture: f };
          this.scene.add(group);
          this.furnitureMeshes.set(f.instanceId, group);
        }
      }

      group.position.set(f.x, f.y || 0, f.z);
      group.rotation.y = (f.rotation * Math.PI) / 180;
    });
  }

  private buildFurnitureMesh(f: PlacedFurniture): THREE.Group {
    const group = new THREE.Group();
    const def = FURNITURE_MAP.get(f.defId);
    if (!def) return group;

    const mainColor = new THREE.Color(f.color || def.colorOptions[0] || '#475569');
    const [w, h, d] = def.dimensions;

    switch (def.id) {
      case 'furn_sofa_sectional': {
        // Main sofa base
        const baseGeo = new THREE.BoxGeometry(w * 0.98, 0.25, d * 0.5);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.125, -d * 0.25);
        group.add(base);

        // Seat cushions
        const cushionGeo = new THREE.BoxGeometry(w * 0.96, 0.22, d * 0.48);
        const cushionMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const cushions = new THREE.Mesh(cushionGeo, cushionMat);
        cushions.position.set(0, 0.32, -d * 0.25);
        group.add(cushions);

        // Chaise lounge extension
        const chaiseGeo = new THREE.BoxGeometry(w * 0.35, 0.44, d * 0.5);
        const chaise = new THREE.Mesh(chaiseGeo, cushionMat);
        chaise.position.set(w * 0.3, 0.22, d * 0.22);
        group.add(chaise);

        // Backrest
        const backGeo = new THREE.BoxGeometry(w * 0.98, h * 0.6, 0.22);
        const back = new THREE.Mesh(backGeo, cushionMat);
        back.position.set(0, h * 0.6, -d * 0.45);
        group.add(back);
        break;
      }

      case 'furn_armchair': {
        // Cozy velvet armchair
        const seatGeo = new THREE.BoxGeometry(w * 0.9, 0.28, d * 0.9);
        const seatMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.y = 0.28;
        group.add(seat);

        // Curved back
        const backGeo = new THREE.BoxGeometry(w * 0.9, h * 0.65, 0.18);
        const back = new THREE.Mesh(backGeo, seatMat);
        back.position.set(0, h * 0.6, -d * 0.36);
        group.add(back);

        // Armrests
        const armGeo = new THREE.BoxGeometry(0.14, 0.35, d * 0.85);
        const armL = new THREE.Mesh(armGeo, seatMat);
        armL.position.set(-w * 0.42, 0.45, 0);
        const armR = new THREE.Mesh(armGeo, seatMat);
        armR.position.set(w * 0.42, 0.45, 0);
        group.add(armL, armR);

        // Brass legs
        const legGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.25, 6);
        const legMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
        [[-w * 0.38, -d * 0.38], [w * 0.38, -d * 0.38], [-w * 0.38, d * 0.38], [w * 0.38, d * 0.38]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(lx, 0.125, lz);
          group.add(leg);
        });
        break;
      }

      case 'furn_coffee_table': {
        // Glass top + wood frame
        const glassGeo = new THREE.BoxGeometry(w, 0.04, d);
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = h;
        group.add(glass);

        // Wooden base
        const baseGeo = new THREE.BoxGeometry(w * 0.8, 0.06, d * 0.8);
        const woodMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const base = new THREE.Mesh(baseGeo, woodMat);
        base.position.y = 0.12;
        group.add(base);

        // 4 Legs
        const legGeo = new THREE.BoxGeometry(0.06, h, 0.06);
        [[-w * 0.42, -d * 0.42], [w * 0.42, -d * 0.42], [-w * 0.42, d * 0.42], [w * 0.42, d * 0.42]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(lx, h / 2, lz);
          group.add(leg);
        });
        break;
      }

      case 'furn_tv_media': {
        // Floating slatted credenza
        const credGeo = new THREE.BoxGeometry(w, 0.45, d);
        const credMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const cred = new THREE.Mesh(credGeo, credMat);
        cred.position.y = 0.225;
        group.add(cred);

        // 75" TV Screen
        const tvGeo = new THREE.BoxGeometry(w * 0.88, h * 0.65, 0.05);
        const tvMat = new THREE.MeshLambertMaterial({ color: 0x020617 });
        const tv = new THREE.Mesh(tvGeo, tvMat);
        tv.position.set(0, h * 0.72, 0);
        group.add(tv);

        // Glowing TV display
        const displayGeo = new THREE.PlaneGeometry(w * 0.84, h * 0.6);
        const displayMat = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
        });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, h * 0.72, 0.035);
        group.add(display);
        break;
      }

      case 'furn_bed_queen': {
        // Queen platform bed frame
        const frameGeo = new THREE.BoxGeometry(w, 0.32, d);
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.16;
        group.add(frame);

        // Plush mattress & duvet
        const matGeo = new THREE.BoxGeometry(w * 0.94, 0.28, d * 0.92);
        const matMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const mattress = new THREE.Mesh(matGeo, matMat);
        mattress.position.set(0, 0.42, d * 0.02);
        group.add(mattress);

        // Pillows
        const pilGeo = new THREE.BoxGeometry(w * 0.4, 0.14, d * 0.2);
        const pilMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const pilL = new THREE.Mesh(pilGeo, pilMat);
        pilL.position.set(-w * 0.23, 0.58, -d * 0.32);
        const pilR = new THREE.Mesh(pilGeo, pilMat);
        pilR.position.set(w * 0.23, 0.58, -d * 0.32);
        group.add(pilL, pilR);

        // Headboard
        const headGeo = new THREE.BoxGeometry(w * 1.05, h, 0.18);
        const headMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, h / 2, -d * 0.48);
        group.add(head);
        break;
      }

      case 'furn_kitchen_island': {
        // Marble island
        const islandGeo = new THREE.BoxGeometry(w, h, d);
        const islandMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.y = h / 2;
        group.add(island);

        // Induction cooktop
        const stoveGeo = new THREE.PlaneGeometry(0.7, 0.5);
        const stoveMat = new THREE.MeshLambertMaterial({ color: 0x020617 });
        const stove = new THREE.Mesh(stoveGeo, stoveMat);
        stove.rotation.x = -Math.PI / 2;
        stove.position.set(-0.4, h + 0.01, 0);
        group.add(stove);

        // Faucet
        const faucetGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const chromeMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const faucet = new THREE.Mesh(faucetGeo, chromeMat);
        faucet.position.set(0.5, h + 0.15, 0);
        group.add(faucet);
        break;
      }

      case 'furn_executive_desk': {
        // Desktop
        const topGeo = new THREE.BoxGeometry(w, 0.08, d);
        const topMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 0.74;
        group.add(top);

        // Steel legs
        const legMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, d * 0.8), legMat);
        legL.position.set(-w * 0.44, 0.37, 0);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, d * 0.8), legMat);
        legR.position.set(w * 0.44, 0.37, 0);
        group.add(legL, legR);

        // Dual 34" curved monitors
        const screenGeo = new THREE.BoxGeometry(0.7, 0.35, 0.04);
        const screenMat = new THREE.MeshLambertMaterial({ color: 0x020617, emissive: 0x38bdf8, emissiveIntensity: 0.6 });
        const m1 = new THREE.Mesh(screenGeo, screenMat);
        m1.position.set(-0.38, 1.05, -0.15);
        m1.rotation.y = 0.15;
        const m2 = new THREE.Mesh(screenGeo, screenMat);
        m2.position.set(0.38, 1.05, -0.15);
        m2.rotation.y = -0.15;
        group.add(m1, m2);
        break;
      }

      case 'furn_fiddle_leaf': {
        // Ceramic pot
        const potGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.45, 12);
        const potMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.y = 0.225;
        group.add(pot);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.1, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.75;
        group.add(trunk);

        // Broad green leaves
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
        [0.6, 0.85, 1.1, 1.3].forEach((ly, i) => {
          const leafGeo = new THREE.DodecahedronGeometry(0.28);
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.scale.set(1.2, 0.5, 0.9);
          leaf.position.set(Math.sin(i * 1.5) * 0.18, ly, Math.cos(i * 1.5) * 0.18);
          group.add(leaf);
        });
        break;
      }

      case 'furn_floor_lamp': {
        // Base
        const bGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.06, 12);
        const bMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = 0.03;
        group.add(bMesh);

        // Tall pole
        const pGeo = new THREE.CylinderGeometry(0.02, 0.02, h, 8);
        const pole = new THREE.Mesh(pGeo, bMat);
        pole.position.y = h / 2;
        group.add(pole);

        // Glowing lamp shade
        const shadeGeo = new THREE.ConeGeometry(0.28, 0.35, 12, 1, true);
        const shadeMat = new THREE.MeshLambertMaterial({
          color: 0xfef08a,
          emissive: 0xfef08a,
          emissiveIntensity: 0.9,
        });
        const shade = new THREE.Mesh(shadeGeo, shadeMat);
        shade.position.y = h;
        group.add(shade);
        break;
      }

      // --- LIFTS & CIRCULATION (Planner 5D Real-Time Elevators & Stairs) ---
      case 'furn_panoramic_elevator': {
        // 4 Corner structural steel columns
        const colMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
        const colGeo = new THREE.BoxGeometry(0.08, h, 0.08);
        [
          [-w / 2 + 0.04, -d / 2 + 0.04],
          [w / 2 - 0.04, -d / 2 + 0.04],
          [-w / 2 + 0.04, d / 2 - 0.04],
          [w / 2 - 0.04, d / 2 - 0.04],
        ].forEach(([cx, cz]) => {
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(cx, h / 2, cz);
          group.add(col);
        });

        // Glass shaft enclosure (translucent sky-blue)
        const glassMat = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
        });
        const glassGeo = new THREE.BoxGeometry(w * 0.95, h, d * 0.95);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = h / 2;
        group.add(glass);

        // Machinery / Motor Housing on top
        const motorGeo = new THREE.BoxGeometry(w * 0.8, 0.25, d * 0.8);
        const motorMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const motor = new THREE.Mesh(motorGeo, motorMat);
        motor.position.y = h + 0.125;
        group.add(motor);

        // Animated Glass Elevator Cabin
        const cabGroup = new THREE.Group();
        const cabFloorGeo = new THREE.BoxGeometry(w * 0.8, 0.08, d * 0.8);
        const cabFloor = new THREE.Mesh(cabFloorGeo, new THREE.MeshLambertMaterial({ color: 0x0f172a }));
        cabGroup.add(cabFloor);

        const cabCeil = new THREE.Mesh(cabFloorGeo, new THREE.MeshLambertMaterial({ color: 0x1e293b }));
        cabCeil.position.y = 1.6;
        cabGroup.add(cabCeil);

        const cabWallGeo = new THREE.BoxGeometry(w * 0.78, 1.5, d * 0.78);
        const cabWall = new THREE.Mesh(cabWallGeo, glassMat);
        cabWall.position.y = 0.8;
        cabGroup.add(cabWall);

        // Floor indicator lamp inside cab
        const indGeo = new THREE.PlaneGeometry(0.2, 0.1);
        const indMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ind = new THREE.Mesh(indGeo, indMat);
        ind.position.set(0, 1.4, d * 0.4);
        cabGroup.add(ind);

        group.add(cabGroup);

        // Real-time animated elevator travel up and down shaft
        this.animatedProps.push({
          mesh: cabGroup,
          update: (_, time) => {
            cabGroup.position.y = 0.15 + (Math.sin(time * 1.6) * 0.5 + 0.5) * (h - 1.8);
          },
        });
        break;
      }

      case 'furn_passenger_lift': {
        // Enclosed elevator shaft
        const shaftGeo = new THREE.BoxGeometry(w, h, d);
        const shaftMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.position.y = h / 2;
        group.add(shaft);

        // Brushed Stainless Elevator Doors
        const doorGeo = new THREE.BoxGeometry(w * 0.65, 2.1, 0.05);
        const doorMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
        const doorL = new THREE.Mesh(doorGeo, doorMat);
        doorL.position.set(0, 1.05, d / 2 + 0.02);
        group.add(doorL);

        // Center split line
        const seamGeo = new THREE.PlaneGeometry(0.02, 2.1);
        const seamMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const seam = new THREE.Mesh(seamGeo, seamMat);
        seam.position.set(0, 1.05, d / 2 + 0.05);
        group.add(seam);

        // Floor display LED indicator above door
        const ledGeo = new THREE.PlaneGeometry(0.3, 0.12);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, 2.3, d / 2 + 0.05);
        group.add(led);

        // Call button
        const btnGeo = new THREE.PlaneGeometry(0.08, 0.15);
        const btnMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(w * 0.42, 1.1, d / 2 + 0.05);
        group.add(btn);
        break;
      }

      case 'furn_spiral_staircase': {
        // Central structural pillar
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, h, 12);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = h / 2;
        group.add(pole);

        // 12 Spiral steps
        const stepCount = 12;
        const stepMat = new THREE.MeshLambertMaterial({ color: mainColor });
        for (let i = 0; i < stepCount; i++) {
          const angle = (i / stepCount) * Math.PI * 1.8;
          const y = (i / stepCount) * (h - 0.2) + 0.1;
          const stepGeo = new THREE.BoxGeometry(w * 0.45, 0.05, 0.22);
          const step = new THREE.Mesh(stepGeo, stepMat);
          step.position.set(Math.cos(angle) * (w * 0.24), y, Math.sin(angle) * (d * 0.24));
          step.rotation.y = -angle;
          group.add(step);

          // Outer baluster rod
          const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6);
          const rodMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
          const rod = new THREE.Mesh(rodGeo, rodMat);
          rod.position.set(Math.cos(angle) * (w * 0.45), y + 0.42, Math.sin(angle) * (d * 0.45));
          group.add(rod);
        }
        break;
      }

      case 'furn_floating_stairs': {
        // Modern Cantilevered Floating Wood & Glass Stairs
        const steps = 8;
        const treadMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const glassRailingMat = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.4,
        });

        for (let i = 0; i < steps; i++) {
          const progress = i / steps;
          const x = -w / 2 + progress * w;
          const y = progress * h;
          const z = 0;

          const treadGeo = new THREE.BoxGeometry(0.35, 0.08, d * 0.85);
          const tread = new THREE.Mesh(treadGeo, treadMat);
          tread.position.set(x, y + 0.05, z);
          group.add(tread);
        }

        // Structural Glass balustrade
        const railGeo = new THREE.BoxGeometry(w * 0.95, 0.9, 0.04);
        const rail = new THREE.Mesh(railGeo, glassRailingMat);
        rail.position.set(0, h * 0.5, d * 0.4);
        group.add(rail);

        // Handrail cap
        const capGeo = new THREE.BoxGeometry(w * 0.98, 0.06, 0.08);
        const capMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, h * 0.5 + 0.45, d * 0.4);
        group.add(cap);
        break;
      }

      case 'furn_escalator': {
        // Angled escalator truss
        const trussGeo = new THREE.BoxGeometry(w * 0.9, 0.35, d * 0.95);
        const trussMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const truss = new THREE.Mesh(trussGeo, trussMat);
        truss.position.set(0, h / 2, 0);
        truss.rotation.x = 0.35;
        group.add(truss);

        // Moving Steps
        for (let i = 0; i < 7; i++) {
          const stepY = (i / 7) * h + 0.1;
          const stepZ = (i / 7 - 0.5) * (d * 0.85);
          const sGeo = new THREE.BoxGeometry(w * 0.7, 0.12, 0.3);
          const sMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
          const step = new THREE.Mesh(sGeo, sMat);
          step.position.set(0, stepY, stepZ);
          group.add(step);
        }

        // Glass Balustrades
        const balGeo = new THREE.BoxGeometry(0.04, 0.8, d * 0.9);
        const balMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
        const b1 = new THREE.Mesh(balGeo, balMat);
        b1.position.set(-w * 0.42, h / 2 + 0.4, 0);
        b1.rotation.x = 0.35;
        const b2 = new THREE.Mesh(balGeo, balMat);
        b2.position.set(w * 0.42, h / 2 + 0.4, 0);
        b2.rotation.x = 0.35;
        group.add(b1, b2);
        break;
      }

      case 'furn_interior_wall': {
        // Full height room partition wall
        const wallGeo = new THREE.BoxGeometry(w, h, d);
        const wallMat = new THREE.MeshLambertMaterial({ color: mainColor });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.y = h / 2;
        group.add(wall);

        // Skirting board trim at bottom
        const skirtGeo = new THREE.BoxGeometry(w * 1.01, 0.12, d * 1.08);
        const skirtMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const skirt = new THREE.Mesh(skirtGeo, skirtMat);
        skirt.position.y = 0.06;
        group.add(skirt);
        break;
      }

      case 'furn_glass_partition': {
        // Floor to ceiling acoustic glass wall
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const frameGeo = new THREE.BoxGeometry(w, h, d);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = h / 2;
        group.add(frame);

        const glassGeo = new THREE.BoxGeometry(w * 0.94, h * 0.92, d * 0.6);
        const glassMat = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.3,
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = h / 2;
        group.add(glass);

        // Frosted privacy horizontal band
        const bandGeo = new THREE.BoxGeometry(w * 0.94, 0.45, d * 0.7);
        const bandMat = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.45,
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = h * 0.45;
        group.add(band);
        break;
      }

      case 'furn_double_doors': {
        // Outer Door Frame
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const fGeo = new THREE.BoxGeometry(w, h, d);
        const frame = new THREE.Mesh(fGeo, frameMat);
        frame.position.y = h / 2;
        group.add(frame);

        // Glass Doors Leaves
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
        const leafGeo = new THREE.BoxGeometry(w * 0.44, h * 0.92, d * 0.4);
        const leaf1 = new THREE.Mesh(leafGeo, leafMat);
        leaf1.position.set(-w * 0.23, h / 2, 0);
        const leaf2 = new THREE.Mesh(leafGeo, leafMat);
        leaf2.position.set(w * 0.23, h / 2, 0);
        group.add(leaf1, leaf2);

        // Vertical Bar Handles
        const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
        const handleMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const h1 = new THREE.Mesh(handleGeo, handleMat);
        h1.position.set(-0.06, h * 0.45, d * 0.3);
        const h2 = new THREE.Mesh(handleGeo, handleMat);
        h2.position.set(0.06, h * 0.45, d * 0.3);
        group.add(h1, h2);
        break;
      }

      default: {
        // Fallback volumetric furniture box
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshLambertMaterial({ color: mainColor });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = h / 2;
        group.add(mesh);
        break;
      }
    }

    return group;
  }

  // --- ROOM OCCUPANTS (LIVING CITIZENS) ---

  public syncOccupants(occupants: BuildingInterior['occupants']) {
    const activeIds = new Set(occupants.map((o) => o.id));

    this.occupantMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.occupantMeshes.delete(id);
      }
    });

    occupants.forEach((occ, idx) => {
      let group = this.occupantMeshes.get(occ.id);
      if (!group) {
        group = this.buildCitizenMesh(idx);
        group.userData = { occupant: occ };
        this.scene.add(group);
        this.occupantMeshes.set(occ.id, group);
      }

      group.position.set(occ.x, 0, occ.z);
    });
  }

  private buildCitizenMesh(colorSeed: number = 0): THREE.Group {
    const group = new THREE.Group();
    const colors = [0x38bdf8, 0xf472b6, 0x10b981, 0xf59e0b, 0x818cf8];
    const shirtColor = colors[colorSeed % colors.length];

    // Torso / Shirt
    const torsoGeo = new THREE.BoxGeometry(0.35, 0.45, 0.22);
    const torsoMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.65;
    group.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xfcd34d });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.98;
    group.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.24, 0.12, 0.24);
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.08;
    group.add(hair);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.42, 0.15);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.09, 0.21, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.09, 0.21, 0);
    group.add(legL, legR);

    return group;
  }

  // --- MAIN LOOP ---

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    if (Math.abs(this.cameraAngleV - this.targetCameraAngleV) > 0.005) {
      this.cameraAngleV += (this.targetCameraAngleV - this.cameraAngleV) * 0.12;
      this.updateCameraPosition();
    }

    this.animatedProps.forEach((p) => p.update(dt, time));

    // Gentle occupant breathing / idle animation
    let i = 0;
    this.occupantMeshes.forEach((mesh) => {
      mesh.position.y = Math.sin(time * 3 + i++) * 0.02;
    });

    this.renderer.render(this.scene, this.camera);
  };

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
