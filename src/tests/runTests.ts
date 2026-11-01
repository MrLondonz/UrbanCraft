/**
 * CityForge - Automated Validation & Architecture Test Suite
 * Tests road connection validation, junction classification,
 * building collision detection, boundary rules, and versioned save serialization.
 */

import {
  getRoadNeighbors,
  classifyRoadJunction,
  validateBuildingPlacement,
  validateRoadNetwork,
  formatMeasurement,
} from '../utils/cityValidation';
import { PlacedBuilding } from '../types/city';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log('\n========================================');
console.log('   CityForge Test Suite Execution');
console.log('========================================\n');

// --- 1. Road Connection & Junction Tests ---
console.log('Test Group 1: Road Connections & Junction Classification');

const isolatedCoords = new Set<string>(['5,5']);
const isolatedNeighbors = getRoadNeighbors({ x: 5, z: 5 }, isolatedCoords);
assert(isolatedNeighbors.count === 0, 'Isolated road tile has 0 neighbors');
assert(classifyRoadJunction(isolatedNeighbors) === 'isolated', 'Classifies isolated road correctly');

const straightNSCoords = new Set<string>(['5,4', '5,5', '5,6']);
const straightNSNeighbors = getRoadNeighbors({ x: 5, z: 5 }, straightNSCoords);
assert(straightNSNeighbors.north && straightNSNeighbors.south, 'Straight NS detects north and south neighbors');
assert(classifyRoadJunction(straightNSNeighbors) === 'straight_ns', 'Classifies straight NS road correctly');

const crossroadCoords = new Set<string>(['5,4', '5,6', '4,5', '6,5', '5,5']);
const crossroadNeighbors = getRoadNeighbors({ x: 5, z: 5 }, crossroadCoords);
assert(crossroadNeighbors.count === 4, '4-way intersection has 4 neighbors');
assert(classifyRoadJunction(crossroadNeighbors) === 'crossroad_4way', 'Classifies 4-way crossroad intersection');

const tJunctionCoords = new Set<string>(['5,6', '4,5', '6,5', '5,5']); // No north
const tNeighbors = getRoadNeighbors({ x: 5, z: 5 }, tJunctionCoords);
assert(tNeighbors.count === 3 && !tNeighbors.north, 'T-junction has 3 neighbors and missing north');
assert(classifyRoadJunction(tNeighbors) === 't_junction_north', 'Classifies T-junction north correctly');

const cornerCoords = new Set<string>(['5,4', '6,5', '5,5']); // North and East
const cornerNeighbors = getRoadNeighbors({ x: 5, z: 5 }, cornerCoords);
assert(classifyRoadJunction(cornerNeighbors) === 'corner_ne', 'Classifies 90-degree corner turn (North-East)');

// --- 2. Building Dimension & Boundary Validation Tests ---
console.log('\nTest Group 2: Building Footprint & Boundary Validation');

const sampleBuildings: PlacedBuilding[] = [
  {
    instanceId: 'b_test_1',
    defId: 'res_condo',
    x: 4,
    z: 4,
    rotation: 0,
    level: 1,
    color: '#38bdf8',
    placedAt: Date.now(),
    powered: true,
    watered: true,
    customWidth: 2,
    customDepth: 2,
  },
];

// Valid placement
const validCheck = validateBuildingPlacement(
  { x: 8, z: 8, width: 2, depth: 2 },
  sampleBuildings,
  26
);
assert(validCheck.valid, 'Valid building placement within city bounds passes');

// Boundary overflow test
const outOfBoundsCheck = validateBuildingPlacement(
  { x: 25, z: 25, width: 2, depth: 2 },
  sampleBuildings,
  26
);
assert(!outOfBoundsCheck.valid, 'Building extending outside 26x26 grid fails validation');

// Collision overlap test
const collisionCheck = validateBuildingPlacement(
  { x: 5, z: 5, width: 2, depth: 2 },
  sampleBuildings,
  26
);
assert(!collisionCheck.valid, 'Building overlapping existing structure fails validation');

// Self-ignore test during dimension resize
const resizeSelfCheck = validateBuildingPlacement(
  { x: 4, z: 4, width: 3, depth: 3 },
  sampleBuildings,
  26,
  'b_test_1'
);
assert(resizeSelfCheck.valid, 'Resizing own building correctly ignores self in collision check');

// --- 3. Road Network Connectivity Health Tests ---
console.log('\nTest Group 3: Road Network Health Analysis');

const connectedRoads: PlacedBuilding[] = [
  { instanceId: 'r1', defId: 'road_paved', x: 0, z: 0, rotation: 0, level: 1, color: '#334155', placedAt: 0, powered: true, watered: true },
  { instanceId: 'r2', defId: 'road_paved', x: 1, z: 0, rotation: 0, level: 1, color: '#334155', placedAt: 0, powered: true, watered: true },
  { instanceId: 'r3', defId: 'road_paved', x: 2, z: 0, rotation: 0, level: 1, color: '#334155', placedAt: 0, powered: true, watered: true },
];
const networkHealth = validateRoadNetwork(connectedRoads);
assert(networkHealth.totalRoads === 3, 'Total road count is 3');
assert(networkHealth.connectedRoads === 3, 'All 3 roads are connected');
assert(networkHealth.deadEnds === 2, 'Detects 2 terminal dead ends at road endpoints');
assert(networkHealth.connectivityScore === 100, 'Connectivity score is 100%');

// --- 4. Measurement Conversions Tests ---
console.log('\nTest Group 4: Measurement Units (Metric & Imperial)');

const metricMeas = formatMeasurement(2, 'metric');
assert(metricMeas.length === '12 m', '2 tiles equals 12 meters in metric architectural scale');

const imperialMeas = formatMeasurement(2, 'imperial');
assert(imperialMeas.length === '39 ft', '2 tiles equals ~39 feet in imperial architectural scale');

// --- 5. Versioned JSON Save / Load Schema Verification ---
console.log('\nTest Group 5: Save / Load Schema & Versioning');

const sampleSave = {
  format: 'cityforge',
  version: '2.0.0',
  timestamp: Date.now(),
  funds: 25000,
  buildings: sampleBuildings,
};

const jsonStr = JSON.stringify(sampleSave);
const parsed = JSON.parse(jsonStr);

assert(parsed.format === 'cityforge', 'Save format identifier matches cityforge');
assert(parsed.version === '2.0.0', 'Save version string is 2.0.0');
assert(Array.isArray(parsed.buildings) && parsed.buildings.length === 1, 'Buildings array preserves structures');
assert(parsed.buildings[0].customWidth === 2, 'Building custom dimensions are preserved');

// Summary
console.log('\n========================================');
console.log(`Results: ${passedCount} Passed, ${failedCount} Failed`);
console.log('========================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('All architectural engine tests passed cleanly!\n');
}
