# CityForge — 3D Browser City-Building & Architectural Design Studio

CityForge is a modern, high-performance, browser-based 3D city-building and architectural design platform built with **TypeScript**, **React**, and **Three.js**. It combines city-level infrastructure planning with room-by-room architectural floor-plan design.

---

## 🌟 Core Features

1. **3D Viewport & First-Person Exploration**:
   - Smooth isometric orbit, pan, and continuous zoom.
   - **First-Person Street Walk Mode (Press F)**: Step down to street level (eye height ~1.7m) and explore your streets, avenues, pedestrian crossings, and buildings using **WASD / Arrow keys** and mouse look.
   - 2D Technical Architectural Blueprint mode with top-down technical projection.

2. **Custom Building Generator & Spatial Dimension Editor**:
   - Create custom structures from scratch with adjustable **Width (1-6 tiles)**, **Depth (1-6 tiles)**, and **Height (1-12 floors)**.
   - Choose architectural facade styles (Modern Glass Curtain Wall, Classic Brick, Sustainable Timber, Brutalist Concrete) and roof profiles (Rooftop Deck Terrace, Pitched Gabled, Mansard).
   - Real-time dimension bounds and spatial collision validation.

3. **Floor-Plan Editor (Walls, Rooms, Doors, Windows)**:
   - Step inside any structure to design room layouts floor by floor.
   - **Wall Drawing Tool**: Click points on the architectural grid to construct interior partition walls.
   - **Door & Window Placement**: Add single doors, architectural pivot entrances, and panoramic windows with rotation and dimensions.
   - **Room Zoning**: Define and label functional zones (Living Room, Master Suite, Chef Kitchen, Executive Office, Ensuite Bath) with live square footage and metric area calculations ($m^2$ and $sq\ ft$).

4. **Multi-Floor Architecture & Vertical Transit**:
   - Multi-floor navigation (Ground Floor, Floor 2, Floor 3, Rooftop Terrace).
   - Furniture and architectural elements: high-speed elevator shafts, cast-iron spiral stairs, floating glass cantilever stairs, and dual moving escalators.

5. **Dynamic Connected Road Networks & Junctions**:
   - Procedural junction classification: Automatically renders **4-way crossroads**, **T-junctions**, **straight roads**, **90-degree corner turns**, and **cul-de-sac dead ends**.
   - Pedestrian infrastructure: Sidewalks, curbs, textured crosswalks, tactile paving, and procedural streetlights that illuminate at dusk and night.
   - Road network connectivity validation algorithm.

6. **Procedural 3D Assets**:
   - Original procedural geometry for electric sedans, transit buses, emergency vehicles, streetlights, shade trees, bridges, canals, and civic landmarks.

7. **Object Inspector & Properties Panel**:
   - Inspect any placed building to view residents, jobs, power/water demand, revenue, and finish options.
   - Duplicate structures with identical properties (**Press D**).
   - Instant demolition and rebuild.

8. **Undo / Redo & Adjustable Measurements**:
   - Full history stack with **Undo (Ctrl+Z)** and **Redo (Ctrl+Y)**.
   - Toggle between **Metric ($m$ / $m^2$)** and **Imperial ($ft$ / $sq\ ft$)** architectural units.

9. **Versioned Project Save & Load**:
   - Standardized versioned JSON format (`cityforge` v2.0.0).
   - Quick Save to browser local storage.
   - File Export and Import with validation.

---

## 🚀 Setup & Running Instructions

### Prerequisites
- Node.js (version 18 or higher)
- npm or bun

### Installation
```bash
# Install dependencies
npm install
```

### Development Server
```bash
# Start local development server on port 3000
npm run dev
```

### Production Build
```bash
# Compile and build production bundle
npm run build
```

### Automated Tests
```bash
# Run the automated architectural engine and validation test suite
npm test
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **WASD** / **Arrows** | Walk in First-Person Street Mode |
| **F** | Toggle First-Person Exploration View |
| **R** | Rotate active blueprint or selected building 90° |
| **D** | Duplicate currently selected building |
| **Ctrl + Z** / **⌘ + Z** | Undo last placement or edit |
| **Ctrl + Y** / **⌘ + Y** | Redo last reverted edit |
| **B** | Toggle 2D Blueprint / 3D Isometric View |
| **Space** | Pause / Resume city simulation |
| **1 / 2 / 3** | Set simulation game speed |
| **Esc** | Exit First-Person mode or clear tool selection |

---

## 🏗️ Project Architecture

```
/
├── src/
│   ├── components/       # React UI components (TopBar, Toolbar, InspectorModal, InteriorStudioModal, CustomBuildingModal, etc.)
│   ├── engine/           # 3D Three.js & 2D Canvas engines (city3dScene, interior3dScene, city2dCanvas)
│   ├── hooks/            # City simulation state & undo/redo history hook (useCitySimulation)
│   ├── utils/            # Road junction classification, dimension bounds validation & audio engine
│   ├── types/            # TypeScript interfaces for buildings, roads, floor-plans, and metrics
│   ├── tests/            # Automated test suite (runTests.ts)
│   ├── data/             # Catalogs for buildings, furniture, vehicles, and templates
│   ├── App.tsx           # Main application entry component
│   └── main.tsx          # Application bootstrapper
├── package.json
└── README.md
```
