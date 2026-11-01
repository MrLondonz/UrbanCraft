/**
 * High-Performance Isometric 2D Architectural Canvas Engine for UrbanCraft 5D
 * Guaranteed zero-dependency fallback when WebGL is restricted or unavailable.
 */
import { PlacedBuilding, TimeOfDay, ViewPerspective } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { SceneInteractionCallbacks } from './city3dScene';

export class City2DCanvas {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: SceneInteractionCallbacks;

  public readonly gridSize: number = 26;
  private tileW: number = 44;
  private tileH: number = 24;

  // Viewport pan & zoom
  private zoom: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;

  // State
  private buildings: PlacedBuilding[] = [];
  private selectedBuilding: PlacedBuilding | null = null;
  private hoveredTile: { x: number; z: number } | null = null;
  private timeOfDay: TimeOfDay = 'day';
  private viewMode: ViewPerspective = '3d';
  private ghostDefId: string | null = null;

  // Dragging
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private hasMoved: boolean = false;

  private animationFrameId: number | null = null;

  constructor(container: HTMLElement, callbacks: SceneInteractionCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context unsupported');
    }
    this.ctx = context;

    this.resize();
    this.panX = this.canvas.width / (2 * (window.devicePixelRatio || 1));
    this.panY = this.canvas.height / (4 * (window.devicePixelRatio || 1));

