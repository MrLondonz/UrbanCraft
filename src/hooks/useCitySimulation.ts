import { useState, useEffect, useRef, useCallback } from 'react';
import { PlacedBuilding, CityMetrics, TaxRates, ServiceFunding, Milestone, CityEventNews, BuildingInterior } from '../types/city';
import { BUILDING_MAP } from '../data/buildingsCatalog';
import { FURNITURE_MAP } from '../data/furnitureCatalog';
import { INITIAL_MILESTONES } from '../data/milestones';
import { sound } from '../utils/audio';

export function useCitySimulation(
  initialBuildings: PlacedBuilding[],
  initialFunds: number = 10000
) {
  const [buildings, setBuildings] = useState<PlacedBuilding[]>(initialBuildings);
  const [gameSpeed, setGameSpeed] = useState<0 | 1 | 2 | 3>(1); // 0 = paused
  const [isFreeMode, setIsFreeMode] = useState<boolean>(true); // Free Sandbox Mode where everything is free by default!

  const [taxRates, setTaxRates] = useState<TaxRates>({
    residential: 9,
    commercial: 10,
    industrial: 8,
  });

  const [serviceFunding, setServiceFunding] = useState<ServiceFunding>({
    safety: 100,
    health: 100,
    education: 100,
    parks: 100,
  });

  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [newsLog, setNewsLog] = useState<CityEventNews[]>([
    {
      id: 'welcome_1',
      text: 'Welcome to CityForge! Browser 3D city-building, connected infrastructure & architectural design studio.',
      timestamp: Date.now(),
      type: 'info',
    },
  ]);

  const [metrics, setMetrics] = useState<CityMetrics>({
    funds: initialFunds,
    dailyIncome: 0,
    dailyExpenses: 0,
    population: 0,
    happiness: 85,
    powerProduced: 100,
    powerConsumed: 0,
    waterProduced: 100,
    waterConsumed: 0,
    pollutionScore: 5,
    jobsTotal: 0,
    employmentRate: 100,
    dayCount: 1,
  });

  // Calculate live infrastructure and balances
  const calculateGridStatus = useCallback((currentBuildings: PlacedBuilding[]) => {
    let powerProd = 20; // baseline mini generator
    let powerCons = 0;
    let waterProd = 20;
    let waterCons = 0;
    let popCap = 0;
    let jobs = 0;
    let pollution = 0;
    let happinessSum = 80;
    let baseTaxDaily = 0;
    let expensesDaily = 0;

    currentBuildings.forEach((b) => {
      const def = BUILDING_MAP.get(b.defId);
      if (!def) return;
      const lvlMul = 1 + (b.level - 1) * 0.4;

      // Power & Water deltas (negative = generation)
      if (def.powerDelta < 0) {
        powerProd += Math.abs(def.powerDelta) * lvlMul;
      } else {
        powerCons += def.powerDelta * lvlMul;
      }

      if (def.waterDelta < 0) {
        waterProd += Math.abs(def.waterDelta) * lvlMul;
      } else {
        waterCons += def.waterDelta * lvlMul;
      }

      popCap += def.populationCapacity * lvlMul;
      jobs += def.jobsProvided * lvlMul;
      pollution += def.pollution;
      happinessSum += def.happinessBonus;

      // Real-Time Planner 5D Furniture bonuses
      if (b.interior && b.interior.furniture) {
        b.interior.furniture.forEach((f) => {
          const furnDef = FURNITURE_MAP.get(f.defId);
          if (furnDef) {
            happinessSum += (furnDef.comfortBonus || 0) * 0.12;
            baseTaxDaily += (furnDef.rentBonus || 0);
          }
        });
      }

      if (def.revenuePerDay > 0) {
        let taxCategoryMultiplier = 1;
        if (def.category === 'residential') taxCategoryMultiplier = taxRates.residential / 10;
        if (def.category === 'commercial') taxCategoryMultiplier = taxRates.commercial / 10;
        if (def.category === 'industrial') taxCategoryMultiplier = taxRates.industrial / 10;
        baseTaxDaily += def.revenuePerDay * lvlMul * taxCategoryMultiplier;
      } else if (def.revenuePerDay < 0) {
        // Civic service operating cost
        expensesDaily += Math.abs(def.revenuePerDay) * (serviceFunding.safety / 100);
      }
    });

    return {
      powerProd: Math.round(powerProd),
      powerCons: Math.round(powerCons),
      waterProd: Math.round(waterProd),
      waterCons: Math.round(waterCons),
      popCap: Math.round(popCap),
      jobs: Math.round(jobs),
      pollution: Math.max(0, Math.min(100, Math.round(pollution))),
      happinessSum,
      baseTaxDaily: Math.round(baseTaxDaily),
      expensesDaily: Math.round(expensesDaily),
    };
  }, [taxRates, serviceFunding]);

  // Simulation tick loop
  const tickIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameSpeed === 0) {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      return;
    }

    const intervalMs = Math.round(2400 / gameSpeed);

    tickIntervalRef.current = window.setInterval(() => {
      setMetrics((prev) => {
        const grid = calculateGridStatus(buildings);

        // Power & water deficits impact happiness
        let penalty = 0;
        if (grid.powerCons > grid.powerProd) penalty += 20;
        if (grid.waterCons > grid.waterProd) penalty += 20;
        if (grid.pollution > 30) penalty += 10;
        // High taxes lower happiness
        const taxStrain = ((taxRates.residential - 9) + (taxRates.commercial - 10)) * 1.5;

        const targetHappiness = Math.max(20, Math.min(100, Math.round(grid.happinessSum - penalty - taxStrain)));
        const newHappiness = Math.round(prev.happiness + (targetHappiness - prev.happiness) * 0.2);

        // Population growth or decline based on happiness and cap
        let newPop = prev.population;
        if (newHappiness >= 60 && prev.population < grid.popCap) {
          const growth = Math.max(1, Math.round((grid.popCap - prev.population) * 0.1));
          newPop = Math.min(grid.popCap, prev.population + growth);
        } else if (newHappiness < 45 && prev.population > 0) {
          newPop = Math.max(0, prev.population - Math.round(prev.population * 0.05));
        }

        const employment = newPop === 0 ? 100 : Math.min(100, Math.round((grid.jobs / (newPop * 0.6 || 1)) * 100));

        // Net treasury change
        const netDaily = grid.baseTaxDaily - grid.expensesDaily;
        const newFunds = prev.funds + netDaily;

        return {
          funds: newFunds,
          dailyIncome: grid.baseTaxDaily,
          dailyExpenses: grid.expensesDaily,
          population: newPop,
          happiness: newHappiness,
          powerProduced: grid.powerProd,
          powerConsumed: grid.powerCons,
          waterProduced: grid.waterProd,
          waterConsumed: grid.waterCons,
          pollutionScore: grid.pollution,
          jobsTotal: grid.jobs,
          employmentRate: employment,
          dayCount: prev.dayCount + 1,
        };
      });
    }, intervalMs);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [gameSpeed, buildings, calculateGridStatus, taxRates]);

  // Check milestones when metrics or buildings change
  useEffect(() => {
    setMilestones((prevMilestones) => {
      let updated = false;
      const next = prevMilestones.map((m) => {
        if (m.completed) return m;
        let isMet = false;
        if (m.targetMetric === 'population' && metrics.population >= m.targetValue) isMet = true;
        if (m.targetMetric === 'funds' && metrics.funds >= m.targetValue) isMet = true;
        if (m.targetMetric === 'happiness' && metrics.happiness >= m.targetValue) isMet = true;
        if (m.targetMetric === 'buildings' && buildings.length >= m.targetValue) isMet = true;
        if (m.targetMetric === 'greenEnergy' && metrics.powerProduced >= m.targetValue) isMet = true;

        if (isMet) {
          updated = true;
          sound.playMilestone();
          setNewsLog((prevNews) => [
            {
              id: `milestone_${m.id}_${Date.now()}`,
              text: `Milestone Achieved: "${m.title}"! Municipal reward available in Milestones menu.`,
              timestamp: Date.now(),
              type: 'positive',
            },
            ...prevNews.slice(0, 8),
          ]);
          return { ...m, completed: true };
        }
        return m;
      });
      return updated ? next : prevMilestones;
    });
  }, [metrics.population, metrics.funds, metrics.happiness, metrics.powerProduced, buildings.length]);

  // Actions
  const claimMilestone = useCallback((id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id && m.completed && !m.claimed) {
          sound.playUpgrade();
          setMetrics((cur) => ({
            ...cur,
            funds: cur.funds + m.rewardFunds,
            population: cur.population + m.rewardPop,
          }));
          return { ...m, claimed: true };
        }
        return m;
      })
    );
  }, []);

  // Undo / Redo History Stacks
  const historyRef = useRef<PlacedBuilding[][]>([]);
  const futureRef = useRef<PlacedBuilding[][]>([]);
  const [historyLength, setHistoryLength] = useState(0);
  const [futureLength, setFutureLength] = useState(0);

  const pushHistory = useCallback((current: PlacedBuilding[]) => {
    historyRef.current = [...historyRef.current.slice(-40), current];
    futureRef.current = [];
    setHistoryLength(historyRef.current.length);
    setFutureLength(0);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const previous = historyRef.current.pop()!;
    futureRef.current.push(buildings);
    setBuildings(previous);
    setHistoryLength(historyRef.current.length);
    setFutureLength(futureRef.current.length);
    sound.playClick();
  }, [buildings]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(buildings);
    setBuildings(next);
    setHistoryLength(historyRef.current.length);
    setFutureLength(futureRef.current.length);
    sound.playClick();
  }, [buildings]);

  const addBuilding = useCallback((defId: string, x: number, z: number, rotation: 0 | 90 | 180 | 270 = 0) => {
    const def = BUILDING_MAP.get(defId);
    if (!def) return false;

    if (!isFreeMode && metrics.funds < def.cost) {
      setNewsLog((prev) => [
        {
          id: `warn_${Date.now()}`,
          text: `Insufficient treasury funds to construct ${def.name} ($${def.cost} required).`,
          timestamp: Date.now(),
          type: 'warning',
        },
        ...prev.slice(0, 8),
      ]);
      return false;
    }

    pushHistory(buildings);

    const newBuilding: PlacedBuilding = {
      instanceId: `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      defId,
      x,
      z,
      rotation,
      level: 1,
      color: def.colorOptions[0] || '#f1f5f9',
      placedAt: Date.now(),
      powered: true,
      watered: true,
    };

    setBuildings((prev) => [...prev, newBuilding]);
    if (!isFreeMode) {
      setMetrics((prev) => ({
        ...prev,
        funds: prev.funds - def.cost,
      }));
    }
    sound.playPlace();
    return true;
  }, [buildings, isFreeMode, metrics.funds, pushHistory]);

  const removeBuilding = useCallback((instanceId: string) => {
    pushHistory(buildings);
    setBuildings((prev) => {
      const target = prev.find((b) => b.instanceId === instanceId);
      if (target) {
        const def = BUILDING_MAP.get(target.defId);
        if (def && !isFreeMode) {
          const refund = Math.round(def.cost * 0.5);
          setMetrics((m) => ({ ...m, funds: m.funds + refund }));
        }
        sound.playDemolish();
      }
      return prev.filter((b) => b.instanceId !== instanceId);
    });
  }, [buildings, isFreeMode, pushHistory]);

  const upgradeBuilding = useCallback((instanceId: string) => {
    const target = buildings.find((b) => b.instanceId === instanceId);
    if (!target) return;
    const def = BUILDING_MAP.get(target.defId);
    if (!def || target.level >= def.maxLevel) return;

    const upgradeCost = Math.round(def.cost * 0.75 * target.level);
    if (!isFreeMode && metrics.funds < upgradeCost) {
      setNewsLog((cur) => [
        {
          id: `upg_err_${Date.now()}`,
          text: `Insufficient funds for building level ${target.level + 1} ($${upgradeCost} required).`,
          timestamp: Date.now(),
          type: 'warning',
        },
        ...cur.slice(0, 8),
      ]);
      return;
    }

    pushHistory(buildings);
    if (!isFreeMode) {
      setMetrics((m) => ({ ...m, funds: m.funds - upgradeCost }));
    }
    sound.playUpgrade();

    setBuildings((prev) =>
      prev.map((b) => (b.instanceId === instanceId ? { ...b, level: b.level + 1 } : b))
    );
  }, [buildings, isFreeMode, metrics.funds, pushHistory]);

  const customizeBuilding = useCallback((instanceId: string, updates: Partial<PlacedBuilding>) => {
    pushHistory(buildings);
    setBuildings((prev) =>
      prev.map((b) => (b.instanceId === instanceId ? { ...b, ...updates } : b))
    );
  }, [buildings, pushHistory]);

  const duplicateBuilding = useCallback((instanceId: string): PlacedBuilding | null => {
    const source = buildings.find((b) => b.instanceId === instanceId);
    if (!source) return null;

    pushHistory(buildings);
    // Find adjacent free position
    const newX = Math.min(24, source.x + (source.customWidth || 1));
    const newZ = source.z;

    const clone: PlacedBuilding = {
      ...source,
      instanceId: `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: newX,
      z: newZ,
      customName: source.customName ? `${source.customName} (Copy)` : undefined,
      placedAt: Date.now(),
    };

    setBuildings((prev) => [...prev, clone]);
    sound.playPlace();
    return clone;
  }, [buildings, pushHistory]);

  const addCustomBuilding = useCallback((params: {
    name: string;
    x: number;
    z: number;
    width: number;
    depth: number;
    heightFloors: number;
    color: string;
    roofStyle?: 'flat' | 'pitched' | 'mansard' | 'penthouse';
    architecturalStyle?: 'modern_glass' | 'classic_brick' | 'timber_eco' | 'concrete_brutalist';
  }) => {
    pushHistory(buildings);
    const newBuilding: PlacedBuilding = {
      instanceId: `b_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      defId: 'res_condo', // base template definition
      customName: params.name,
      x: params.x,
      z: params.z,
      rotation: 0,
      level: Math.min(4, Math.ceil(params.heightFloors / 2)),
      color: params.color,
      customWidth: params.width,
      customDepth: params.depth,
      customHeightFloors: params.heightFloors,
      roofStyle: params.roofStyle || 'flat',
      architecturalStyle: params.architecturalStyle || 'modern_glass',
      placedAt: Date.now(),
      powered: true,
      watered: true,
    };

    setBuildings((prev) => [...prev, newBuilding]);
    sound.playPlace();
    return newBuilding;
  }, [buildings, pushHistory]);

  const paveRoadSegment = useCallback((
    start: { x: number; z: number },
    end: { x: number; z: number },
    roadDefId: string = 'road_paved'
  ) => {
    pushHistory(buildings);
    const existingCoords = new Set(buildings.map((b) => `${b.x},${b.z}`));
    const newRoads: PlacedBuilding[] = [];

    // Horizontal path first, then vertical path
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${start.z}`;
      if (!existingCoords.has(key)) {
        existingCoords.add(key);
        newRoads.push({
          instanceId: `road_${Date.now()}_${x}_${start.z}`,
          defId: roadDefId,
          x,
          z: start.z,
          rotation: 0,
          level: 1,
          color: '#334155',
          placedAt: Date.now(),
          powered: true,
          watered: true,
        });
      }
    }

    const minZ = Math.min(start.z, end.z);
    const maxZ = Math.max(start.z, end.z);
    for (let z = minZ; z <= maxZ; z++) {
      const key = `${end.x},${z}`;
      if (!existingCoords.has(key)) {
        existingCoords.add(key);
        newRoads.push({
          instanceId: `road_${Date.now()}_${end.x}_${z}`,
          defId: roadDefId,
          x: end.x,
          z,
          rotation: 0,
          level: 1,
          color: '#334155',
          placedAt: Date.now(),
          powered: true,
          watered: true,
        });
      }
    }

    if (newRoads.length > 0) {
      setBuildings((prev) => [...prev, ...newRoads]);
      sound.playPlace();
    }

    return newRoads.length;
  }, [buildings, pushHistory]);

  const saveBuildingInterior = useCallback((instanceId: string, interior: BuildingInterior) => {
    pushHistory(buildings);
    setBuildings((prev) =>
      prev.map((b) => (b.instanceId === instanceId ? { ...b, interior } : b))
    );
    setNewsLog((cur) => [
      {
        id: `furnish_${Date.now()}`,
        text: `Interior furnishings updated! Citizens enjoy improved comfort and room value.`,
        timestamp: Date.now(),
        type: 'positive',
      },
      ...cur.slice(0, 8),
    ]);
  }, [buildings, pushHistory]);

  const clearToScratch = useCallback(() => {
    pushHistory(buildings);
    setBuildings([]);
    setNewsLog((prev) => [
      {
        id: `scratch_${Date.now()}`,
        text: 'Started clean blueprint from scratch! Lay down your roads, infrastructure, and skyscrapers.',
        timestamp: Date.now(),
        type: 'info',
      },
      ...prev.slice(0, 8),
    ]);
    sound.playDemolish();
  }, [buildings, pushHistory]);

  const toggleFreeMode = useCallback(() => {
    setIsFreeMode((prev) => !prev);
    sound.playClick();
  }, []);

  const deductFunds = useCallback((amount: number) => {
    if (!isFreeMode) {
      setMetrics((m) => ({ ...m, funds: Math.max(0, m.funds - amount) }));
    }
  }, [isFreeMode]);

  const refundFunds = useCallback((amount: number) => {
    if (!isFreeMode) {
      setMetrics((m) => ({ ...m, funds: m.funds + amount }));
    }
  }, [isFreeMode]);

  const loadCity = useCallback((newBuildings: PlacedBuilding[], startingFunds?: number) => {
    pushHistory(buildings);
    setBuildings(newBuildings);
    if (startingFunds !== undefined) {
      setMetrics((m) => ({ ...m, funds: startingFunds, population: 0, dayCount: 1 }));
    }
  }, [buildings, pushHistory]);

  return {
    buildings,
    metrics,
    gameSpeed,
    setGameSpeed,
    isFreeMode,
    toggleFreeMode,
    clearToScratch,
    taxRates,
    setTaxRates,
    serviceFunding,
    setServiceFunding,
    milestones,
    claimMilestone,
    newsLog,
    addBuilding,
    removeBuilding,
    upgradeBuilding,
    customizeBuilding,
    saveBuildingInterior,
    deductFunds,
    refundFunds,
    loadCity,
    undo,
    redo,
    canUndo: historyLength > 0,
    canRedo: futureLength > 0,
    duplicateBuilding,
    addCustomBuilding,
    paveRoadSegment,
  };
}
