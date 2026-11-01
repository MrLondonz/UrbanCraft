/**
 * CityForge - Architectural & City Validation Engine
 * Validates road connections, junctions, building dimensions, boundaries, and spatial measurements.
 */

import { PlacedBuilding } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';

export interface RoadNeighbors {
  north: boolean; // z - 1
  south: boolean; // z + 1
  east: boolean;  // x + 1
  west: boolean;  // x - 1
  count: number;
}

export type JunctionType =
  | 'crossroad_4way'
  | 't_junction_north' // opens south, east, west (closed on north)
  | 't_junction_south' // opens north, east, west (closed on south)
  | 't_junction_east'  // opens north, south, west (closed on east)
  | 't_junction_west'  // opens north, south, east (closed on west)
  | 'straight_ns'
  | 'straight_ew'
  | 'corner_ne'
  | 'corner_nw'
  | 'corner_se'
  | 'corner_sw'
  | 'dead_end_n'
  | 'dead_end_s'
  | 'dead_end_e'
  | 'dead_end_w'
  | 'isolated';

export function isRoadBuilding(b: PlacedBuilding): boolean {
  return (
    b.defId === 'road_paved' ||
    b.defId === 'road_avenue' ||
    b.defId === 'bridge_water' ||
    b.defId === 'infra_parking_bay'
  );
}

/**
 * Identify neighbors of a road tile on cardinal axes
 */
export function getRoadNeighbors(
  coord: { x: number; z: number },
  roadCoordinates: Set<string>
): RoadNeighbors {
  const north = roadCoordinates.has(`${coord.x},${coord.z - 1}`);
  const south = roadCoordinates.has(`${coord.x},${coord.z + 1}`);
  const east = roadCoordinates.has(`${coord.x + 1},${coord.z}`);
  const west = roadCoordinates.has(`${coord.x - 1},${coord.z}`);
  const count = (north ? 1 : 0) + (south ? 1 : 0) + (east ? 1 : 0) + (west ? 1 : 0);

  return { north, south, east, west, count };
}

/**
 * Classify road junction geometry for rendering and traffic simulation
 */
export function classifyRoadJunction(n: RoadNeighbors): JunctionType {
  if (n.count === 4) return 'crossroad_4way';

  if (n.count === 3) {
    if (!n.north) return 't_junction_north';
    if (!n.south) return 't_junction_south';
    if (!n.east) return 't_junction_east';
    if (!n.west) return 't_junction_west';
  }

  if (n.count === 2) {
    if (n.north && n.south) return 'straight_ns';
    if (n.east && n.west) return 'straight_ew';
    if (n.north && n.east) return 'corner_ne';
    if (n.north && n.west) return 'corner_nw';
    if (n.south && n.east) return 'corner_se';
    if (n.south && n.west) return 'corner_sw';
  }

  if (n.count === 1) {
    if (n.north) return 'dead_end_s'; // connects from north, ends facing south
    if (n.south) return 'dead_end_n';
    if (n.east) return 'dead_end_w';
    if (n.west) return 'dead_end_e';
  }

  return 'isolated';
}

/**
 * Validate building footprint dimensions against the city grid bounds
 * and against collisions with existing placed structures.
 */
export function validateBuildingPlacement(
  target: { x: number; z: number; width: number; depth: number },
  existingBuildings: PlacedBuilding[],
  gridSize: number,
  ignoreInstanceId?: string
): { valid: boolean; reason?: string } {
  // 1. Grid boundary check
  if (target.width <= 0 || target.depth <= 0) {
    return { valid: false, reason: 'Dimensions must be at least 1x1 tile' };
  }

  if (
    target.x < 0 ||
    target.z < 0 ||
    target.x + target.width > gridSize ||
    target.z + target.depth > gridSize
  ) {
    return {
      valid: false,
      reason: `Footprint extends beyond the ${gridSize}x${gridSize} city parcel boundary`,
    };
  }

  // 2. Collision with other structures
  for (const b of existingBuildings) {
    if (ignoreInstanceId && b.instanceId === ignoreInstanceId) continue;

    const def = BUILDING_MAP.get(b.defId);
    const bWidth = b.customWidth || def?.size[0] || 1;
    const bDepth = b.customDepth || def?.size[1] || 1;

    // Overlap test (AABB in 2D grid space)
    const overlapX = target.x < b.x + bWidth && target.x + target.width > b.x;
    const overlapZ = target.z < b.z + bDepth && target.z + target.depth > b.z;

    if (overlapX && overlapZ) {
      return {
        valid: false,
        reason: `Overlaps existing structure '${b.customName || def?.name || b.defId}'`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate city-wide road network connectivity and junction health
 */
export function validateRoadNetwork(buildings: PlacedBuilding[]): {
  totalRoads: number;
  connectedRoads: number;
  deadEnds: number;
  connectivityScore: number;
  isolatedRoads: number;
} {
  const roadBuildings = buildings.filter(isRoadBuilding);
  const totalRoads = roadBuildings.length;

  if (totalRoads === 0) {
    return {
      totalRoads: 0,
      connectedRoads: 0,
      deadEnds: 0,
      connectivityScore: 100,
      isolatedRoads: 0,
    };
  }

  const coordSet = new Set<string>();
  for (const b of roadBuildings) {
    coordSet.add(`${b.x},${b.z}`);
  }

  let deadEnds = 0;
  let isolatedRoads = 0;
  let connectedRoads = 0;

  for (const b of roadBuildings) {
    const neighbors = getRoadNeighbors({ x: b.x, z: b.z }, coordSet);
    if (neighbors.count === 0) {
      isolatedRoads++;
    } else {
      connectedRoads++;
      if (neighbors.count === 1) {
        deadEnds++;
      }
    }
  }

  const connectivityScore = Math.round((connectedRoads / totalRoads) * 100);

  return {
    totalRoads,
    connectedRoads,
    deadEnds,
    connectivityScore,
    isolatedRoads,
  };
}

/**
 * Format measurements in metric (meters / m²) or imperial (feet / sq ft)
 * 1 grid tile = 6.0 meters (approx 20 ft) in standard architectural scale
 */
export function formatMeasurement(
  tiles: number,
  unit: 'metric' | 'imperial' = 'metric'
): { length: string; area: string } {
  const METERS_PER_TILE = 6.0;
  const FEET_PER_TILE = 19.685;

  if (unit === 'imperial') {
    const ft = Math.round(tiles * FEET_PER_TILE);
    const sqFt = Math.round(tiles * tiles * FEET_PER_TILE * FEET_PER_TILE);
    return {
      length: `${ft} ft`,
      area: `${sqFt} sq ft`,
    };
  }

  const m = Math.round(tiles * METERS_PER_TILE);
  const sqM = Math.round(tiles * tiles * METERS_PER_TILE * METERS_PER_TILE);
  return {
    length: `${m} m`,
    area: `${sqM} m²`,
  };
}
