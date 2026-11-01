import { PlacedBuilding } from '../types/city';

export interface CityTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  startingFunds: number;
  buildings: PlacedBuilding[];
}

export const CITY_TEMPLATES: CityTemplate[] = [
  {
    id: 'downtown_block_a',
    name: 'Downtown Block A',
    tagline: 'Urban Architectural District',
    description: 'A realistic downtown city block featuring modern architectural residential towers, balconies, tree-lined boulevards, crosswalks, and retail plazas.',
    startingFunds: 25000,
    buildings: [
      // Central Hero Architectural Building (Building_006 in screenshot)
      {
        instanceId: 'b_006',
        defId: 'res_condo',
        customName: 'Building_006',
        x: 10,
        z: 11,
        rotation: 0,
        level: 3,
        color: '#b0b0b0',
        customWidth: 3,
        customDepth: 3,
        customHeightFloors: 6,
        materialFinish: 'concrete',
        roofStyle: 'flat',
        windowsStyle: 'modern_glass',
        balcony: true,
        placedAt: 1,
        powered: true,
        watered: true,
      },
      // Major Roads Main Grid
      { instanceId: 'r1', defId: 'road_avenue', x: 12, z: 6, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r2', defId: 'road_avenue', x: 12, z: 7, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r3', defId: 'road_avenue', x: 12, z: 8, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r4', defId: 'road_avenue', x: 12, z: 9, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r5', defId: 'road_avenue', x: 12, z: 10, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r6', defId: 'road_avenue', x: 12, z: 11, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r7', defId: 'road_avenue', x: 12, z: 12, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r8', defId: 'road_avenue', x: 12, z: 13, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r9', defId: 'road_avenue', x: 12, z: 14, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r10', defId: 'road_avenue', x: 12, z: 15, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r11', defId: 'road_avenue', x: 12, z: 16, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },

      // Cross street at z=10
      { instanceId: 'r12', defId: 'road_paved', x: 7, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r13', defId: 'road_paved', x: 8, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r14', defId: 'road_paved', x: 9, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r15', defId: 'road_paved', x: 10, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r16', defId: 'road_paved', x: 11, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r17', defId: 'road_paved', x: 13, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r18', defId: 'road_paved', x: 14, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r19', defId: 'road_paved', x: 15, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r20', defId: 'road_paved', x: 16, z: 10, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },

      // Cross street at z=14
      { instanceId: 'r21', defId: 'road_paved', x: 7, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r22', defId: 'road_paved', x: 8, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r23', defId: 'road_paved', x: 9, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r24', defId: 'road_paved', x: 10, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r25', defId: 'road_paved', x: 11, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r26', defId: 'road_paved', x: 13, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r27', defId: 'road_paved', x: 14, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r28', defId: 'road_paved', x: 15, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'r29', defId: 'road_paved', x: 16, z: 14, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },

      // Water canal
      { instanceId: 'c1', defId: 'nat_canal', x: 6, z: 8, rotation: 0, level: 1, color: '#0284c7', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c2', defId: 'nat_canal', x: 6, z: 9, rotation: 0, level: 1, color: '#0284c7', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c3', defId: 'bridge_water', x: 6, z: 10, rotation: 0, level: 1, color: '#dc2626', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c4', defId: 'nat_canal', x: 6, z: 11, rotation: 0, level: 1, color: '#0284c7', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c5', defId: 'nat_canal', x: 6, z: 12, rotation: 0, level: 1, color: '#0284c7', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c6', defId: 'nat_canal', x: 6, z: 13, rotation: 0, level: 1, color: '#0284c7', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c7', defId: 'bridge_water', x: 6, z: 14, rotation: 0, level: 1, color: '#dc2626', placedAt: 1, powered: true, watered: true },
      { instanceId: 'c8', defId: 'nat_canal', x: 6, z: 15, rotation: 0, level: 1, color: '#0284c7', placedAt: 1, powered: true, watered: true },

      // High-Rise Skyscraper District
      { instanceId: 'b1', defId: 'res_skyscraper', x: 9, z: 7, rotation: 0, level: 2, color: '#38bdf8', customName: 'Azure Heights Tower', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b2', defId: 'com_tower', x: 14, z: 7, rotation: 0, level: 2, color: '#0284c7', customName: 'Pinnacle Financial Center', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b3', defId: 'com_office', x: 14, z: 11, rotation: 0, level: 2, color: '#6366f1', customName: 'Cybernetics Labs', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b4', defId: 'res_apartment', x: 9, z: 11, rotation: 0, level: 2, color: '#f1f5f9', customName: 'Parkside Condominiums', placedAt: 1, powered: true, watered: true },

      // Mid-Rise & Heritage
      { instanceId: 'b5', defId: 'res_brownstone', x: 8, z: 12, rotation: 0, level: 2, color: '#991b1b', customName: 'Founders Row', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b6', defId: 'com_supermarket', x: 14, z: 15, rotation: 0, level: 1, color: '#16a34a', customName: 'Central Grocery Market', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b7', defId: 'com_cafe', x: 10, z: 15, rotation: 0, level: 2, color: '#f59e0b', customName: 'Cafe Solarium', placedAt: 1, powered: true, watered: true },

      // Civic & Utilities
      { instanceId: 'b8', defId: 'civic_police', x: 7, z: 15, rotation: 0, level: 1, color: '#1e3a8a', customName: '1st Precinct Police', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b9', defId: 'civic_fire', x: 7, z: 11, rotation: 0, level: 1, color: '#b91c1c', customName: 'Station 4 Fire Dept', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b10', defId: 'util_solar', x: 13, z: 17, rotation: 0, level: 2, color: '#0284c7', customName: 'Solar Field Alpha', placedAt: 1, powered: true, watered: true },
      { instanceId: 'b11', defId: 'util_water_tower', x: 16, z: 17, rotation: 0, level: 1, color: '#0ea5e9', customName: 'South Aquifer Tower', placedAt: 1, powered: true, watered: true },

      // Plazas & Parks
      { instanceId: 'p1', defId: 'park_fountain', x: 10, z: 9, rotation: 0, level: 1, color: '#38bdf8', customName: 'Liberty Fountain Plaza', placedAt: 1, powered: true, watered: true },
      { instanceId: 'p2', defId: 'nat_cherry', x: 8, z: 9, rotation: 0, level: 1, color: '#f472b6', placedAt: 1, powered: true, watered: true },
      { instanceId: 'p3', defId: 'nat_forest', x: 15, z: 9, rotation: 0, level: 1, color: '#16a34a', placedAt: 1, powered: true, watered: true },
    ],
  },
  {
    id: 'eco_haven',
    name: 'Solaria Eco-Village',
    tagline: 'Sustainable Net-Zero Community',
    description: 'An idyllic green haven powered 100% by solar and wind microgrids, nestled amidst botanical conservatories, organic farms, and timber cottages.',
    startingFunds: 9000,
    buildings: [
      // Roads
      { instanceId: 'er1', defId: 'road_avenue', x: 11, z: 9, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er2', defId: 'road_avenue', x: 11, z: 10, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er3', defId: 'road_avenue', x: 11, z: 11, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er4', defId: 'road_avenue', x: 11, z: 12, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er5', defId: 'road_avenue', x: 11, z: 13, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er6', defId: 'road_avenue', x: 11, z: 14, rotation: 0, level: 1, color: '#1e293b', placedAt: 1, powered: true, watered: true },

      { instanceId: 'er7', defId: 'road_paved', x: 9, z: 11, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er8', defId: 'road_paved', x: 10, z: 11, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er9', defId: 'road_paved', x: 12, z: 11, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },
      { instanceId: 'er10', defId: 'road_paved', x: 13, z: 11, rotation: 0, level: 1, color: '#334155', placedAt: 1, powered: true, watered: true },

      // Cottages & Eco Villas
      { instanceId: 'eb1', defId: 'res_suburb', x: 8, z: 9, rotation: 0, level: 2, color: '#f8fafc', customName: 'Solar Meadow Villa', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb2', defId: 'res_cottage', x: 8, z: 12, rotation: 0, level: 2, color: '#16a34a', customName: 'Fern Cottage', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb3', defId: 'res_cottage', x: 8, z: 13, rotation: 0, level: 2, color: '#d97706', customName: 'Cedar House', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb4', defId: 'com_cafe', x: 9, z: 10, rotation: 0, level: 2, color: '#10b981', customName: 'Organic Greens Roastery', placedAt: 1, powered: true, watered: true },

      // Wind & Solar
      { instanceId: 'eb5', defId: 'util_solar', x: 13, z: 9, rotation: 0, level: 2, color: '#0284c7', customName: 'East Photovoltaic Farm', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb6', defId: 'util_wind', x: 15, z: 9, rotation: 0, level: 2, color: '#f8fafc', customName: 'Ridge Turbine A', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb7', defId: 'util_wind', x: 15, z: 11, rotation: 0, level: 2, color: '#f8fafc', customName: 'Ridge Turbine B', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb8', defId: 'util_water_tower', x: 14, z: 13, rotation: 0, level: 1, color: '#38bdf8', customName: 'Clean Aquifer Res', placedAt: 1, powered: true, watered: true },

      // Botanical Glasshouse & Forest
      { instanceId: 'eb9', defId: 'park_botanical', x: 12, z: 12, rotation: 0, level: 1, color: '#15803d', customName: 'Eden Botanical Pavilion', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb10', defId: 'nat_forest', x: 7, z: 10, rotation: 0, level: 1, color: '#15803d', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb11', defId: 'nat_forest', x: 7, z: 11, rotation: 0, level: 1, color: '#14532d', placedAt: 1, powered: true, watered: true },
      { instanceId: 'eb12', defId: 'nat_cherry', x: 10, z: 10, rotation: 0, level: 1, color: '#ec4899', placedAt: 1, powered: true, watered: true },
    ],
  },
  {
    id: 'empty_plot',
    name: 'Blank Blueprint',
    tagline: 'Start Fresh from Scratch',
    description: 'A clear pristine canvas ready for your creative master architecture plan. Full starter budget to design your dream city.',
    startingFunds: 10000,
    buildings: [],
  },
];