    this.bindEvents();
    this.renderLoop();
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.container.clientWidth * dpr;
    this.canvas.height = this.container.clientHeight * dpr;
  }

  private bindEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.hasMoved = false;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.hasMoved = true;
        }
        this.panX += dx;
        this.panY += dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }

      // Check hovered tile
      const coord = this.screenToGrid(mouseX, mouseY);
      if (coord && coord.x >= 0 && coord.x < this.gridSize && coord.z >= 0 && coord.z < this.gridSize) {
        if (!this.hoveredTile || this.hoveredTile.x !== coord.x || this.hoveredTile.z !== coord.z) {
          this.hoveredTile = coord;
          if (this.callbacks.onTileHover) this.callbacks.onTileHover(coord);
        }
      } else {
        if (this.hoveredTile) {
          this.hoveredTile = null;
          if (this.callbacks.onTileHover) this.callbacks.onTileHover(null);
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging && !this.hasMoved) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const coord = this.screenToGrid(mouseX, mouseY);

        if (coord && coord.x >= 0 && coord.x < this.gridSize && coord.z >= 0 && coord.z < this.gridSize) {
          const building = this.getBuildingAtCoord(coord.x, coord.z);
          if (building && this.callbacks.onBuildingClick) {
            this.callbacks.onBuildingClick(building);
          } else if (this.callbacks.onTileClick) {
            this.callbacks.onTileClick(coord);
          }
        }
      }
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(0.4, Math.min(2.5, this.zoom * zoomFactor));
    }, { passive: false });
  }

  // Coordinate projections
  private gridToScreen(gx: number, gz: number): { x: number; y: number } {
    if (this.viewMode === '2d_blueprint') {
      const step = 32 * this.zoom;
      return {
        x: this.panX + (gx - this.gridSize / 2) * step,
        y: this.panY + (gz - this.gridSize / 2) * step + 100,
      };
    }

    const hw = (this.tileW / 2) * this.zoom;
    const hh = (this.tileH / 2) * this.zoom;
    return {
      x: this.panX + (gx - gz) * hw,
      y: this.panY + (gx + gz) * hh,
    };
  }

  private screenToGrid(sx: number, sy: number): { x: number; z: number } | null {
    if (this.viewMode === '2d_blueprint') {
      const step = 32 * this.zoom;
      const gx = Math.round((sx - this.panX) / step + this.gridSize / 2);
      const gz = Math.round((sy - this.panY - 100) / step + this.gridSize / 2);
      return { x: gx, z: gz };
    }

    const hw = (this.tileW / 2) * this.zoom;
    const hh = (this.tileH / 2) * this.zoom;
    const rx = sx - this.panX;
    const ry = sy - this.panY;

    const gx = Math.round((rx / hw + ry / hh) / 2);
    const gz = Math.round((ry / hh - rx / hw) / 2);
    return { x: gx, z: gz };
  }

  private getBuildingAtCoord(gx: number, gz: number): PlacedBuilding | null {
    for (const b of this.buildings) {
      const def = BUILDING_MAP.get(b.defId);
      if (!def) continue;
      const [w, d] = def.size;
      if (gx >= b.x && gx < b.x + w && gz >= b.z && gz < b.z + d) {
        return b;
      }
    }
    return null;
  }

  public syncBuildings(buildings: PlacedBuilding[]) {
    this.buildings = buildings;
  }

  public setViewPerspective(mode: ViewPerspective) {
    this.viewMode = mode;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
  }

  public setSelection(building: PlacedBuilding | null) {
    this.selectedBuilding = building;
  }

  public updateGhostPreview(defId: string | null) {
    this.ghostDefId = defId;
  }

  private renderLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
    this.draw();
  };

  private draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = this.ctx;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background color based on view & time of day
    if (this.viewMode === '2d_blueprint') {
      ctx.fillStyle = '#0b1329';
    } else if (this.timeOfDay === 'night') {
      ctx.fillStyle = '#050813';
    } else if (this.timeOfDay === 'sunset') {
      ctx.fillStyle = '#1c1326';
    } else {
      ctx.fillStyle = '#0f172a';
    }
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Tiles
    const isBlueprint = this.viewMode === '2d_blueprint';
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gz = 0; gz < this.gridSize; gz++) {
        const pt = this.gridToScreen(gx, gz);

        if (isBlueprint) {
          const step = 32 * this.zoom;
          ctx.strokeStyle = '#1e3a5f';
          ctx.lineWidth = 1;
          ctx.strokeRect(pt.x, pt.y, step, step);
        } else {
          const hw = (this.tileW / 2) * this.zoom;
          const hh = (this.tileH / 2) * this.zoom;

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - hh);
          ctx.lineTo(pt.x + hw, pt.y);
          ctx.lineTo(pt.x, pt.y + hh);
          ctx.lineTo(pt.x - hw, pt.y);
          ctx.closePath();

          ctx.fillStyle = (gx + gz) % 2 === 0 ? '#152238' : '#131e33';
          ctx.fill();
          ctx.strokeStyle = '#1e3250';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Sort buildings for isometric depth
    const sorted = [...this.buildings].sort((a, b) => {
      return a.x + a.z - (b.x + b.z);
    });

    // Draw Buildings
    sorted.forEach((b) => {
      const def = BUILDING_MAP.get(b.defId);
      if (!def) return;
      const pt = this.gridToScreen(b.x, b.z);
      const isSelected = this.selectedBuilding?.instanceId === b.instanceId;

      if (isBlueprint) {
        const step = 32 * this.zoom;
        const bw = def.size[0] * step;
        const bd = def.size[1] * step;

        ctx.fillStyle = b.color || '#38bdf8';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(pt.x, pt.y, bw - 2, bd - 2);
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = isSelected ? '#38bdf8' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.strokeRect(pt.x, pt.y, bw - 2, bd - 2);

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText(def.name.substring(0, 10), pt.x + 3, pt.y + 12);
      } else {
        // Isometric 3D block
        const hw = (this.tileW / 2) * this.zoom * def.size[0];
        const hh = (this.tileH / 2) * this.zoom * def.size[1];
        const height = (def.id.includes('road') || def.id.includes('canal') ? 4 : 20 + (b.level - 1) * 8 + (def.size[0] + def.size[1]) * 6) * this.zoom;

        const bx = pt.x;
        const by = pt.y;

        // Base polygon
        const col = b.color || '#cbd5e1';

        if (def.category === 'transport') {
          // Flat road
          ctx.beginPath();
          ctx.moveTo(bx, by - hh);
          ctx.lineTo(bx + hw, by);
          ctx.lineTo(bx, by + hh);
          ctx.lineTo(bx - hw, by);
          ctx.closePath();
          ctx.fillStyle = '#334155';
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.stroke();

          // Center dash
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx - hw * 0.4, by);
          ctx.lineTo(bx + hw * 0.4, by);
          ctx.stroke();
        } else {
          // Left Wall (shaded)
          ctx.beginPath();
          ctx.moveTo(bx - hw, by);
          ctx.lineTo(bx, by + hh);
          ctx.lineTo(bx, by + hh - height);
          ctx.lineTo(bx - hw, by - height);
          ctx.closePath();
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#0f172a';
          ctx.stroke();

          // Right Wall (mid-tone)
          ctx.beginPath();
          ctx.moveTo(bx, by + hh);
          ctx.lineTo(bx + hw, by);
          ctx.lineTo(bx + hw, by - height);
          ctx.lineTo(bx, by + hh - height);
          ctx.closePath();
          ctx.fillStyle = '#334155';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#0f172a';
          ctx.stroke();

          // Roof top (bright / color)
          ctx.beginPath();
          ctx.moveTo(bx, by - hh - height);
          ctx.lineTo(bx + hw, by - height);
          ctx.lineTo(bx, by + hh - height);
          ctx.lineTo(bx - hw, by - height);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#ffffff';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();

          // Window glow at night
          if (this.timeOfDay === 'night' || this.timeOfDay === 'sunset') {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(bx - hw * 0.4, by - height * 0.5, 4 * this.zoom, 4 * this.zoom);
            ctx.fillRect(bx + hw * 0.2, by - height * 0.5, 4 * this.zoom, 4 * this.zoom);
          }
        }
      }
    });

    // Draw Ghost Placement Box
    if (this.ghostDefId && this.hoveredTile) {
      const def = BUILDING_MAP.get(this.ghostDefId);
      if (def) {
        const pt = this.gridToScreen(this.hoveredTile.x, this.hoveredTile.z);
        if (isBlueprint) {
          const step = 32 * this.zoom;
          ctx.strokeStyle = '#22c55e';
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.lineWidth = 2;
          ctx.fillRect(pt.x, pt.y, def.size[0] * step, def.size[1] * step);
          ctx.strokeRect(pt.x, pt.y, def.size[0] * step, def.size[1] * step);
        } else {
          const hw = (this.tileW / 2) * this.zoom * def.size[0];
          const hh = (this.tileH / 2) * this.zoom * def.size[1];
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - hh);
          ctx.lineTo(pt.x + hw, pt.y);
          ctx.lineTo(pt.x, pt.y + hh);
          ctx.lineTo(pt.x - hw, pt.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
          ctx.fill();
          ctx.strokeStyle = '#86efac';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  public captureSnapshot(): string {
    return this.canvas.toDataURL('image/png');
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
