/**
 * UrbanCraft - Professional Architectural PBR Materials Engine
 * Procedural texture synthesizers and physically based materials
 * for realistic concrete, asphalt, glass, brick, timber, metals, and vegetation.
 */
import * as THREE from 'three';

// Procedural Canvas Texture Generators
function createNoisePattern(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number = 0.1) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = (Math.random() - 0.5) * 255 * opacity;
    data[i] = Math.min(255, Math.max(0, data[i] + val));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + val));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + val));
  }
  ctx.putImageData(imgData, 0, 0);
}

export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt
  ctx.fillStyle = '#26282b';
  ctx.fillRect(0, 0, 512, 512);

  // Fine aggregate speckles
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.5 + 0.5;
    const gray = Math.floor(Math.random() * 60 + 35);
    ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  createNoisePattern(ctx, 512, 512, 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Architectural board-formed concrete
  ctx.fillStyle = '#8f9499';
  ctx.fillRect(0, 0, 512, 512);

  // Formwork seams (subtle horizontal panel lines)
  ctx.strokeStyle = '#7c8085';
  ctx.lineWidth = 1.5;
  for (let y = 128; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Form tie holes
    for (let x = 64; x < 512; x += 128) {
      ctx.fillStyle = '#5c6065';
      ctx.beginPath();
      ctx.arc(x, y - 64, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9ca0a6';
      ctx.beginPath();
      ctx.arc(x, y - 64, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  createNoisePattern(ctx, 512, 512, 0.12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Mortar base
  ctx.fillStyle = '#c7beaf';
  ctx.fillRect(0, 0, 512, 512);

  const brickH = 28;
  const brickW = 64;
  const mortar = 4;

  let row = 0;
  for (let y = 0; y < 512; y += brickH + mortar) {
    const offset = (row % 2) * (brickW / 2);
    for (let x = -brickW; x < 512 + brickW; x += brickW + mortar) {
      const shade = Math.floor(Math.random() * 30 - 15);
      const r = Math.min(255, Math.max(0, 168 + shade));
      const g = Math.min(255, Math.max(0, 72 + Math.floor(shade * 0.8)));
      const b = Math.min(255, Math.max(0, 54 + Math.floor(shade * 0.7)));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + offset, y, brickW, brickH);
    }
    row++;
  }

  createNoisePattern(ctx, 512, 512, 0.15);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm cedar base
  ctx.fillStyle = '#9c6644';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 48;
  for (let y = 0; y < 512; y += plankH) {
    ctx.strokeStyle = '#582f0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Wood grain lines
    ctx.strokeStyle = 'rgba(74, 38, 12, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const gy = y + Math.random() * plankH;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(150, gy + (Math.random() - 0.5) * 8, 350, gy + (Math.random() - 0.5) * 8, 512, gy);
      ctx.stroke();
    }
  }

  createNoisePattern(ctx, 512, 512, 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Light sidewalk stone tile
  ctx.fillStyle = '#b0b7bd';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64;
  ctx.strokeStyle = '#858c94';
  ctx.lineWidth = 2;

  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  createNoisePattern(ctx, 512, 512, 0.07);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Natural architectural landscape lawn
  ctx.fillStyle = '#2f5233';
  ctx.fillRect(0, 0, 512, 512);

  // Micro blade variation
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const green = Math.floor(Math.random() * 40 + 60);
    ctx.fillStyle = `rgb(${green - 20}, ${green + 20}, ${green - 30})`;
    ctx.fillRect(x, y, 2, 3);
  }

  createNoisePattern(ctx, 512, 512, 0.1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

export interface PBRMaterialLibrary {
  asphalt: THREE.MeshStandardMaterial;
  curbConcrete: THREE.MeshStandardMaterial;
  sidewalk: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  glassWindow: THREE.MeshPhysicalMaterial;
  glassFacade: THREE.MeshPhysicalMaterial;
  brickRed: THREE.MeshStandardMaterial;
  modernConcrete: THREE.MeshStandardMaterial;
  timberWood: THREE.MeshStandardMaterial;
  steelBrushed: THREE.MeshStandardMaterial;
  bronzeMetal: THREE.MeshStandardMaterial;
  whiteStucco: THREE.MeshStandardMaterial;
  slateRoof: THREE.MeshStandardMaterial;
  terracottaRoof: THREE.MeshStandardMaterial;
  treeBark: THREE.MeshStandardMaterial;
  foliageOak: THREE.MeshStandardMaterial;
  foliagePine: THREE.MeshStandardMaterial;
  foliagePalm: THREE.MeshStandardMaterial;
  foliageSakura: THREE.MeshStandardMaterial;
  roadStripe: THREE.MeshStandardMaterial;
  roadStripeYellow: THREE.MeshStandardMaterial;
  roadCrosswalk: THREE.MeshStandardMaterial;
}

export function buildPBRMaterialLibrary(): PBRMaterialLibrary {
  const asphaltTex = createAsphaltTexture();
  const concreteTex = createConcreteTexture();
  const brickTex = createBrickTexture();
  const woodTex = createWoodTexture();
  const tileTex = createTileTexture();
  const grassTex = createGrassTexture();

  return {
    asphalt: new THREE.MeshStandardMaterial({
      color: 0x22252a,
      roughness: 0.92,
      metalness: 0.05,
      map: asphaltTex,
      roughnessMap: asphaltTex,
    }),
    curbConcrete: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85,
      metalness: 0.05,
      map: concreteTex,
    }),
    sidewalk: new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.82,
      metalness: 0.02,
      map: tileTex,
    }),
    grass: new THREE.MeshStandardMaterial({
      color: 0x3d6639,
      roughness: 0.96,
      metalness: 0.0,
      map: grassTex,
    }),
    glassWindow: new THREE.MeshPhysicalMaterial({
      color: 0xcbe4f7,
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: 0.42,
      transmission: 0.6,
      ior: 1.52,
    }),
    glassFacade: new THREE.MeshPhysicalMaterial({
      color: 0x7eb3de,
      roughness: 0.05,
      metalness: 0.35,
      transparent: true,
      opacity: 0.72,
      reflectivity: 0.9,
    }),
    brickRed: new THREE.MeshStandardMaterial({
      color: 0xb95d46,
      roughness: 0.88,
      metalness: 0.02,
      map: brickTex,
    }),
    modernConcrete: new THREE.MeshStandardMaterial({
      color: 0xa8b1b9,
      roughness: 0.8,
      metalness: 0.06,
      map: concreteTex,
    }),
    timberWood: new THREE.MeshStandardMaterial({
      color: 0xa47148,
      roughness: 0.6,
      metalness: 0.02,
      map: woodTex,
    }),
    steelBrushed: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.85,
    }),
    bronzeMetal: new THREE.MeshStandardMaterial({
      color: 0xb48b48,
      roughness: 0.35,
      metalness: 0.8,
    }),
    whiteStucco: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.02,
    }),
    slateRoof: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.72,
      metalness: 0.08,
      map: tileTex,
    }),
    terracottaRoof: new THREE.MeshStandardMaterial({
      color: 0xc25e3d,
      roughness: 0.82,
      metalness: 0.02,
      map: tileTex,
    }),
    treeBark: new THREE.MeshStandardMaterial({
      color: 0x422a1d,
      roughness: 0.9,
      metalness: 0.0,
      map: woodTex,
    }),
    foliageOak: new THREE.MeshStandardMaterial({
      color: 0x2d6a36,
      roughness: 0.75,
      metalness: 0.0,
    }),
    foliagePine: new THREE.MeshStandardMaterial({
      color: 0x1d4727,
      roughness: 0.82,
      metalness: 0.0,
    }),
    foliagePalm: new THREE.MeshStandardMaterial({
      color: 0x38782a,
      roughness: 0.7,
      metalness: 0.0,
    }),
    foliageSakura: new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.75,
      metalness: 0.0,
    }),
    roadStripe: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.05,
    }),
    roadStripeYellow: new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.65,
      metalness: 0.05,
    }),
    roadCrosswalk: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.7,
      metalness: 0.05,
    }),
  };
}
