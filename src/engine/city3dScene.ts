/**
 * Three.js Realistic PBR Architectural Scene Engine for UrbanCraft
 * Realistic materials, soft shadows, physical sun & sky, and Planner 5D-grade navigation.
 */
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { PlacedBuilding, TimeOfDay, ViewPerspective, CutawayFloor, CameraPreset, RenderQuality } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { VEHICLE_MAP } from '../data/vehiclesCatalog';
import { getRoadNeighbors, classifyRoadJunction, isRoadBuilding } from '../utils/cityValidation';
import { buildPBRMaterialLibrary, PBRMaterialLibrary } from './pbrMaterials';

export interface SceneInteractionCallbacks {
  onTileHover?: (coord: { x: number; z: number } | null) => void;
  onTileClick?: (coord: { x: number; z: number }) => void;
  onBuildingClick?: (building: PlacedBuilding) => void;
  onBuildingMove?: (instanceId: string, x: number, z: number, y?: number) => void;
  onCameraAngleChange?: (angleH: number, angleV: number) => void;
  onContextLost?: () => void;
  onFirstPersonExit?: () => void;
}

export class City3DScene {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // Grid constants
  public readonly gridSize: number = 26;
  public readonly tileSize: number = 2.0;

  // Materials & Quality
  public materials: PBRMaterialLibrary;
  private renderQuality: RenderQuality = 'ultra';

  // Cutaway Floor (All / Floor 1 / Floor 2 / Floor 3 / Roof)
  private cutawayFloor: CutawayFloor = 'all';

  // Camera targets & lerping
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private cameraDistance: number = 42;
  private cameraAngleH: number = Math.PI / 4; // 45 deg
  private cameraAngleV: number = 0.85; // ~48 deg elevation
  private targetCameraAngleV: number = 0.85;
  private is2DMode: boolean = false;

  // First-Person Street Exploration
  private isFirstPersonMode: boolean = false;
  private firstPersonPos: THREE.Vector3 = new THREE.Vector3(0, 1.7, 0);
  private firstPersonYaw: number = 0;
  private firstPersonPitch: number = 0;
  private activeKeys: Set<string> = new Set();
  private currentBuildings: PlacedBuilding[] = [];

  // Mouse interaction state
  private isPointerDown: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private pointerButton: number = 0; // 0=left, 1=middle, 2=right
  private isDraggingToPan: boolean = false;

  // Lighting
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private currentTimeOfDay: TimeOfDay = 'day';

  // Scene Objects
  private gridMesh: THREE.GridHelper;
  private groundMesh: THREE.Mesh;
  private buildingMeshes: Map<string, THREE.Group> = new Map();
  private animatedProps: Array<{ mesh: THREE.Object3D; update: (dt: number, time: number) => void }> = [];
  private ghostMesh: THREE.Group | null = null;
  private selectionBox: THREE.Mesh | null = null;
  private transformControls: TransformControls | null = null;
  public isTransforming: boolean = false;
  private selectedBuildingInstanceId: string | null = null;

  // Vehicles
  private vehicleGroup: THREE.Group = new THREE.Group();
  private vehicles: Array<{
    mesh: THREE.Group;
    x: number;
    z: number;
    speed: number;
    targetCoord: { x: number; z: number };
    heading: number;
  }> = [];

  // Callbacks
  private callbacks: SceneInteractionCallbacks = {};
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  // Hover state
  private hoveredTile: { x: number; z: number } | null = null;

  constructor(container: HTMLElement, callbacks: SceneInteractionCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Build PBR Materials Library
    this.materials = buildPBRMaterialLibrary();

    // 2. Scene setup with realistic atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0c4e2);
    this.scene.fog = new THREE.FogExp2(0xa0c4e2, 0.005);

    // 3. Camera setup
    const width = Math.max(container.clientWidth || 800, 320);
    const height = Math.max(container.clientHeight || 600, 240);
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 400);
    this.updateCameraPosition();

