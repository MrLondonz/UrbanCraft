/**
 * UrbanCraft 5D - Core Types & Definitions
 */

export type BuildingCategory = 
  | 'transport'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'civic'
  | 'leisure'
  | 'nature'
  | 'infrastructure';

export type GroundType = 'grass' | 'water' | 'sand' | 'pavement' | 'rock';

export interface GridTile {
  x: number;
  z: number;
  groundType: GroundType;
  elevation: number;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  description: string;
  cost: number;
  size: [number, number]; // [width (x), depth (z)]
  powerDelta: number; // positive = consumes, negative = generates
  waterDelta: number; // positive = consumes, negative = generates
  populationCapacity: number;
  jobsProvided: number;
  revenuePerDay: number;
  pollution: number; // -10 to +15
  happinessBonus: number;
  maxLevel: number;
  colorOptions: string[];
  icon: string;
}

export type FurnitureCategory =
  | 'living'
  | 'bedroom'
  | 'kitchen'
  | 'office'
  | 'cafe'
  | 'lifts'
  | 'decor';

export interface FurnitureDefinition {
  id: string;
  name: string;
  category: FurnitureCategory;
  description: string;
  cost: number;
  dimensions: [number, number, number]; // [width, height, depth]
  comfortBonus: number;
  rentBonus: number;
  colorOptions: string[];
  finishes: string[];
  icon: string;
}

export interface PlacedFurniture {
  instanceId: string;
  defId: string;
  x: number;
  z: number;
  y: number;
  floorNumber?: number; // 1 = Ground Floor, 2 = Floor 2, 3 = Floor 3, 4 = Rooftop
  rotation: number; // in degrees 0-360
  color: string;
  finish: string;
}

export interface RoomOccupant {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  floorNumber?: number;
  activity: string; // e.g. 'relaxing on sofa', 'cooking dinner', 'working on laptop'
}

export interface FloorPlanWall {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  thickness?: number;
  height?: number;
  floorNumber: number;
  wallType?: 'solid' | 'glass' | 'brick';
}

export interface FloorPlanDoor {
  id: string;
  x: number;
  z: number;
  rotation: number;
  width: number;
  floorNumber: number;
  doorType: 'standard' | 'double_pivot' | 'sliding';
}

export interface FloorPlanWindow {
  id: string;
  x: number;
  z: number;
  rotation: number;
  width: number;
  floorNumber: number;
  windowType: 'standard' | 'panoramic' | 'ribbon';
}

export interface FloorPlanRoom {
  id: string;
  name: string;
  bounds: { x: number; z: number; width: number; depth: number };
  color: string;
  floorNumber: number;
}

export interface BuildingInterior {
  roomWidth: number;
  roomDepth: number;
  wallColor: string;
  floorType: 'oak_parquet' | 'marble_tile' | 'polished_concrete' | 'cozy_carpet';
  furniture: PlacedFurniture[];
  occupants: RoomOccupant[];
  activeFloor?: number; // Currently viewed floor in Planner 5D editor (1, 2, 3, 4)
  floorsCount?: number; // Total floors available for this building
  walls?: FloorPlanWall[];
  doors?: FloorPlanDoor[];
  windows?: FloorPlanWindow[];
  rooms?: FloorPlanRoom[];
}

export interface PlacedBuilding {
  instanceId: string;
  defId: string;
  x: number;
  z: number;
  y?: number; // Elevation from ground level (m)
  rotation: 0 | 90 | 180 | 270;
  level: number;
  color: string;
  customName?: string;
  placedAt: number;
  powered: boolean;
  watered: boolean;
  interior?: BuildingInterior;
  customWidth?: number;
  customDepth?: number;
  customHeightFloors?: number;
  roofStyle?: 'flat' | 'pitched' | 'mansard' | 'penthouse';
  architecturalStyle?: 'modern_glass' | 'classic_brick' | 'timber_eco' | 'concrete_brutalist';
  materialFinish?: 'concrete' | 'brick' | 'timber' | 'glass' | 'stucco' | 'steel' | 'asphalt';
  roughness?: number;
  metalness?: number;
  opacity?: number;
  isLocked?: boolean;
  balcony?: boolean;
  windowsStyle?: 'modern_glass' | 'panoramic' | 'ribbon';
}

export interface CityMetrics {
  funds: number;
  dailyIncome: number;
  dailyExpenses: number;
  population: number;
  happiness: number; // 0 - 100
  powerProduced: number;
  powerConsumed: number;
  waterProduced: number;
  waterConsumed: number;
  pollutionScore: number; // 0 - 100
  jobsTotal: number;
  employmentRate: number; // 0 - 100
  dayCount: number;
}

export interface TaxRates {
  residential: number; // e.g. 9 (%)
  commercial: number;
  industrial: number;
}

export interface ServiceFunding {
  safety: number; // percentage (50% - 150%)
  health: number;
  education: number;
  parks: number;
}

export type ToolMode = 'plan' | 'inspect' | 'demolish' | 'camera' | 'vehicle' | 'road_segment' | 'custom_builder' | 'wall_draw';
export type ViewPerspective = '3d' | '2d_blueprint' | 'first_person';
export type CameraPreset = 'orbit' | 'top' | 'front' | 'side' | 'iso' | 'perspective';
export type RenderQuality = 'ultra' | 'performance';
export type SnappingMode = 0.5 | 1.0 | 2.0 | 0;
export type TimeOfDay = 'day' | 'sunset' | 'night';
export type CutawayFloor = 'all' | 1 | 2 | 3 | 4;
export type MeasurementUnit = 'metric' | 'imperial';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetMetric: 'population' | 'funds' | 'happiness' | 'buildings' | 'greenEnergy';
  targetValue: number;
  rewardFunds: number;
  rewardPop: number;
  completed: boolean;
  claimed: boolean;
}

export interface CityEventNews {
  id: string;
  text: string;
  timestamp: number;
  type: 'info' | 'positive' | 'warning';
}

export interface VehicleDefinition {
  id: string;
  name: string;
  category: 'civilian' | 'emergency' | 'transit' | 'utility';
  description: string;
  cost: number;
  speed: number;
  color: string;
  colorOptions: string[];
  icon: string;
  hasSiren?: boolean;
}

export interface SpawnedVehicle {
  id: string;
  defId: string;
  name: string;
  x: number;
  z: number;
  color: string;
  speed: number;
  targetCoord: { x: number; z: number };
  heading: number;
  hasSiren?: boolean;
  isUserPlaced?: boolean;
}
