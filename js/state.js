import { PLANTS } from './data.js';
import { DEFAULT_GARDEN_NAME } from './logic.js';

const STORAGE_KEY = 'desktop-garden.v1';

const emptyInventory = () =>
  Object.fromEntries(PLANTS.map((plant) => [plant.id, 0]));

export function createInitialState() {
  return {
    version: 1,
    gardenName: DEFAULT_GARDEN_NAME,
    plant: null,
    cooldowns: { waterUntil: 0, soilUntil: 0 },
    focus: null,
    inventory: emptyInventory(),
    stats: { harvested: 0, cooked: 0 },
    lastDish: null
  };
}

function normalizeState(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== 'object') return base;

  const inventory = { ...base.inventory };
  if (raw.inventory && typeof raw.inventory === 'object') {
    for (const id of Object.keys(inventory)) {
      const value = Number(raw.inventory[id]);
      inventory[id] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    }
  }

  const plant = raw.plant && typeof raw.plant === 'object' ? raw.plant : null;

  return {
    ...base,
    gardenName: String(raw.gardenName || base.gardenName).slice(0, 12) || base.gardenName,
    plant: plant
      ? {
          fruitId: plant.fruitId,
          potId: plant.potId,
          progress: Math.max(0, Math.min(100, Number(plant.progress) || 0)),
          pos: {
            x: Number(plant.pos?.x) || 50,
            y: Number(plant.pos?.y) || 18
          },
          plantedAt: Number(plant.plantedAt) || Date.now()
        }
      : null,
    cooldowns: {
      waterUntil: Number(raw.cooldowns?.waterUntil) || 0,
      soilUntil: Number(raw.cooldowns?.soilUntil) || 0
    },
    focus:
      raw.focus && Number(raw.focus.endsAt) > 0
        ? {
            startedAt: Number(raw.focus.startedAt) || Date.now(),
            endsAt: Number(raw.focus.endsAt),
            rewarded: Boolean(raw.focus.rewarded)
          }
        : null,
    inventory,
    stats: {
      harvested: Math.max(0, Number(raw.stats?.harvested) || 0),
      cooked: Math.max(0, Number(raw.stats?.cooked) || 0)
    },
    lastDish: raw.lastDish || null
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn('无法读取本地存档，使用新存档', error);
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('无法保存本地存档', error);
  }
}

export function hasSave() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return false;
  }
}
