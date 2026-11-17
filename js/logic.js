import { FALLBACKS, FRUITS, RECIPES, STAGE_TITLES } from './data.js';

export const DEFAULT_GARDEN_NAME = '我的小园';

export function stageIndex(progress) {
  return Math.max(0, Math.min(9, Math.floor(progress / 10)));
}

export function stageTitle(index) {
  return STAGE_TITLES[Math.max(0, Math.min(9, index))];
}

export function addGrowth(progress, delta) {
  return Math.max(0, Math.min(100, Math.round(progress + delta)));
}

export function isHarvestReady(progress) {
  return progress >= 100;
}

export function recipeKey(ids) {
  return [...ids].sort().join('+');
}

const RECIPE_MAP = new Map(RECIPES.map((recipe) => [recipeKey(recipe.ids), recipe]));

export function matchDish(ids) {
  const key = recipeKey(ids);
  if (RECIPE_MAP.has(key)) {
    return { dish: RECIPE_MAP.get(key), isFallback: false };
  }
  const names = ids.map((id) => (FRUITS[id] ? FRUITS[id].name : id));
  if (ids.length >= 3) {
    return {
      dish: { ...FALLBACKS.bake, name: `${names.join('·')} 暗夜果园烤盅` },
      isFallback: true
    };
  }
  return {
    dish: { ...FALLBACKS.drink, name: `${names.join('·')} 月光实验特调` },
    isFallback: true
  };
}

export function validateCook(inventory, selected) {
  if (!Array.isArray(selected) || selected.length === 0) {
    return { ok: false, reason: '先选 1–3 种果实吧' };
  }
  if (selected.length > 3) {
    return { ok: false, reason: '最多只能选 3 种果实' };
  }
  if (new Set(selected).size !== selected.length) {
    return { ok: false, reason: '同一种果实只用选一次' };
  }
  if (selected.some((id) => (inventory[id] || 0) < 1)) {
    return { ok: false, reason: '仓库里的果实不够了' };
  }
  return { ok: true, reason: '' };
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function normalizeGardenName(raw) {
  const value = String(raw ?? '').trim().slice(0, 12);
  return value || DEFAULT_GARDEN_NAME;
}

export function daysTogether(plantedAt, now = Date.now()) {
  if (!plantedAt) return 1;
  return Math.max(1, Math.floor((now - plantedAt) / 86400000) + 1);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