    // 4. Photorealistic PBR Renderer with Soft Shadows & ACES Filmic Tone Mapping
    const canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      depth: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // Context loss handler
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost, notifying fallback handler');
      if (this.callbacks.onContextLost) {
        this.callbacks.onContextLost();
      }
    });

    // 5. Raycaster & Mouse
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    // 6. Natural Daylight Lighting Rig
    this.ambientLight = new THREE.AmbientLight(0xd9ebfb, 0.75);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.85);
    this.scene.add(this.hemiLight);

    // Directional Sun with High-Resolution Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(38, 55, 32);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 180;
    const d = 38;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // 7. Ground with Realistic Landscape Grass & Shadow Receiving
    const groundSize = this.gridSize * this.tileSize;
    const groundGeo = new THREE.PlaneGeometry(groundSize * 2.0, groundSize * 2.0);
    this.groundMesh = new THREE.Mesh(groundGeo, this.materials.grass);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.01;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Precision Architectural CAD Grid
    this.gridMesh = new THREE.GridHelper(groundSize, this.gridSize, 0x475569, 0x334155);
    this.gridMesh.position.y = 0.02;
    (this.gridMesh.material as THREE.Material).transparent = true;
    (this.gridMesh.material as THREE.Material).opacity = 0.45;
    this.scene.add(this.gridMesh);

    // Add vehicles group
    this.scene.add(this.vehicleGroup);

    // 7.5 TransformControls setup for 3D translation & manipulation
    try {
      this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
      this.transformControls.setMode('translate');
      this.transformControls.setTranslationSnap(1.0); // 1 meter snapping
      this.transformControls.size = 0.85;
      const helper = (this.transformControls as any).getHelper ? (this.transformControls as any).getHelper() : this.transformControls;
      this.scene.add(helper);

      this.transformControls.addEventListener('dragging-changed', (event: any) => {
        this.isTransforming = !!event.value;
        if (!event.value && this.selectedBuildingInstanceId) {
          const group = this.buildingMeshes.get(this.selectedBuildingInstanceId);
          if (group) {
            const coord = this.worldToCoord(group.position.x, group.position.z);
            if (this.callbacks.onBuildingMove) {
              this.callbacks.onBuildingMove(this.selectedBuildingInstanceId, coord.x, coord.z, group.position.y);
            }
          }
        }
      });

      this.transformControls.addEventListener('change', () => {
        if (this.isTransforming && this.selectedBuildingInstanceId) {
          const group = this.buildingMeshes.get(this.selectedBuildingInstanceId);
          if (group) {
            const coord = this.worldToCoord(group.position.x, group.position.z);
            if (this.selectionBox) {
              this.selectionBox.position.set(group.position.x, this.selectionBox.position.y, group.position.z);
            }
            if (this.callbacks.onTileHover) {
              this.callbacks.onTileHover(coord);
            }
          }
        }
      });
    } catch (err) {
      console.warn('TransformControls setup error:', err);
    }

    // Event listeners
    this.bindEvents();

    // Start render loop
    this.animate();
  }

  // --- CAMERA & VIEWPORT ---

  private updateCameraPosition() {
    const x = this.cameraTarget.x + this.cameraDistance * Math.cos(this.cameraAngleH) * Math.cos(this.cameraAngleV);
    const y = this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraAngleV);
    const z = this.cameraTarget.z + this.cameraDistance * Math.sin(this.cameraAngleH) * Math.cos(this.cameraAngleV);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);

    if (this.callbacks.onCameraAngleChange) {
      this.callbacks.onCameraAngleChange(this.cameraAngleH, this.cameraAngleV);
    }
  }

  public setViewPerspective(mode: ViewPerspective) {
    this.is2DMode = mode === '2d_blueprint';
    if (this.is2DMode) {
      this.targetCameraAngleV = Math.PI / 2 - 0.02; // almost 90 deg top-down
      this.scene.background = new THREE.Color(0x0b1329); // deep blueprint navy
    } else {
      this.targetCameraAngleV = 0.85; // isometric ~48 deg
      this.applyTimeOfDay(this.currentTimeOfDay);
    }
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.currentTimeOfDay = time;
    this.applyTimeOfDay(time);
  }

  public setCutawayFloor(floor: CutawayFloor) {
    this.cutawayFloor = floor;
    this.applyCutaway();
  }

  public getCutawayFloor(): CutawayFloor {
    return this.cutawayFloor;
  }

  private applyCutaway() {
    this.buildingMeshes.forEach((group) => {
      group.traverse((child) => {
        if (child.userData?.isRoof) {
          child.visible = this.cutawayFloor === 'all';
        }
        if (child.userData?.floorLevel !== undefined) {
          if (this.cutawayFloor === 'all') {
            child.visible = true;
          } else {
            child.visible = child.userData.floorLevel <= this.cutawayFloor;
          }
        }
        if (child.userData?.isInteriorFurniture || child.userData?.isInteriorFloor) {
          child.visible = this.cutawayFloor !== 'all';
        }
      });
    });
  }

  public focusOnObject(coord: { x: number; z: number }) {
    const world = this.coordToWorld(coord.x, coord.z);
    this.cameraTarget.set(world.x, 1.2, world.z);
    this.cameraDistance = 22;
    this.updateCameraPosition();
  }

  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'perspective':
        this.cameraAngleH = 0.62;
        this.cameraAngleV = 0.54;
        this.cameraDistance = 36;
        break;
      case 'top':
        this.cameraAngleH = 0;
        this.cameraAngleV = Math.PI / 2 - 0.01;
        this.cameraDistance = 45;
        break;
      case 'front':
        this.cameraAngleH = 0;
        this.cameraAngleV = 0.12;
        this.cameraDistance = 35;
        break;
      case 'side':
        this.cameraAngleH = Math.PI / 2;
        this.cameraAngleV = 0.12;
        this.cameraDistance = 35;
        break;
      case 'iso':
        this.cameraAngleH = Math.PI / 4;
        this.cameraAngleV = 0.78;
        this.cameraDistance = 42;
        break;
      case 'orbit':
        this.cameraAngleH = Math.PI / 4;
        this.cameraAngleV = 0.65;
        this.cameraDistance = 38;
        break;
    }
    this.updateCameraPosition();
  }

  public resetCamera() {
    this.cameraTarget.set(0, 0, 0);
    this.cameraDistance = 42;
    this.cameraAngleH = Math.PI / 4;
    this.cameraAngleV = 0.78;
    this.updateCameraPosition();
  }

  public setRenderQuality(quality: RenderQuality) {
    this.renderQuality = quality;
    if (quality === 'performance') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1);
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }
  }

  public setSunExposure(exposure: number) {
    this.renderer.toneMappingExposure = exposure;
  }

  private applyTimeOfDay(time: TimeOfDay) {
    if (this.is2DMode) {
      this.scene.background = new THREE.Color(0x0b1329);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0x0b1329);
      return;
    }

    if (time === 'day') {
      const skyCol = new THREE.Color(0xa0c4e2);
      this.scene.background = skyCol;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.copy(skyCol);
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 2.2;
      this.sunLight.position.set(38, 55, 32);
      this.ambientLight.color.setHex(0xd9ebfb);
      this.ambientLight.intensity = 0.75;
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.85;
      this.renderer.toneMappingExposure = 1.05;
      this.updateWindowGlow(false);
    } else if (time === 'sunset') {
      const sunsetCol = new THREE.Color(0x38222b);
      this.scene.background = sunsetCol;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.copy(sunsetCol);
      this.sunLight.color.setHex(0xffa257);
      this.sunLight.intensity = 1.8;
      this.sunLight.position.set(50, 18, 12);
      this.ambientLight.color.setHex(0xf472b6);
      this.ambientLight.intensity = 0.55;
      this.hemiLight.color.setHex(0xfda4af);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.65;
      this.renderer.toneMappingExposure = 0.95;
      this.updateWindowGlow(true);
    } else if (time === 'night') {
      const nightCol = new THREE.Color(0x090d16);
      this.scene.background = nightCol;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.copy(nightCol);
      this.sunLight.color.setHex(0x93c5fd);
      this.sunLight.intensity = 0.55;
      this.sunLight.position.set(-25, 35, -20);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.45;
      this.renderer.toneMappingExposure = 0.75;
      this.updateWindowGlow(true);
    }
  }

  private updateWindowGlow(glowOn: boolean) {
    this.buildingMeshes.forEach((group) => {
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).userData?.isWindow) {
          const mat = (child as THREE.Mesh).material as THREE.MeshLambertMaterial;
          if (mat && mat.emissive) {
            mat.emissive.setHex(glowOn ? 0xfef08a : 0x000000);
          }
        }
      });
    });
  }

  // --- EVENT HANDLING & CONTROLS ---

  private boundKeyDown = this.onKeyDown.bind(this);
  private boundKeyUp = this.onKeyUp.bind(this);

  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    el.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    this.activeKeys.add(e.key.toLowerCase());
    if (e.key === 'Escape' && this.isFirstPersonMode) {
      this.setFirstPersonMode(false);
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.activeKeys.delete(e.key.toLowerCase());
  }

  public setFirstPersonMode(active: boolean, startCoord?: { x: number; z: number }) {
    this.isFirstPersonMode = active;
    if (active) {
      if (startCoord) {
        const w = this.coordToWorld(startCoord.x, startCoord.z);
        this.firstPersonPos.set(w.x, 1.7, w.z);
      } else {
        this.firstPersonPos.set(this.cameraTarget.x, 1.7, this.cameraTarget.z);
      }
      this.firstPersonPitch = 0;
      this.camera.position.set(this.firstPersonPos.x, 1.7, this.firstPersonPos.z);
      this.camera.rotation.set(0, this.firstPersonYaw, 0, 'YXZ');
    } else {
      this.updateCameraPosition();
      if (this.callbacks.onFirstPersonExit) {
        this.callbacks.onFirstPersonExit();
      }
    }
  }

  public getFirstPersonMode(): boolean {
    return this.isFirstPersonMode;
  }

  private onPointerDown(e: PointerEvent) {
    if (this.isTransforming) return;
    this.isPointerDown = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.pointerButton = e.button;
    this.isDraggingToPan = false;
  }

  private onPointerMove(e: PointerEvent) {
    if (this.isTransforming) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isFirstPersonMode) {
      if (this.isPointerDown) {
        const deltaX = e.clientX - this.lastPointerX;
        const deltaY = e.clientY - this.lastPointerY;
        this.firstPersonYaw -= deltaX * 0.005;
        this.firstPersonPitch = THREE.MathUtils.clamp(
          this.firstPersonPitch - deltaY * 0.005,
          -Math.PI / 3,
          Math.PI / 3
        );
        this.camera.rotation.set(this.firstPersonPitch, this.firstPersonYaw, 0, 'YXZ');
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
      return;
    }

    if (this.isPointerDown) {
      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        this.isDraggingToPan = true;
      }

      // Middle button or right button OR left button with Alt/Shift = Orbit
      if (this.pointerButton === 2 || (this.pointerButton === 0 && e.shiftKey)) {
        this.cameraAngleH -= deltaX * 0.007;
        if (!this.is2DMode) {
          this.cameraAngleV = THREE.MathUtils.clamp(
            this.cameraAngleV + deltaY * 0.007,
            0.2,
            Math.PI / 2 - 0.05
          );
          this.targetCameraAngleV = this.cameraAngleV;
        }
        this.updateCameraPosition();
      } else if (this.pointerButton === 1 || (this.pointerButton === 0 && (e.ctrlKey || e.metaKey))) {
        // Pan ground target
        const panSpeed = 0.04 * (this.cameraDistance / 40);
        const forward = new THREE.Vector3(-Math.sin(this.cameraAngleH), 0, -Math.cos(this.cameraAngleH));
        const right = new THREE.Vector3(Math.cos(this.cameraAngleH), 0, -Math.sin(this.cameraAngleH));

        this.cameraTarget.addScaledVector(right, -deltaX * panSpeed);
        this.cameraTarget.addScaledVector(forward, deltaY * panSpeed);

        const bound = (this.gridSize * this.tileSize) / 1.5;
        this.cameraTarget.x = THREE.MathUtils.clamp(this.cameraTarget.x, -bound, bound);
        this.cameraTarget.z = THREE.MathUtils.clamp(this.cameraTarget.z, -bound, bound);

        this.updateCameraPosition();
      }

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }

    this.checkTileHover();
  }

  private onPointerUp(_e: PointerEvent) {
    if (this.isTransforming) {
      this.isPointerDown = false;
      this.isDraggingToPan = false;
      return;
    }
    if (!this.isDraggingToPan && this.pointerButton === 0) {
      const clickedCoord = this.getGridCoordFromMouse();
      if (clickedCoord) {
        const clickedBuilding = this.getBuildingAtCoord(clickedCoord.x, clickedCoord.z);
        if (clickedBuilding && this.callbacks.onBuildingClick) {
          this.callbacks.onBuildingClick(clickedBuilding);
        } else if (this.callbacks.onTileClick) {
          this.callbacks.onTileClick(clickedCoord);
        }
      }
    }
    this.isPointerDown = false;
    this.isDraggingToPan = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance * zoomFactor, 12, 95);
    this.updateCameraPosition();
  }

  private onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- GRID COORDINATE & RAYCASTING ---

  private getGridCoordFromMouse(): { x: number; z: number } | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.groundMesh);
    if (intersects.length > 0) {
      const pt = intersects[0].point;
      const halfSize = (this.gridSize * this.tileSize) / 2;
      const gx = Math.floor((pt.x + halfSize) / this.tileSize);
      const gz = Math.floor((pt.z + halfSize) / this.tileSize);
      if (gx >= 0 && gx < this.gridSize && gz >= 0 && gz < this.gridSize) {
        return { x: gx, z: gz };
      }
    }
    return null;
  }

  private checkTileHover() {
    const coord = this.getGridCoordFromMouse();
    if (!coord && this.hoveredTile) {
      this.hoveredTile = null;
      if (this.callbacks.onTileHover) this.callbacks.onTileHover(null);
      if (this.ghostMesh) this.ghostMesh.visible = false;
    } else if (coord && (!this.hoveredTile || this.hoveredTile.x !== coord.x || this.hoveredTile.z !== coord.z)) {
      this.hoveredTile = coord;
      if (this.callbacks.onTileHover) this.callbacks.onTileHover(coord);
      if (this.ghostMesh) {
        this.ghostMesh.visible = true;
        const worldPos = this.coordToWorld(coord.x, coord.z);
        this.ghostMesh.position.set(worldPos.x, 0.05, worldPos.z);
      }
    }
  }

  public coordToWorld(x: number, z: number): { x: number; z: number } {
    const halfSize = (this.gridSize * this.tileSize) / 2;
    return {
      x: x * this.tileSize - halfSize + this.tileSize / 2,
      z: z * this.tileSize - halfSize + this.tileSize / 2,
    };
  }

  public worldToCoord(wx: number, wz: number): { x: number; z: number } {
    const halfSize = (this.gridSize * this.tileSize) / 2;
    const gx = Math.round((wx + halfSize - this.tileSize / 2) / this.tileSize);
    const gz = Math.round((wz + halfSize - this.tileSize / 2) / this.tileSize);
    return {
      x: Math.max(0, Math.min(this.gridSize - 1, gx)),
      z: Math.max(0, Math.min(this.gridSize - 1, gz)),
    };
  }

  // --- GHOST BLUEPRINT PREVIEW ---

  public updateGhostPreview(defId: string | null, isValidPlacement: boolean = true) {
    if (!defId) {
      if (this.ghostMesh) {
        this.scene.remove(this.ghostMesh);
        this.ghostMesh = null;
      }
      return;
    }

    const def = BUILDING_MAP.get(defId);
    if (!def) return;

    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }

    const ghost = new THREE.Group();
    const w = def.size[0] * this.tileSize;
    const d = def.size[1] * this.tileSize;
    const h = 1.2;

    const boxGeo = new THREE.BoxGeometry(w * 0.95, h, d * 0.95);
    const boxMat = new THREE.MeshBasicMaterial({
      color: isValidPlacement ? 0x22c55e : 0xef4444,
      transparent: true,
      opacity: 0.45,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = h / 2;
    ghost.add(box);

    const footGeo = new THREE.PlaneGeometry(w, d);
    const footMat = new THREE.MeshBasicMaterial({
      color: isValidPlacement ? 0x10b981 : 0xdc2626,
      transparent: true,
      opacity: 0.35,
    });
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.rotation.x = -Math.PI / 2;
    foot.position.y = 0.05;
    ghost.add(foot);

    this.ghostMesh = ghost;
    this.scene.add(ghost);

    if (this.hoveredTile) {
      const pos = this.coordToWorld(this.hoveredTile.x, this.hoveredTile.z);
      this.ghostMesh.position.set(pos.x, 0.05, pos.z);
    } else {
      this.ghostMesh.visible = false;
    }
  }

  // --- BUILDING & ROAD MESH GENERATION ---

  public syncBuildings(buildings: PlacedBuilding[]) {
    this.currentBuildings = buildings;
    const activeIds = new Set(buildings.map((b) => b.instanceId));

    this.buildingMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.buildingMeshes.delete(id);
      }
    });

    buildings.forEach((building) => {
      let group = this.buildingMeshes.get(building.instanceId);
      if (!group) {
        group = this.createBuildingMesh(building);
        group.userData = { building };
        this.scene.add(group);
        this.buildingMeshes.set(building.instanceId, group);
      } else {
        const prev = group.userData.building as PlacedBuilding;
        if (
          prev.level !== building.level ||
          prev.color !== building.color ||
          prev.customWidth !== building.customWidth ||
          prev.customDepth !== building.customDepth ||
          prev.customHeightFloors !== building.customHeightFloors ||
          prev.roofStyle !== building.roofStyle ||
          prev.architecturalStyle !== building.architecturalStyle
        ) {
          this.scene.remove(group);
          group = this.createBuildingMesh(building);
          group.userData = { building };
          this.scene.add(group);
          this.buildingMeshes.set(building.instanceId, group);
        }
      }

      const worldPos = this.coordToWorld(building.x, building.z);
      group.position.set(worldPos.x, 0, worldPos.z);
      group.rotation.y = (building.rotation * Math.PI) / 180;
    });

    this.updateTrafficRoutes(buildings);
  }

  private createStreetlightMesh(hasGlow: boolean = false): THREE.Group {
    const pole = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, 1.3, 8),
      this.materials.steelBrushed
    );
    post.position.y = 0.65;
    post.castShadow = true;
    pole.add(post);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.38),
      this.materials.steelBrushed
    );
    arm.position.set(0, 1.3, 0.14);
    arm.castShadow = true;
    pole.add(arm);

    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.04, 0.14),
      this.materials.steelBrushed
    );
    fixture.position.set(0, 1.28, 0.3);
    fixture.castShadow = true;
    pole.add(fixture);

    const lensMat = new THREE.MeshBasicMaterial({
      color: hasGlow ? 0xfef08a : 0x94a3b8,
    });
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.1), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 1.258, 0.3);
    pole.add(lens);

    if (hasGlow) {
      const light = new THREE.PointLight(0xfef08a, 1.2, 5.5, 1.5);
      light.position.set(0, 1.2, 0.3);
      pole.add(light);
    }

    return pole;
  }

  private createConnectedRoadMesh(building: PlacedBuilding, isAvenue: boolean): THREE.Group {
    const group = new THREE.Group();
    const roadCoords = new Set(
      this.currentBuildings.filter(isRoadBuilding).map((b) => `${b.x},${b.z}`)
    );
    const neighbors = getRoadNeighbors({ x: building.x, z: building.z }, roadCoords);
    const junction = classifyRoadJunction(neighbors);

    const ts = this.tileSize;
    const roadMat = this.materials.asphalt;
    const stripeMat = isAvenue ? this.materials.roadStripeYellow : this.materials.roadStripe;
    const curbMat = this.materials.curbConcrete;

    // Road Deck
    const roadGeo = new THREE.BoxGeometry(ts * 0.98, 0.08, ts * 0.98);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.y = 0.04;
    road.receiveShadow = true;
    group.add(road);

    const createCrosswalk = (x: number, z: number, rotY: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0.082, z);
      g.rotation.y = rotY;
      for (let s = -0.36; s <= 0.36; s += 0.18) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(0.07, 0.32),
          this.materials.roadCrosswalk
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.x = s;
        stripe.receiveShadow = true;
        g.add(stripe);
      }
      return g;
    };

    if (junction === 'crossroad_4way') {
      const cornerSize = ts * 0.22;
      [
        { cx: ts * 0.39, cz: ts * 0.39 },
        { cx: -ts * 0.39, cz: ts * 0.39 },
        { cx: ts * 0.39, cz: -ts * 0.39 },
        { cx: -ts * 0.39, cz: -ts * 0.39 },
      ].forEach((pos, i) => {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(cornerSize, 0.12, cornerSize), curbMat);
        corner.position.set(pos.cx, 0.06, pos.cz);
        corner.castShadow = true;
        corner.receiveShadow = true;
        group.add(corner);

        if (i === 0 || i === 3) {
          const lamp = this.createStreetlightMesh(this.currentTimeOfDay !== 'day');
          lamp.position.set(pos.cx * 0.9, 0.06, pos.cz * 0.9);
          group.add(lamp);
        }
      });

      group.add(createCrosswalk(0, ts * 0.34, 0));
      group.add(createCrosswalk(0, -ts * 0.34, 0));
      group.add(createCrosswalk(ts * 0.34, 0, Math.PI / 2));
      group.add(createCrosswalk(-ts * 0.34, 0, Math.PI / 2));

    } else if (junction.startsWith('t_junction')) {
      if (junction === 't_junction_north') {
        const curbN = new THREE.Mesh(new THREE.BoxGeometry(ts, 0.12, 0.2), curbMat);
        curbN.position.set(0, 0.06, -ts * 0.42);
        curbN.castShadow = true;
        curbN.receiveShadow = true;
        group.add(curbN);
        group.add(createCrosswalk(0, ts * 0.34, 0));
        group.add(createCrosswalk(ts * 0.34, 0, Math.PI / 2));
        group.add(createCrosswalk(-ts * 0.34, 0, Math.PI / 2));
      } else if (junction === 't_junction_south') {
        const curbS = new THREE.Mesh(new THREE.BoxGeometry(ts, 0.12, 0.2), curbMat);
        curbS.position.set(0, 0.06, ts * 0.42);
        curbS.castShadow = true;
        curbS.receiveShadow = true;
        group.add(curbS);
        group.add(createCrosswalk(0, -ts * 0.34, 0));
        group.add(createCrosswalk(ts * 0.34, 0, Math.PI / 2));
        group.add(createCrosswalk(-ts * 0.34, 0, Math.PI / 2));
      } else if (junction === 't_junction_east') {
        const curbE = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, ts), curbMat);
        curbE.position.set(ts * 0.42, 0.06, 0);
        curbE.castShadow = true;
        curbE.receiveShadow = true;
        group.add(curbE);
        group.add(createCrosswalk(0, ts * 0.34, 0));
        group.add(createCrosswalk(0, -ts * 0.34, 0));
        group.add(createCrosswalk(-ts * 0.34, 0, Math.PI / 2));
      } else {
        const curbW = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, ts), curbMat);
        curbW.position.set(-ts * 0.42, 0.06, 0);
        curbW.castShadow = true;
        curbW.receiveShadow = true;
        group.add(curbW);
        group.add(createCrosswalk(0, ts * 0.34, 0));
        group.add(createCrosswalk(0, -ts * 0.34, 0));
        group.add(createCrosswalk(ts * 0.34, 0, Math.PI / 2));
      }

      const lamp = this.createStreetlightMesh(this.currentTimeOfDay !== 'day');
      lamp.position.set(ts * 0.36, 0.06, -ts * 0.36);
      group.add(lamp);

    } else if (junction === 'straight_ew') {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(ts * 0.65, 0.12),
        stripeMat
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.y = 0.085;
      stripe.receiveShadow = true;
      group.add(stripe);

      const curbN = new THREE.Mesh(new THREE.BoxGeometry(ts, 0.12, 0.22), curbMat);
      curbN.position.set(0, 0.06, -ts * 0.42);
      curbN.castShadow = true;
      curbN.receiveShadow = true;
      const curbS = new THREE.Mesh(new THREE.BoxGeometry(ts, 0.12, 0.22), curbMat);
      curbS.position.set(0, 0.06, ts * 0.42);
      curbS.castShadow = true;
      curbS.receiveShadow = true;
      group.add(curbN, curbS);

      const lamp = this.createStreetlightMesh(this.currentTimeOfDay !== 'day');
      lamp.position.set(ts * 0.3, 0.06, -ts * 0.38);
      group.add(lamp);

      if (isAvenue) {
        const tree1 = this.createRealisticTree(0.65);
        tree1.position.set(-ts * 0.3, 0.08, -ts * 0.38);
        const tree2 = this.createRealisticTree(0.65);
        tree2.position.set(ts * 0.1, 0.08, ts * 0.38);
        group.add(tree1, tree2);
      }
    } else {
      // Default / straight_ns
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, ts * 0.65),
        stripeMat
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.y = 0.085;
      stripe.receiveShadow = true;
      group.add(stripe);

      const curbW = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, ts), curbMat);
      curbW.position.set(-ts * 0.42, 0.06, 0);
      curbW.castShadow = true;
      curbW.receiveShadow = true;
      const curbE = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, ts), curbMat);
      curbE.position.set(ts * 0.42, 0.06, 0);
      curbE.castShadow = true;
      curbE.receiveShadow = true;
      group.add(curbW, curbE);

      const lamp = this.createStreetlightMesh(this.currentTimeOfDay !== 'day');
      lamp.position.set(ts * 0.38, 0.06, -ts * 0.3);
      group.add(lamp);

      if (isAvenue) {
        const tree1 = this.createRealisticTree(0.65);
        tree1.position.set(-ts * 0.38, 0.08, -ts * 0.3);
        const tree2 = this.createRealisticTree(0.65);
        tree2.position.set(ts * 0.38, 0.08, ts * 0.2);
        group.add(tree1, tree2);
      }
    }

    return group;
  }

  private createCustomBuildingMesh(building: PlacedBuilding, baseColor: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const widthTiles = building.customWidth || 2;
    const depthTiles = building.customDepth || 2;
    const floors = building.customHeightFloors || 3;
    const floorH = 1.25;
    const totalH = floors * floorH;

    const w = widthTiles * this.tileSize * 0.94;
    const d = depthTiles * this.tileSize * 0.94;

    // Foundation plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.12, 0.2, d + 0.12),
      this.materials.modernConcrete
    );
    plinth.position.y = 0.1;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Facade material selection
    let bodyMat: THREE.Material = this.materials.modernConcrete;
    const finish = building.materialFinish;
    const style = building.architecturalStyle;

    if (finish === 'brick' || style === 'classic_brick') {
      bodyMat = this.materials.brickRed;
    } else if (finish === 'timber' || style === 'timber_eco') {
      bodyMat = this.materials.timberWood;
    } else if (finish === 'glass' || style === 'modern_glass') {
      bodyMat = this.materials.glassFacade;
    } else if (finish === 'stucco') {
      bodyMat = this.materials.whiteStucco;
    } else if (finish === 'steel') {
      bodyMat = this.materials.steelBrushed;
    } else {
      bodyMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: building.roughness !== undefined ? building.roughness : 0.75,
        metalness: building.metalness !== undefined ? building.metalness : 0.05,
      });
    }

    const floorSlabMat = this.materials.modernConcrete;
    const glassMat = this.materials.glassWindow;
    const frameMat = this.materials.steelBrushed;

    for (let f = 1; f <= floors; f++) {
      const floorY = (f - 1) * floorH + 0.2;

      const floorGeo = new THREE.BoxGeometry(w, floorH * 0.9, d);
      const floorMesh = new THREE.Mesh(floorGeo, bodyMat);
      floorMesh.position.y = floorY + (floorH * 0.9) / 2;
      floorMesh.userData = { floorLevel: f };
      floorMesh.castShadow = true;
      floorMesh.receiveShadow = true;
      group.add(floorMesh);

      const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.1, d + 0.08), floorSlabMat);
      slab.position.y = floorY + floorH;
      slab.userData = { floorLevel: f };
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);

      const numWinX = Math.max(2, Math.floor(w / 0.8));
      const winSpacingX = w / numWinX;
      for (let i = 0; i < numWinX; i++) {
        const wx = -w / 2 + (i + 0.5) * winSpacingX;
        const winW = winSpacingX * 0.7;
        const winH = floorH * 0.55;

        // Window Frame
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.04, winH + 0.04, 0.03), frameMat);
        winFrame.position.set(wx, floorY + floorH * 0.52, d / 2 + 0.02);
        winFrame.userData = { floorLevel: f };
        winFrame.castShadow = true;
        group.add(winFrame);

        // Window Glass Pane
        const winFront = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
        winFront.userData = { isWindow: true, floorLevel: f };
        winFront.position.set(wx, floorY + floorH * 0.52, d / 2 + 0.038);
        group.add(winFront);

        // Back side window
        const winBack = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
        winBack.userData = { isWindow: true, floorLevel: f };
        winBack.position.set(wx, floorY + floorH * 0.52, -d / 2 - 0.02);
        winBack.rotation.y = Math.PI;
        group.add(winBack);
      }

      // Architectural Cantilevered Balconies (Stage 2)
      if (building.balcony !== false && f >= 2 && f <= floors) {
        const balconyW = Math.min(w * 0.52, 2.2);
        const balconyD = 0.38;
        const balconySlab = new THREE.Mesh(
          new THREE.BoxGeometry(balconyW, 0.08, balconyD),
          floorSlabMat
        );
        balconySlab.position.set(0, floorY + 0.04, d / 2 + balconyD / 2);
        balconySlab.castShadow = true;
        balconySlab.userData = { floorLevel: f };
        group.add(balconySlab);

        const railH = 0.28;
        const railFront = new THREE.Mesh(
          new THREE.BoxGeometry(balconyW, railH, 0.02),
          glassMat
        );
        railFront.position.set(0, floorY + 0.08 + railH / 2, d / 2 + balconyD);
        railFront.userData = { floorLevel: f };
        group.add(railFront);

        const railSideL = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, railH, balconyD),
          frameMat
        );
        railSideL.position.set(-balconyW / 2, floorY + 0.08 + railH / 2, d / 2 + balconyD / 2);
        railSideL.userData = { floorLevel: f };
        group.add(railSideL);

        const railSideR = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, railH, balconyD),
          frameMat
        );
        railSideR.position.set(balconyW / 2, floorY + 0.08 + railH / 2, d / 2 + balconyD / 2);
        railSideR.userData = { floorLevel: f };
        group.add(railSideR);
      }
    }

    const roofY = totalH + 0.2;
    const roofStyle = building.roofStyle || 'flat';

    if (roofStyle === 'pitched') {
      const roofPeakH = Math.min(w, d) * 0.5;
      const roofMesh = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.7, roofPeakH, 4),
        this.materials.terracottaRoof
      );
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.position.y = roofY + roofPeakH / 2;
      roofMesh.userData = { isRoof: true };
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      group.add(roofMesh);
    } else if (roofStyle === 'mansard') {
      const roofMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.max(w, d) * 0.5, Math.max(w, d) * 0.7, 0.85, 4),
        this.materials.slateRoof
      );
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.position.y = roofY + 0.42;
      roofMesh.userData = { isRoof: true };
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      group.add(roofMesh);
    } else {
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.08, 0.38, d + 0.08),
        this.materials.modernConcrete
      );
      parapet.position.y = roofY + 0.19;
      parapet.userData = { isRoof: true };
      parapet.castShadow = true;
      parapet.receiveShadow = true;
      group.add(parapet);

      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.22, 0.05, d - 0.22),
        this.materials.timberWood
      );
      deck.position.y = roofY + 0.21;
      deck.userData = { isRoof: true };
      deck.receiveShadow = true;
      group.add(deck);

      const coreMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), this.materials.steelBrushed);
      coreMesh.position.set(0, roofY + 0.6, 0);
      coreMesh.userData = { isRoof: true };
      coreMesh.castShadow = true;
      group.add(coreMesh);
    }

    return group;
  }

  private createBuildingMesh(building: PlacedBuilding): THREE.Group {
    const baseColor = new THREE.Color(building.color || '#f1f5f9');

    // Custom Scratch Architectural Structure
    if (building.customWidth || building.customDepth || building.customHeightFloors) {
      return this.createCustomBuildingMesh(building, baseColor);
    }

    const group = new THREE.Group();
    const def = BUILDING_MAP.get(building.defId);
    if (!def) return group;

    const levelScale = 1 + (building.level - 1) * 0.3;

    // PROCEDURAL ARCHITECTURAL MESH BUILDERS USING SAFE LAMBERT SHADERS
    switch (def.id) {
      case 'road_paved':
      case 'road_avenue': {
        return this.createConnectedRoadMesh(building, def.id === 'road_avenue');
      }

      case 'bridge_water': {
        const deckGeo = new THREE.BoxGeometry(this.tileSize, 0.25, this.tileSize * 0.85);
        const deckMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.y = 0.35;
        group.add(deck);

        const towerGeo = new THREE.BoxGeometry(0.18, 1.8, 0.18);
        const towerMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
        const t1 = new THREE.Mesh(towerGeo, towerMat);
        t1.position.set(-0.7, 0.9, 0.7);
        const t2 = new THREE.Mesh(towerGeo, towerMat);
        t2.position.set(0.7, 0.9, 0.7);
        const t3 = new THREE.Mesh(towerGeo, towerMat);
        t3.position.set(-0.7, 0.9, -0.7);
        const t4 = new THREE.Mesh(towerGeo, towerMat);
        t4.position.set(0.7, 0.9, -0.7);
        group.add(t1, t2, t3, t4);
        break;
      }

      case 'nat_canal': {
        const waterGeo = new THREE.BoxGeometry(this.tileSize * 0.98, 0.05, this.tileSize * 0.98);
        const waterMat = new THREE.MeshLambertMaterial({
          color: 0x0284c7,
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 0.02;
        group.add(water);

        const borderGeo = new THREE.BoxGeometry(this.tileSize, 0.15, 0.18);
        const borderMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
        const b1 = new THREE.Mesh(borderGeo, borderMat);
        b1.position.set(0, 0.08, 0.85);
        const b2 = new THREE.Mesh(borderGeo, borderMat);
        b2.position.set(0, 0.08, -0.85);
        group.add(b1, b2);
        break;
      }

      case 'res_cottage': {
        const h = 1.1 * levelScale;
        const bodyGeo = new THREE.BoxGeometry(1.2, h, 1.1);
        const bodyMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = h / 2;
        group.add(body);

        const roofGeo = new THREE.ConeGeometry(1.0, 0.75, 4);
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = h + 0.35;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);

        const chimGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
        const chimMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
        const chim = new THREE.Mesh(chimGeo, chimMat);
        chim.position.set(0.35, h + 0.5, 0.2);
        group.add(chim);

        const winGeo = new THREE.PlaneGeometry(0.3, 0.35);
        const winMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
        const win = new THREE.Mesh(winGeo, winMat);
        win.userData = { isWindow: true };
        win.position.set(0, h * 0.55, 0.56);
        group.add(win);
        break;
      }

      case 'res_suburb': {
        const h = 1.3 * levelScale;
        const mainGeo = new THREE.BoxGeometry(2.2, h, 1.4);
        const mainMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = h / 2;
        group.add(main);

        const topGeo = new THREE.BoxGeometry(1.4, 0.8, 1.2);
        const topMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.set(0.3, h + 0.4, 0);
        group.add(top);

        const solGeo = new THREE.BoxGeometry(1.1, 0.05, 0.8);
        const solMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
        const sol = new THREE.Mesh(solGeo, solMat);
        sol.position.set(0.3, h + 0.83, 0);
        sol.rotation.x = -0.15;
        group.add(sol);

        const tree = this.createLowPolyTree(0.7);
        tree.position.set(-0.9, 0, 0.8);
        group.add(tree);
        break;
      }

      case 'res_brownstone': {
        const h = 2.4 * levelScale;
        const bodyGeo = new THREE.BoxGeometry(1.3, h, 2.2);
        const bodyMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = h / 2;
        group.add(body);

        const corniceGeo = new THREE.BoxGeometry(1.4, 0.2, 2.3);
        const corniceMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const cornice = new THREE.Mesh(corniceGeo, corniceMat);
        cornice.position.y = h + 0.1;
        group.add(cornice);

        for (let floor = 1; floor <= Math.min(4, Math.floor(h)); floor++) {
          const winGeo = new THREE.PlaneGeometry(0.25, 0.35);
          const winMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
          const winL = new THREE.Mesh(winGeo, winMat);
          winL.userData = { isWindow: true };
          winL.position.set(0.66, floor * 0.6, -0.4);
          winL.rotation.y = Math.PI / 2;

          const winR = new THREE.Mesh(winGeo, winMat);
          winR.userData = { isWindow: true };
          winR.position.set(0.66, floor * 0.6, 0.4);
          winR.rotation.y = Math.PI / 2;
          group.add(winL, winR);
        }
        break;
      }

      case 'res_apartment': {
        const h = 3.6 * levelScale;
        const towerGeo = new THREE.BoxGeometry(2.4, h, 2.4);
        const towerMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = h / 2;
        group.add(tower);

        const glassGeo = new THREE.BoxGeometry(2.45, h * 0.8, 1.2);
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, h * 0.45, 0);
        group.add(glass);

        const roofGeo = new THREE.BoxGeometry(1.2, 0.4, 1.2);
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = h + 0.2;
        group.add(roof);
        break;
      }

      case 'res_skyscraper':
      case 'com_tower': {
        const h = (def.id === 'com_tower' ? 6.5 : 5.8) * levelScale;
        const baseH = h * 0.6;
        const bGeo = new THREE.BoxGeometry(2.6, baseH, 2.6);
        const bMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = baseH / 2;
        group.add(bMesh);

        const topH = h * 0.4;
        const tGeo = new THREE.BoxGeometry(1.9, topH, 1.9);
        const tMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
        const tMesh = new THREE.Mesh(tGeo, tMat);
        tMesh.position.y = baseH + topH / 2;
        group.add(tMesh);

        for (let y = 1.0; y < h; y += 0.8) {
          const bandGeo = new THREE.BoxGeometry(2.64, 0.25, 2.64);
          const bandMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
          const band = new THREE.Mesh(bandGeo, bandMat);
          band.userData = { isWindow: true };
          band.position.y = y;
          group.add(band);
        }

        const antGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.8, 8);
        const antMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.y = h + 0.9;
        group.add(ant);

        const beaconGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = h + 1.8;
        group.add(beacon);
        break;
      }

      case 'com_cafe': {
        const h = 1.1 * levelScale;
        const bGeo = new THREE.BoxGeometry(1.3, h, 1.3);
        const bMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = h / 2;
        group.add(bMesh);

        const awnGeo = new THREE.BoxGeometry(1.4, 0.08, 0.5);
        const awnMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
        const awn = new THREE.Mesh(awnGeo, awnMat);
        awn.position.set(0, h * 0.7, 0.75);
        awn.rotation.x = 0.25;
        group.add(awn);
        break;
      }

      case 'com_supermarket': {
        const h = 1.4 * levelScale;
        const bGeo = new THREE.BoxGeometry(2.6, h, 1.5);
        const bMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = h / 2;
        group.add(bMesh);

        const signGeo = new THREE.BoxGeometry(1.8, 0.35, 0.1);
        const signMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, h * 0.85, 0.78);
        group.add(sign);
        break;
      }

      case 'com_office': {
        const h = 3.2 * levelScale;
        const bGeo = new THREE.BoxGeometry(2.4, h, 2.4);
        const bMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = h / 2;
        group.add(bMesh);

        const cGeo = new THREE.BoxGeometry(1.2, 0.6, 2.6);
        const cMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(0.6, h * 0.65, 0);
        group.add(cMesh);
        break;
      }

      case 'util_solar': {
        const standGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5);
        const standMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
        const panelGeo = new THREE.BoxGeometry(1.1, 0.04, 0.8);
        const panelMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });

        [-0.7, 0.7].forEach((xPos) => {
          const s = new THREE.Mesh(standGeo, standMat);
          s.position.set(xPos, 0.25, 0);
          const p = new THREE.Mesh(panelGeo, panelMat);
          p.position.set(xPos, 0.45, 0);
          p.rotation.x = -0.35;
          group.add(s, p);
        });
        break;
      }

      case 'util_wind': {
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.16, 3.2, 12);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1.6;
        group.add(pole);

        const nacGeo = new THREE.BoxGeometry(0.35, 0.35, 0.7);
        const nacMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const nac = new THREE.Mesh(nacGeo, nacMat);
        nac.position.set(0, 3.2, 0);
        group.add(nac);

        const rotor = new THREE.Group();
        rotor.position.set(0, 3.2, 0.4);
        for (let i = 0; i < 3; i++) {
          const bladeGeo = new THREE.BoxGeometry(0.12, 1.6, 0.03);
          const bladeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          blade.position.y = 0.8;
          const bladePivot = new THREE.Group();
          bladePivot.rotation.z = (i * 2 * Math.PI) / 3;
          bladePivot.add(blade);
          rotor.add(bladePivot);
        }
        group.add(rotor);

        this.animatedProps.push({
          mesh: rotor,
          update: (dt) => {
            rotor.rotation.z += dt * 2.8;
          },
        });
        break;
      }

      case 'util_water_tower': {
        const legsGeo = new THREE.CylinderGeometry(0.1, 0.15, 2.2, 8);
        const legsMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
        const legs = new THREE.Mesh(legsGeo, legsMat);
        legs.position.y = 1.1;
        group.add(legs);

        const tankGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.2, 16);
        const tankMat = new THREE.MeshLambertMaterial({ color: 0x0ea5e9 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.y = 2.4;
        group.add(tank);
        break;
      }

      case 'civic_police':
      case 'civic_fire': {
        const isPolice = def.id === 'civic_police';
        const h = 1.6 * levelScale;
        const bGeo = new THREE.BoxGeometry(2.4, h, 1.5);
        const bMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = h / 2;
        group.add(bMesh);

        const bayGeo = new THREE.BoxGeometry(0.9, 0.9, 0.1);
        const bayMat = new THREE.MeshLambertMaterial({ color: isPolice ? 0x1e3a8a : 0x991b1b });
        const bay = new THREE.Mesh(bayGeo, bayMat);
        bay.position.set(-0.5, 0.5, 0.76);
        group.add(bay);

        const sirenGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const sirenMat = new THREE.MeshBasicMaterial({ color: isPolice ? 0x3b82f6 : 0xef4444 });
        const siren = new THREE.Mesh(sirenGeo, sirenMat);
        siren.position.set(0.6, h + 0.15, 0);
        group.add(siren);
        break;
      }

      case 'civic_hospital': {
        const h = 2.8 * levelScale;
        const bGeo = new THREE.BoxGeometry(2.5, h, 2.5);
        const bMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = h / 2;
        group.add(bMesh);

        const crossHGeo = new THREE.BoxGeometry(0.9, 0.25, 0.1);
        const crossVGeo = new THREE.BoxGeometry(0.25, 0.9, 0.1);
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const crossH = new THREE.Mesh(crossHGeo, crossMat);
        const crossV = new THREE.Mesh(crossVGeo, crossMat);
        crossH.position.set(0, h + 0.3, 0);
        crossV.position.set(0, h + 0.3, 0);
        group.add(crossH, crossV);
        break;
      }

      case 'park_fountain': {
        const baseGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.3, 16);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        group.add(base);

        const waterGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 16);
        const waterMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 0.25;
        group.add(water);

        const colGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.8, 12);
        const col = new THREE.Mesh(colGeo, baseMat);
        col.position.y = 0.55;
        group.add(col);

        const sprayGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const sprayMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 });
        const spray = new THREE.Mesh(sprayGeo, sprayMat);
        spray.position.y = 1.05;
        group.add(spray);

        this.animatedProps.push({
          mesh: spray,
          update: (_, time) => {
            const s = 1 + Math.sin(time * 6) * 0.15;
            spray.scale.set(s, s, s);
          },
        });
        break;
      }

      case 'park_botanical': {
        const domeGeo = new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshLambertMaterial({
          color: 0x86efac,
          transparent: true,
          opacity: 0.65,
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.2;
        group.add(dome);

        const palm = this.createLowPolyTree(1.2);
        palm.position.set(0, 0, 0);
        group.add(palm);
        break;
      }

      case 'nat_forest': {
        const t1 = this.createLowPolyTree(0.9, 'pine');
        t1.position.set(-0.35, 0, -0.3);
        const t2 = this.createLowPolyTree(1.1, 'pine');
        t2.position.set(0.35, 0, 0.25);
        const t3 = this.createLowPolyTree(0.7, 'pine');
        t3.position.set(0, 0, 0.4);
        group.add(t1, t2, t3);
        break;
      }

      case 'lift_glass_elevator': {
        const liftH = 4.2 * levelScale;

        // 4 corner steel structural posts
        const postGeo = new THREE.BoxGeometry(0.08, liftH, 0.08);
        const postMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([px, pz]) => {
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(px, liftH / 2, pz);
          group.add(post);
        });

        // Glazed transparent glass elevator shaft
        const glassGeo = new THREE.BoxGeometry(1.25, liftH * 0.98, 1.25);
        const glassMat = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
        });
        const glassShaft = new THREE.Mesh(glassGeo, glassMat);
        glassShaft.position.y = liftH / 2;
        group.add(glassShaft);

        // Top mechanical machine room
        const crownGeo = new THREE.BoxGeometry(1.4, 0.35, 1.4);
        const crownMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = liftH + 0.175;
        group.add(crown);

        // Animated Glass Elevator Cabin traveling between floors in real time!
        const cabinGeo = new THREE.BoxGeometry(0.9, 0.8, 0.9);
        const cabinMat = new THREE.MeshLambertMaterial({
          color: 0x0284c7,
          emissive: 0xfef08a,
          emissiveIntensity: 0.5,
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.y = 0.5;
        group.add(cabin);

        this.animatedProps.push({
          mesh: cabin,
          update: (_, time) => {
            const travel = Math.sin(time * 1.5) * 0.5 + 0.5;
            cabin.position.y = 0.5 + travel * (liftH - 1.2);
          },
        });
        break;
      }

      case 'arch_stairs_tower': {
        const h = 2.8 * levelScale;
        const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, h, 8);
        const mastMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = h / 2;
        group.add(mast);

        const numSteps = 12;
        const stepMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
        for (let s = 0; s < numSteps; s++) {
          const angle = (s / numSteps) * Math.PI * 2;
          const stepGeo = new THREE.BoxGeometry(0.5, 0.05, 0.2);
          const step = new THREE.Mesh(stepGeo, stepMat);
          step.position.set(Math.cos(angle) * 0.35, (s / numSteps) * h, Math.sin(angle) * 0.35);
          step.rotation.y = -angle;
          group.add(step);
        }
        break;
      }

      case 'infra_plaza': {
        const plazaGeo = new THREE.BoxGeometry(this.tileSize * 0.98, 0.08, this.tileSize * 0.98);
        const plazaMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
        const plaza = new THREE.Mesh(plazaGeo, plazaMat);
        plaza.position.y = 0.04;
        group.add(plaza);

        const bollardMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, emissive: 0x38bdf8, emissiveIntensity: 0.5 });
        [-0.7, 0.7].forEach((bx) => {
          [-0.7, 0.7].forEach((bz) => {
            const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), bollardMat);
            bol.position.set(bx, 0.15, bz);
            group.add(bol);
          });
        });
        break;
      }

      case 'infra_parking_bay': {
        const bayGeo = new THREE.BoxGeometry(this.tileSize * 0.98, 0.08, this.tileSize * 0.98);
        const bayMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const bay = new THREE.Mesh(bayGeo, bayMat);
        bay.position.y = 0.04;
        group.add(bay);

        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [-0.5, 0, 0.5].forEach((sx) => {
          const str = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.2), stripeMat);
          str.rotation.x = -Math.PI / 2;
          str.position.set(sx, 0.085, 0);
          group.add(str);
        });
        break;
      }

      default: {
        const w = def.size[0] * this.tileSize * 0.85;
        const d = def.size[1] * this.tileSize * 0.85;
        const h = 1.8 * levelScale;
        const boxGeo = new THREE.BoxGeometry(w, h, d);
        const boxMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = h / 2;
        group.add(box);
        break;
      }
    }

    // Enable soft shadow casting and receiving on all architectural elements
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  public createRealisticTree(scale: number = 1.0, type: 'oak' | 'pine' | 'sakura' | 'palm' = 'oak'): THREE.Group {
    const tree = new THREE.Group();

    // Sculpted organic trunk with wood bark PBR material
    const trunkGeo = new THREE.CylinderGeometry(0.09 * scale, 0.16 * scale, 0.8 * scale, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.treeBark);
    trunk.position.y = 0.4 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    if (type === 'pine') {
      [0.6, 1.0, 1.4].forEach((yOffset, i) => {
        const radius = (0.65 - i * 0.15) * scale;
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(radius, 0.7 * scale, 8),
          this.materials.foliagePine
        );
        cone.position.y = (0.5 + yOffset) * scale;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      });
    } else if (type === 'palm') {
      const crownY = 1.4 * scale;
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const frond = new THREE.Mesh(
          new THREE.BoxGeometry(0.18 * scale, 0.04 * scale, 0.9 * scale),
          this.materials.foliagePalm
        );
        frond.position.set(Math.cos(angle) * 0.35 * scale, crownY, Math.sin(angle) * 0.35 * scale);
        frond.rotation.y = angle;
        frond.rotation.x = 0.38;
        frond.castShadow = true;
        tree.add(frond);
      }
    } else {
      const folMat = type === 'sakura' ? this.materials.foliageSakura : this.materials.foliageOak;
      const clusters = [
        { x: 0, y: 1.15, z: 0, r: 0.62 },
        { x: 0.22, y: 0.95, z: 0.14, r: 0.48 },
        { x: -0.18, y: 1.0, z: -0.16, r: 0.45 },
        { x: 0.14, y: 1.35, z: -0.12, r: 0.42 },
      ];
      clusters.forEach((c) => {
        const cluster = new THREE.Mesh(
          new THREE.DodecahedronGeometry(c.r * scale, 1),
          folMat
        );
        cluster.position.set(c.x * scale, c.y * scale, c.z * scale);
        cluster.castShadow = true;
        cluster.receiveShadow = true;
        tree.add(cluster);
      });
    }

    return tree;
  }

  private createLowPolyTree(scale: number = 1.0, type: 'oak' | 'pine' | 'sakura' | 'palm' = 'oak'): THREE.Group {
    return this.createRealisticTree(scale, type);
  }

  // --- TRAFFIC SIMULATION ---

  public createVehicleMesh(defId: string, customColor?: string): THREE.Group {
    const vGroup = new THREE.Group();
    const def = VEHICLE_MAP.get(defId);
    const color = customColor || def?.color || '#ef4444';
    const carMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    if (defId === 'veh_city_bus') {
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.45, 1.4);
      const body = new THREE.Mesh(bodyGeo, carMat);
      body.position.y = 0.3;
      vGroup.add(body);

      const winGeo = new THREE.BoxGeometry(0.52, 0.18, 1.2);
      const win = new THREE.Mesh(winGeo, glassMat);
      win.position.y = 0.36;
      vGroup.add(win);
    } else if (defId === 'veh_fire_engine') {
      const bodyGeo = new THREE.BoxGeometry(0.48, 0.42, 1.2);
      const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
      body.position.y = 0.28;
      vGroup.add(body);

      const ladderGeo = new THREE.BoxGeometry(0.24, 0.06, 0.9);
      const ladderMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
      const ladder = new THREE.Mesh(ladderGeo, ladderMat);
      ladder.position.set(0, 0.52, -0.05);
      vGroup.add(ladder);

      const siren = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      siren.position.set(0, 0.52, 0.42);
      vGroup.add(siren);
    } else if (defId === 'veh_police_patrol') {
      const bodyGeo = new THREE.BoxGeometry(0.38, 0.22, 0.68);
      const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x0f172a }));
      body.position.y = 0.16;
      vGroup.add(body);

      const lightBarGeo = new THREE.BoxGeometry(0.22, 0.06, 0.08);
      const lightBarMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
      lightBar.position.set(0, 0.32, 0);
      vGroup.add(lightBar);

      this.animatedProps.push({
        mesh: lightBar,
        update: (_, time) => {
          lightBarMat.color.setHex(Math.sin(time * 14) > 0 ? 0x3b82f6 : 0xef4444);
        },
      });
    } else if (defId === 'veh_taxi_metro') {
      const bodyGeo = new THREE.BoxGeometry(0.38, 0.22, 0.68);
      const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
      body.position.y = 0.16;
      vGroup.add(body);

      const signGeo = new THREE.BoxGeometry(0.14, 0.07, 0.08);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 0.31, 0);
      vGroup.add(sign);
    } else {
      const bodyGeo = new THREE.BoxGeometry(0.38, 0.2, 0.68);
      const body = new THREE.Mesh(bodyGeo, carMat);
      body.position.y = 0.15;
      vGroup.add(body);

      const cabGeo = new THREE.BoxGeometry(0.32, 0.14, 0.35);
      const cab = new THREE.Mesh(cabGeo, glassMat);
      cab.position.set(0, 0.27, -0.05);
      vGroup.add(cab);

      if (defId === 'veh_sports_gt') {
        const spGeo = new THREE.BoxGeometry(0.36, 0.04, 0.1);
        const spMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const sp = new THREE.Mesh(spGeo, spMat);
        sp.position.set(0, 0.28, -0.32);
        vGroup.add(sp);
      }
    }

    // Headlights
    const headMat1 = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const headGeo = new THREE.PlaneGeometry(0.08, 0.08);
    const h1 = new THREE.Mesh(headGeo, headMat1);
    h1.position.set(-0.12, 0.15, 0.35);
    const h2 = new THREE.Mesh(headGeo, headMat1);
    h2.position.set(0.12, 0.15, 0.35);
    vGroup.add(h1, h2);

    return vGroup;
  }

  public spawnUserVehicle(defId: string, roadCoord: { x: number; z: number }, color?: string) {
    const vGroup = this.createVehicleMesh(defId, color);
    const wPos = this.coordToWorld(roadCoord.x, roadCoord.z);
    vGroup.position.set(wPos.x, 0, wPos.z);
    this.vehicleGroup.add(vGroup);

    const def = VEHICLE_MAP.get(defId);
    this.vehicles.push({
      mesh: vGroup,
      x: roadCoord.x,
      z: roadCoord.z,
      targetCoord: {
        x: Math.max(0, Math.min(this.gridSize - 1, roadCoord.x + 1)),
        z: roadCoord.z,
      },
      speed: def?.speed || 0.05,
      heading: 0,
    });
  }

  private updateTrafficRoutes(buildings: PlacedBuilding[]) {
    const roadCoords = buildings
      .filter((b) => b.defId === 'road_paved' || b.defId === 'road_avenue' || b.defId === 'bridge_water' || b.defId === 'infra_parking_bay')
      .map((b) => ({ x: b.x, z: b.z }));

    if (roadCoords.length === 0) {
      this.vehicles.forEach((v) => this.vehicleGroup.remove(v.mesh));
      this.vehicles = [];
      return;
    }

    const vehicleTypes = ['veh_sports_gt', 'veh_taxi_metro', 'veh_police_patrol', 'veh_city_bus', 'veh_freight_truck'];

    while (this.vehicles.length < Math.min(10, Math.floor(roadCoords.length * 0.7))) {
      if (roadCoords.length < 2) break;
      const start = roadCoords[Math.floor(Math.random() * roadCoords.length)];
      const target = roadCoords[Math.floor(Math.random() * roadCoords.length)];
      const chosenType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];

      const vGroup = this.createVehicleMesh(chosenType);
      const wPos = this.coordToWorld(start.x, start.z);
      vGroup.position.set(wPos.x, 0, wPos.z);
      this.vehicleGroup.add(vGroup);

      const def = VEHICLE_MAP.get(chosenType);
      this.vehicles.push({
        mesh: vGroup,
        x: start.x,
        z: start.z,
        targetCoord: target,
        speed: def?.speed || (0.04 + Math.random() * 0.03),
        heading: 0,
      });
    }
  }

  private animateVehicles(dt: number) {
    this.vehicles.forEach((v) => {
      const curWorld = v.mesh.position;
      const targetWorld = this.coordToWorld(v.targetCoord.x, v.targetCoord.z);

      const dx = targetWorld.x - curWorld.x;
      const dz = targetWorld.z - curWorld.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.25) {
        v.targetCoord = {
          x: Math.max(0, Math.min(this.gridSize - 1, v.targetCoord.x + (Math.random() > 0.5 ? 1 : -1))),
          z: Math.max(0, Math.min(this.gridSize - 1, v.targetCoord.z + (Math.random() > 0.5 ? 1 : -1))),
        };
      } else {
        const step = Math.min(dist, v.speed * dt * 60);
        curWorld.x += (dx / dist) * step;
        curWorld.z += (dz / dist) * step;
        v.mesh.rotation.y = Math.atan2(dx, dz);
      }
    });
  }

  // --- SELECTION OUTLINE ---

  public setSelection(building: PlacedBuilding | null) {
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox = null;
    }

    if (!building) {
      if (this.transformControls) {
        this.transformControls.detach();
      }
      this.selectedBuildingInstanceId = null;
      return;
    }

    this.selectedBuildingInstanceId = building.instanceId;
    const group = this.buildingMeshes.get(building.instanceId);
    if (!group) {
      if (this.transformControls) {
        this.transformControls.detach();
      }
      return;
    }

    if (this.transformControls && !this.isFirstPersonMode && !this.is2DMode) {
      this.transformControls.attach(group);
    }

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const selGeo = new THREE.BoxGeometry(
      Math.max(size.x + 0.1, this.tileSize),
      Math.max(size.y + 0.1, 0.4),
      Math.max(size.z + 0.1, this.tileSize)
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

  private getBuildingAtCoord(gx: number, gz: number): PlacedBuilding | null {
    for (const [, group] of this.buildingMeshes) {
      const b = group.userData?.building as PlacedBuilding;
      if (!b) continue;
      const def = BUILDING_MAP.get(b.defId);
      if (!def) continue;

      const [w, d] = def.size;
      if (gx >= b.x && gx < b.x + w && gz >= b.z && gz < b.z + d) {
        return b;
      }
    }
    return null;
  }

  // --- MAIN ANIMATION LOOP ---

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    if (this.isFirstPersonMode) {
      const moveSpeed = 7.5 * dt;
      const forward = new THREE.Vector3(-Math.sin(this.firstPersonYaw), 0, -Math.cos(this.firstPersonYaw));
      const right = new THREE.Vector3(Math.cos(this.firstPersonYaw), 0, -Math.sin(this.firstPersonYaw));

      if (this.activeKeys.has('w') || this.activeKeys.has('arrowup')) {
        this.firstPersonPos.addScaledVector(forward, moveSpeed);
      }
      if (this.activeKeys.has('s') || this.activeKeys.has('arrowdown')) {
        this.firstPersonPos.addScaledVector(forward, -moveSpeed);
      }
      if (this.activeKeys.has('a') || this.activeKeys.has('arrowleft')) {
        this.firstPersonPos.addScaledVector(right, -moveSpeed);
      }
      if (this.activeKeys.has('d') || this.activeKeys.has('arrowright')) {
        this.firstPersonPos.addScaledVector(right, moveSpeed);
      }

      const bound = (this.gridSize * this.tileSize) / 2 - 0.5;
      this.firstPersonPos.x = THREE.MathUtils.clamp(this.firstPersonPos.x, -bound, bound);
      this.firstPersonPos.z = THREE.MathUtils.clamp(this.firstPersonPos.z, -bound, bound);

      this.camera.position.set(this.firstPersonPos.x, 1.7, this.firstPersonPos.z);
      this.camera.rotation.set(this.firstPersonPitch, this.firstPersonYaw, 0, 'YXZ');
    } else if (Math.abs(this.cameraAngleV - this.targetCameraAngleV) > 0.005) {
      this.cameraAngleV += (this.targetCameraAngleV - this.cameraAngleV) * 0.12;
      this.updateCameraPosition();
    }

    this.animatedProps.forEach((prop) => prop.update(dt, time));
    this.animateVehicles(dt);

    this.renderer.render(this.scene, this.camera);
  };

  // --- SCREENSHOT EXPORT ---

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    if (this.transformControls) {
      this.transformControls.dispose();
      this.transformControls = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }
}
