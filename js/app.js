import { PLANTS_BY_ID, AVAILABLE_PLANTS, POTS, POTS_BY_ID, FRUITS, STAGE_TITLES, STAGE_SCALES } from './data.js';
import {
  stageIndex,
  addGrowth,
  isHarvestReady,
  validateCook,
  matchDish,
  formatCountdown,
  normalizeGardenName,
  daysTogether,
  clamp
} from './logic.js';
import { loadState, saveState, hasSave } from './state.js';
import { buildPlantCard, buildDishCard, downloadCanvas, shareCanvas, canvasToDataUrl } from './share.js';
import { dishArt } from './dishart.js';

const WATER_CD = 10 * 60 * 1000;
const SOIL_CD = 30 * 60 * 1000;
const FOCUS_MS = 25 * 60 * 1000;
const PLANT_BASE_W = 214;

const $ = (id) => document.getElementById(id);

const dom = {
  widget: $('widget'),
  bar: $('bar'),
  gardenTitle: $('gardenTitle'),
  renameBtn: $('renameBtn'),
  basketBtn: $('basketBtn'),
  basketBadge: $('basketBadge'),
  scene: $('scene'),
  plantStage: $('plantStage'),
  plantSway: $('plantSway'),
  plantImg: $('plantImg'),
  potImg: $('potImg'),
  stageTag: $('stageTag'),
  harvestHint: $('harvestHint'),
  focusPill: $('focusPill'),
  focusPillText: $('focusPillText'),
  emptyPlantBtn: $('emptyPlantBtn'),
  fxLayer: $('fxLayer'),
  toast: $('toast'),
  renameBar: $('renameBar'),
  renameInput: $('renameInput'),
  renameSave: $('renameSave'),
  renameSkip: $('renameSkip'),
  careSheet: $('careSheet'),
  careStage: $('careStage'),
  sharePlantBtn: $('sharePlantBtn'),
  actWater: $('actWater'),
  waterNote: $('waterNote'),
  actFocus: $('actFocus'),
  focusNote: $('focusNote'),
  actSoil: $('actSoil'),
  soilNote: $('soilNote'),
  harvestBtn: $('harvestBtn'),
  careClose: $('careClose'),
  plantSheet: $('plantSheet'),
  plantStep: $('plantStep'),
  plantBack: $('plantBack'),
  seedList: $('seedList'),
  potList: $('potList'),
  plantConfirm: $('plantConfirm'),
  basketSheet: $('basketSheet'),
  basketClose: $('basketClose'),
  invList: $('invList'),
  pickedChips: $('pickedChips'),
  cookBtn: $('cookBtn'),
  dishLayer: $('dishLayer'),
  dishArt: $('dishArt'),
  dishType: $('dishType'),
  dishName: $('dishName'),
  dishDesc: $('dishDesc'),
  dishShare: $('dishShare'),
  dishAccept: $('dishAccept'),
  cookLayer: $('cookLayer'),
  cookArt: $('cookArt'),
  cookText: $('cookText'),
  cookBarFill: $('cookBarFill'),
  shareLayer: $('shareLayer'),
  shareClose: $('shareClose'),
  sharePreview: $('sharePreview'),
  shareSave: $('shareSave'),
  shareSend: $('shareSend')
};

let state = loadState();

const ui = {
  step: 1,
  seed: null,
  pot: null,
  picked: [],
  dish: null,
  dishUsed: [],
  share: null,
  drag: null,
  cookTimer: null,
  peekTimer: null
};

/* ---------------- 占位 ---------------- */

const svgUri = (body) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${body}</svg>`
  )}`;

const FRUIT_PLACEHOLDER = svgUri(`
  <circle cx="60" cy="62" r="30" fill="#f0e2cd"/>
  <circle cx="60" cy="62" r="20" fill="#e6d4ba"/>
  <path d="M60 40c-6-4-10-9-9-14 6 1 10 5 11 11" fill="#a9c48f"/>
`);

function makeImg(src, alt) {
  const img = new Image();
  img.alt = alt || '';
  img.draggable = false;
  img.addEventListener('error', () => {
    if (img.dataset.fallback === '1') return;
    img.dataset.fallback = '1';
    img.src = FRUIT_PLACEHOLDER;
  });
  img.src = src;
  return img;
}

/* ---------------- 基础 ---------------- */

function save() {
  saveState(state);
}

let toastTimer = null;
function toast(text, duration = 2100) {
  dom.toast.textContent = text;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), duration);
}

function applyGardenName(name) {
  dom.gardenTitle.textContent = name;
  document.title = name;
}

function plantDef() {
  return state.plant ? PLANTS_BY_ID[state.plant.fruitId] : null;
}

function hasActiveFocus() {
  return Boolean(state.focus && state.focus.endsAt > Date.now());
}

function anySheetOpen() {
  return !dom.careSheet.hidden || !dom.plantSheet.hidden || !dom.basketSheet.hidden;
}

function syncChrome() {
  const visible = anySheetOpen() || !dom.dishLayer.hidden || !dom.shareLayer.hidden || !dom.cookLayer.hidden;
  dom.widget.dataset.chrome = visible ? 'visible' : 'hidden';
}

function sceneBox() {
  return dom.scene.getBoundingClientRect();
}

function setChrome(visible) {
  dom.widget.dataset.chrome = visible ? 'visible' : 'hidden';
}

/* ---------------- 场景 ---------------- */

function applyPosition() {
  if (!state.plant) return;
  dom.plantStage.style.left = `${state.plant.pos.x}%`;
  dom.plantStage.style.bottom = `${state.plant.pos.y}%`;
}

function renderScene() {
  const def = plantDef();

  if (!def) {
    dom.plantStage.hidden = true;
    dom.stageTag.textContent = '';
    dom.harvestHint.hidden = true;
    dom.emptyPlantBtn.hidden = false;
    return;
  }

  dom.emptyPlantBtn.hidden = true;
  dom.plantStage.hidden = false;

  const index = stageIndex(state.plant.progress);
  const src = def.stages[index];
  const changed = dom.plantImg.dataset.stage !== String(index);

  if (changed && dom.plantImg.src) {
    dom.plantImg.classList.add('swapping');
    setTimeout(() => {
      dom.plantImg.src = src;
      requestAnimationFrame(() => dom.plantImg.classList.remove('swapping'));
    }, 240);
  } else {
    dom.plantImg.src = src;
  }
  dom.plantImg.dataset.stage = String(index);
  dom.plantImg.style.width = `${Math.round(PLANT_BASE_W * STAGE_SCALES[index])}px`;
  dom.plantImg.setAttribute('data-plant', def.id);

  dom.potImg.src = POTS_BY_ID[state.plant.potId]?.image || POTS[0].image;

  dom.stageTag.textContent = STAGE_TITLES[index];
  dom.harvestHint.hidden = !(state.plant.progress > 85 && state.plant.progress < 100);
  applyPosition();
}

function renderBadge() {
  const total = Object.values(state.inventory).reduce((sum, n) => sum + n, 0);
  dom.basketBadge.textContent = total > 99 ? '99+' : String(total);
}

function bumpBadge() {
  dom.basketBadge.classList.add('bump');
  setTimeout(() => dom.basketBadge.classList.remove('bump'), 340);
}

/* ---------------- 动效 ---------------- */

function stageRect() {
  return dom.plantStage.getBoundingClientRect();
}

function spawn(className, count, setup, ttl) {
  const box = sceneBox();
  const rect = stageRect();
  for (let i = 0; i < count; i += 1) {
    const node = document.createElement('span');
    node.className = className;
    setup(node, rect, box, i);
    dom.fxLayer.appendChild(node);
    setTimeout(() => node.remove(), ttl);
  }
}

function spawnDrops() {
  spawn(
    'drop',
    9,
    (node, rect, box, i) => {
      node.style.left = `${rect.left - box.left + rect.width * (0.32 + Math.random() * 0.36)}px`;
      node.style.top = `${rect.top - box.top + rect.height * (0.08 + Math.random() * 0.26)}px`;
      node.style.setProperty('--dx', `${(Math.random() - 0.5) * 22}px`);
      node.style.setProperty('--dy', `${60 + Math.random() * 70}px`);
      node.style.animationDelay = `${i * 0.07}s`;
    },
    1900
  );
}

function spawnSoil() {
  spawn(
    'soil-bit',
    11,
    (node, rect, box, i) => {
      node.style.left = `${rect.left - box.left + rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.42}px`;
      node.style.top = `${rect.bottom - box.top - 22}px`;
      node.style.setProperty('--dx', `${(Math.random() - 0.5) * 76}px`);
      node.style.setProperty('--dy', `${-20 - Math.random() * 34}px`);
      node.style.animationDelay = `${i * 0.05}s`;
    },
    1500
  );
}

function spawnSparks(count = 3) {
  spawn(
    'spark',
    count,
    (node, rect, box, i) => {
      node.style.left = `${rect.left - box.left + rect.width * (0.3 + Math.random() * 0.4)}px`;
      node.style.top = `${rect.top - box.top + rect.height * (0.2 + Math.random() * 0.42)}px`;
      node.style.setProperty('--dx', `${(Math.random() - 0.5) * 30}px`);
      node.style.animationDelay = `${i * 0.16}s`;
    },
    2100
  );
}

function spawnPetals(count = 4) {
  const box = sceneBox();
  for (let i = 0; i < count; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = `${20 + Math.random() * (box.width - 46)}px`;
    petal.style.top = `${30 + Math.random() * 80}px`;
    petal.style.setProperty('--dx', `${24 + Math.random() * 46}px`);
    petal.style.animationDelay = `${Math.random() * 1.4}s`;
    dom.fxLayer.appendChild(petal);
    setTimeout(() => petal.remove(), 7600);
  }
}

function gust() {
  if (dom.plantStage.hidden) return;
  dom.plantSway.style.setProperty('--sway-dur', `${(3.6 + Math.random() * 3).toFixed(1)}s`);
  dom.plantSway.classList.add('gust');
  setTimeout(() => dom.plantSway.classList.remove('gust'), 980);
}

function scheduleIdle() {
  setTimeout(() => {
    gust();
    const index = state.plant ? stageIndex(state.plant.progress) : -1;
    if (index >= 5 && index <= 8) spawnPetals(3);
    scheduleIdle();
  }, 7000 + Math.random() * 7000);
}

function flyToBasket(tone) {
  const start = stageRect();
  const end = dom.basketBtn.getBoundingClientRect();
  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:${start.left + start.width / 2 - 16}px;top:${
    start.top + start.height * 0.4
  }px;width:32px;height:32px;border-radius:50%;background:${tone};box-shadow:0 8px 14px -8px rgba(90,70,50,.7);z-index:90;pointer-events:none;`;
  document.body.appendChild(node);
  const anim = node.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      {
        transform: `translate(${end.left - start.left + 12}px, ${end.bottom - start.top - 10}px) scale(0.35)`,
        opacity: 0.15
      }
    ],
    { duration: 740, easing: 'cubic-bezier(.4,.1,.7,.5)' }
  );
  anim.onfinish = () => {
    node.remove();
    bumpBadge();
  };
}

/* ---------------- 成长 ---------------- */

function grow(delta, message) {
  if (!state.plant) return;
  const before = state.plant.progress;
  const beforeIndex = stageIndex(before);

  state.plant.progress = addGrowth(before, delta);
  save();
  renderScene();
  if (message) toast(message);

  const afterIndex = stageIndex(state.plant.progress);
  if (afterIndex !== beforeIndex) {
    spawnSparks(3);
    toast(STAGE_TITLES[afterIndex]);
  }
  if (state.plant.progress >= 100 && before < 100) {
    spawnSparks(5);
  }
}

/* ---------------- 照顾面板 ---------------- */

function renderCare() {
  if (!state.plant) {
    dom.careSheet.hidden = true;
    return;
  }
  const index = stageIndex(state.plant.progress);
  dom.careStage.textContent = STAGE_TITLES[index];

  const now = Date.now();
  const waterLeft = state.cooldowns.waterUntil - now;
  const soilLeft = state.cooldowns.soilUntil - now;
  const finished = state.plant.progress >= 100;

  dom.actWater.classList.toggle('disabled', waterLeft > 0 || finished);
  dom.actSoil.classList.toggle('disabled', soilLeft > 0 || finished);
  dom.actFocus.classList.toggle('disabled', finished);

  dom.waterNote.textContent = finished ? '已成熟' : waterLeft > 0 ? formatCountdown(waterLeft) : '+3%';
  dom.soilNote.textContent = finished ? '已成熟' : soilLeft > 0 ? formatCountdown(soilLeft) : '+3%';
  dom.focusNote.textContent = finished ? '已成熟' : hasActiveFocus() ? formatCountdown(state.focus.endsAt - now) : '25:00';

  dom.harvestBtn.hidden = !finished;
  dom.sharePlantBtn.hidden = false;
}

function openCare() {
  if (!state.plant) return;
  dom.basketSheet.hidden = true;
  renderCare();
  dom.careSheet.hidden = false;
  syncChrome();
}

function closeAll() {
  dom.careSheet.hidden = true;
  dom.basketSheet.hidden = true;
  dom.plantSheet.hidden = true;
  syncChrome();
}

/* ---------------- 三个动作 ---------------- */

function doWater() {
  if (!state.plant) return;
  const now = Date.now();
  if (state.plant.progress >= 100) return;
  if (state.cooldowns.waterUntil > now) {
    toast(`${formatCountdown(state.cooldowns.waterUntil - now)} 后才能再浇水`);
    return;
  }
  spawnDrops();
  state.cooldowns.waterUntil = now + WATER_CD;
  save();
  grow(3, '喝饱了水');
  gust();
  renderCare();
}

function doSoil() {
  if (!state.plant) return;
  const now = Date.now();
  if (state.plant.progress >= 100) return;
  if (state.cooldowns.soilUntil > now) {
    toast(`${formatCountdown(state.cooldowns.soilUntil - now)} 后才能再松土`);
    return;
  }
  spawnSoil();
  state.cooldowns.soilUntil = now + SOIL_CD;
  save();
  grow(3, '土壤松好了');
  gust();
  renderCare();
}

function toggleFocus() {
  if (!state.plant) return;
  if (state.plant.progress >= 100) return;

  if (hasActiveFocus()) {
    if (window.confirm('要放弃这次专注吗？')) {
      state.focus = null;
      save();
      renderFocusChip();
      renderCare();
    }
    return;
  }

  const now = Date.now();
  state.focus = { startedAt: now, endsAt: now + FOCUS_MS, rewarded: false };
  save();
  renderFocusChip();
  renderCare();
  toast('专注开始，它陪着你');
}

function renderFocusChip() {
  const active = hasActiveFocus();
  dom.focusPill.hidden = !active;
  if (active) dom.focusPillText.textContent = formatCountdown(state.focus.endsAt - Date.now());
}

function settleFocus() {
  if (!state.focus) {
    renderFocusChip();
    return;
  }
  if (state.focus.endsAt > Date.now()) {
    renderFocusChip();
    return;
  }
  state.focus = null;
  save();
  renderFocusChip();
  if (state.plant) {
    grow(5, '专注完成，它也长了一点');
    spawnSparks(4);
    spawnPetals(3);
  } else {
    toast('专注完成');
  }
}

/* ---------------- 收获 ---------------- */

function harvest() {
  if (!state.plant || !isHarvestReady(state.plant.progress)) return;
  const def = plantDef();

  flyToBasket(def.tone);
  state.inventory[def.id] = (state.inventory[def.id] || 0) + 1;
  state.stats.harvested += 1;
  state.plant = null;
  state.focus = null;
  save();

  dom.careSheet.hidden = true;
  renderScene();
  renderBadge();
  renderFocusChip();
  toast(`收到一颗${def.fruitLabel}`);

  setTimeout(() => openPlantSheet(), 780);
}

/* ---------------- 选种 / 选盆 ---------------- */

function openPlantSheet() {
  if (state.plant) return;
  dom.careSheet.hidden = true;
  dom.basketSheet.hidden = true;
  ui.step = 1;
  ui.seed = null;
  ui.pot = null;
  renderPlantSheet();
  dom.plantSheet.hidden = false;
  syncChrome();
}

function renderPlantSheet() {
  const stepOne = ui.step === 1;
  dom.plantStep.textContent = stepOne ? '选一株' : '选个盆';
  dom.seedList.hidden = !stepOne;
  dom.potList.hidden = stepOne;
  dom.plantBack.hidden = stepOne;
  dom.plantConfirm.textContent = stepOne ? '下一步' : '种下';
  dom.plantConfirm.disabled = stepOne ? !ui.seed : !ui.pot;
}

function buildLists() {
  dom.seedList.innerHTML = '';
  for (const plant of AVAILABLE_PLANTS) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'seed-item';
    item.dataset.id = plant.id;
    item.append(makeImg(plant.fruitImage, plant.name));
    const label = document.createElement('span');
    label.textContent = plant.name;
    item.appendChild(label);
    const pick = () => {
      ui.seed = plant.id;
      [...dom.seedList.children].forEach((node) => node.classList.toggle('selected', node.dataset.id === plant.id));
      dom.plantConfirm.disabled = false;
    };
    item.addEventListener('click', pick);
    item.addEventListener('pointerdown', pick);
    dom.seedList.appendChild(item);
  }

  dom.potList.innerHTML = '';
  for (const pot of POTS) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'pot-item';
    item.dataset.id = pot.id;
    item.append(makeImg(pot.image, pot.name));
    const label = document.createElement('span');
    label.textContent = pot.name;
    item.appendChild(label);
    const pick = () => {
      ui.pot = pot.id;
      [...dom.potList.children].forEach((node) => node.classList.toggle('selected', node.dataset.id === pot.id));
      dom.plantConfirm.disabled = false;
    };
    item.addEventListener('click', pick);
    item.addEventListener('pointerdown', pick);
    dom.potList.appendChild(item);
  }
}

function confirmPlant() {
  if (ui.step === 1) {
    if (!ui.seed) return;
    ui.step = 2;
    ui.pot = ui.pot || POTS[0].id;
    renderPlantSheet();
    [...dom.potList.children].forEach((node) => node.classList.toggle('selected', node.dataset.id === ui.pot));
    dom.plantConfirm.disabled = false;
    return;
  }

  if (!ui.seed || !ui.pot) return;
  state.plant = {
    fruitId: ui.seed,
    potId: ui.pot,
    progress: 0,
    pos: { x: 50, y: 14 },
    plantedAt: Date.now()
  };
  state.focus = null;
  save();
  dom.plantSheet.hidden = true;
  syncChrome();
  dom.plantImg.dataset.stage = '';
  renderScene();
  renderBadge();
  renderFocusChip();
  const def = PLANTS_BY_ID[ui.seed];
  toast(`${def.name}种下了`);
  gust();
}

/* ---------------- 仓库 ---------------- */

function openBasket() {
  ui.picked = [];
  renderBasket();
  dom.careSheet.hidden = true;
  dom.basketSheet.hidden = false;
  syncChrome();
}

function renderBasket() {
  dom.invList.innerHTML = '';
  for (const plant of AVAILABLE_PLANTS) {
    const count = state.inventory[plant.id] || 0;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'inv-item';
    item.dataset.id = plant.id;
    if (count === 0) item.classList.add('empty');
    if (ui.picked.includes(plant.id)) item.classList.add('selected');

    item.append(makeImg(plant.fruitImage, plant.name));
    const name = document.createElement('span');
    name.className = 'inv-name';
    name.textContent = plant.name;
    const num = document.createElement('span');
    num.className = 'inv-count';
    num.textContent = `×${count}`;
    item.append(name, num);

    if (count > 0) {
      item.addEventListener('click', () => {
        if (ui.picked.includes(plant.id)) {
          ui.picked = ui.picked.filter((id) => id !== plant.id);
        } else if (ui.picked.length < 3) {
          ui.picked.push(plant.id);
        } else {
          toast('最多 3 种');
          return;
        }
        renderBasket();
      });
    }

    dom.invList.appendChild(item);
  }

  dom.pickedChips.innerHTML = '';
  for (const id of ui.picked) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.append(document.createTextNode(FRUITS[id].name));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `去掉${FRUITS[id].name}`);
    remove.addEventListener('click', () => {
      ui.picked = ui.picked.filter((item) => item !== id);
      renderBasket();
    });
    chip.appendChild(remove);
    dom.pickedChips.appendChild(chip);
  }

  dom.cookBtn.disabled = !validateCook(state.inventory, ui.picked).ok;
}

/* ---------------- 烹饪 ---------------- */

const COOK_STEPS = [
  [0, '洗一洗…'],
  [0.9, '切一切'],
  [1.9, '拌一拌'],
  [3.1, '等它慢慢成形'],
  [4.4, '快好了']
];

function cook() {
  const check = validateCook(state.inventory, ui.picked);
  if (!check.ok) {
    toast(check.reason);
    return;
  }

  const used = [...ui.picked];
  const { dish } = matchDish(used);

  dom.basketSheet.hidden = true;
  dom.cookArt.innerHTML = dishArt(dish, used);
  dom.cookLayer.hidden = false;
  dom.cookBarFill.style.width = '0%';
  syncChrome();

  const total = 5200;
  const start = performance.now();
  let step = -1;

  ui.cookTimer = setInterval(() => {
    const elapsed = performance.now() - start;
    const ratio = clamp(elapsed / total, 0, 1);
    dom.cookBarFill.style.width = `${ratio * 100}%`;

    let next = 0;
    for (let i = 0; i < COOK_STEPS.length; i += 1) {
      if (elapsed / 1000 >= COOK_STEPS[i][0]) next = i;
    }
    if (next !== step) {
      step = next;
      dom.cookText.textContent = COOK_STEPS[next][1];
    }

    if (ratio >= 1) {
      clearInterval(ui.cookTimer);
      ui.cookTimer = null;
      finishCook(used);
    }
  }, 80);
}

function finishCook(used) {
  const { dish, isFallback } = matchDish(used);

  for (const id of used) {
    state.inventory[id] = Math.max(0, (state.inventory[id] || 0) - 1);
  }
  state.stats.cooked += 1;
  state.lastDish = { name: dish.name, type: dish.type, at: Date.now() };
  save();

  ui.dish = dish;
  ui.dishUsed = used;
  ui.picked = [];
  renderBadge();

  dom.cookLayer.hidden = true;
  dom.dishArt.innerHTML = dishArt(dish, used);
  dom.dishType.textContent = `${dish.type} · ${dish.tag}${isFallback ? ' · 实验' : ''}`;
  dom.dishName.textContent = dish.name;
  dom.dishDesc.textContent = dish.desc;
  dom.dishLayer.hidden = false;
  syncChrome();
}

/* ---------------- 分享 ---------------- */

function showShare(dataUrl) {
  dom.sharePreview.innerHTML = '';
  const img = new Image();
  img.src = dataUrl;
  img.alt = '分享图';
  dom.sharePreview.appendChild(img);
  dom.shareLayer.hidden = false;
  syncChrome();
}

function showLoading() {
  dom.sharePreview.innerHTML = '<p class="share-loading">正在装盘…</p>';
  dom.shareLayer.hidden = false;
  syncChrome();
}

async function sharePlant() {
  if (!state.plant) return;
  const def = plantDef();
  const index = stageIndex(state.plant.progress);
  showLoading();

  try {
    const { canvas } = await buildPlantCard({
      state,
      plant: { ...def, currentImage: def.stages[index] },
      stageName: STAGE_TITLES[index],
      days: daysTogether(state.plant.plantedAt)
    });
    ui.share = { canvas };
    showShare(canvasToDataUrl(canvas));
  } catch (error) {
    dom.shareLayer.hidden = true;
    syncChrome();
    toast('分享图没生成成功');
    console.warn(error);
  }
}

async function shareDish() {
  if (!ui.dish) return;
  showLoading();
  try {
    const { canvas } = await buildDishCard({
      state,
      dish: ui.dish,
      usedFruits: ui.dishUsed.map((id) => ({ id, name: FRUITS[id].name })),
      index: state.stats.cooked
    });
    ui.share = { canvas };
    showShare(canvasToDataUrl(canvas));
  } catch (error) {
    dom.shareLayer.hidden = true;
    syncChrome();
    toast('分享图没生成成功');
    console.warn(error);
  }
}

function closeShare() {
  dom.shareLayer.hidden = true;
  dom.sharePreview.innerHTML = '';
  syncChrome();
}

function saveShare() {
  if (!ui.share?.canvas) {
    toast('图片还在准备');
    return;
  }
  downloadCanvas(ui.share.canvas, `${state.gardenName}-${Date.now()}.jpg`);
  toast('已保存');
}

async function sendShare() {
  if (!ui.share?.canvas) {
    toast('图片还在准备');
    return;
  }
  const result = await shareCanvas(ui.share.canvas, `${state.gardenName}.jpg`, state.gardenName);
  if (result.ok) toast(result.mode === 'share' ? '已打开分享' : '已保存并复制文案');
  else if (result.reason !== 'cancel') toast('换个方式保存吧');
}

/* ---------------- 命名 ---------------- */

function openRename(firstRun = false) {
  dom.renameInput.value = state.gardenName;
  dom.renameSkip.hidden = !firstRun;
  dom.renameBar.hidden = false;
  setTimeout(() => dom.renameInput.select(), 60);
}

function closeRename() {
  dom.renameBar.hidden = true;
  syncChrome();
  if (!state.plant) setTimeout(() => openPlantSheet(), 220);
}

function submitRename() {
  const name = normalizeGardenName(dom.renameInput.value);
  state.gardenName = name;
  save();
  applyGardenName(name);
  closeRename();
}

/* ---------------- 拖拽 ---------------- */

function startDrag(event) {
  if (!state.plant || event.button > 0) return;
  const box = sceneBox();
  const rect = stageRect();
  ui.drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    left: rect.left - box.left,
    bottom: box.bottom - rect.bottom,
    w: rect.width,
    h: rect.height,
    box,
    moved: false
  };
  dom.plantStage.setPointerCapture?.(event.pointerId);
}

function onDrag(event) {
  const drag = ui.drag;
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
  if (!drag.moved) return;

  const left = clamp(drag.left + dx, -drag.w / 2 + 24, drag.box.width - drag.w / 2 - 24);
  const bottom = clamp(drag.bottom - dy, 2, drag.box.height - drag.h - 54);
  dom.plantStage.style.left = `${(left / drag.box.width) * 100}%`;
  dom.plantStage.style.bottom = `${(bottom / drag.box.height) * 100}%`;
}

function endDrag(event) {
  const drag = ui.drag;
  if (!drag) return;
  dom.plantStage.releasePointerCapture?.(drag.id);

  if (!drag.moved) {
    ui.drag = null;
    openCare();
    return;
  }

  if (state.plant) {
    state.plant.pos = {
      x: clamp(parseFloat(dom.plantStage.style.left) || 50, 6, 94),
      y: clamp(parseFloat(dom.plantStage.style.bottom) || 14, 2, 56)
    };
    save();
    applyPosition();
  }
  ui.drag = null;
}

/* ---------------- 事件 ---------------- */

function bindEvents() {
  dom.plantStage.addEventListener('pointerdown', startDrag);
  dom.plantStage.addEventListener('pointermove', onDrag);
  dom.plantStage.addEventListener('pointerup', endDrag);
  dom.plantStage.addEventListener('pointercancel', endDrag);
  dom.plantStage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCare();
    }
  });

  dom.widget.addEventListener('pointerenter', () => {
    if (!anySheetOpen()) setChrome(true);
  });
  dom.widget.addEventListener('pointerleave', () => {
    if (!anySheetOpen() && dom.dishLayer.hidden && dom.shareLayer.hidden && dom.cookLayer.hidden) {
      setChrome(false);
    }
  });

  dom.actWater.addEventListener('click', doWater);
  dom.actSoil.addEventListener('click', doSoil);
  dom.actFocus.addEventListener('click', toggleFocus);
  dom.harvestBtn.addEventListener('click', harvest);
  dom.careClose.addEventListener('click', () => {
    dom.careSheet.hidden = true;
    syncChrome();
  });
  dom.sharePlantBtn.addEventListener('click', sharePlant);

  dom.basketBtn.addEventListener('click', () => {
    if (!dom.basketSheet.hidden) {
      dom.basketSheet.hidden = true;
      syncChrome();
      return;
    }
    openBasket();
  });
  dom.basketClose.addEventListener('click', () => {
    dom.basketSheet.hidden = true;
    syncChrome();
  });
  dom.cookBtn.addEventListener('click', cook);

  dom.emptyPlantBtn.addEventListener('click', openPlantSheet);
  dom.plantConfirm.addEventListener('click', confirmPlant);
  dom.plantBack.addEventListener('click', () => {
    ui.step = 1;
    renderPlantSheet();
  });

  dom.dishShare.addEventListener('click', shareDish);
  dom.dishAccept.addEventListener('click', () => {
    dom.dishLayer.hidden = true;
    syncChrome();
    if (Object.values(state.inventory).some((n) => n > 0)) openBasket();
  });

  dom.shareSave.addEventListener('click', saveShare);
  dom.shareSend.addEventListener('click', sendShare);
  dom.shareClose.addEventListener('click', closeShare);

  dom.renameBtn.addEventListener('click', () => openRename(false));
  dom.gardenTitle.addEventListener('click', () => openRename(false));
  dom.renameSave.addEventListener('click', submitRename);
  dom.renameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitRename();
  });
  dom.renameSkip.addEventListener('click', () => {
    dom.renameBar.hidden = true;
    syncChrome();
    if (!state.plant) setTimeout(() => openPlantSheet(), 220);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!dom.shareLayer.hidden) return closeShare();
    if (!dom.dishLayer.hidden) {
      dom.dishLayer.hidden = true;
      syncChrome();
      return;
    }
    closeAll();
  });
}

/* ---------------- 计时 ---------------- */

function tick() {
  const now = Date.now();
  if (state.focus) {
    if (state.focus.endsAt <= now) settleFocus();
    else renderFocusChip();
  }
  if (!dom.careSheet.hidden && state.plant) renderCare();
  if (state.plant) {
    dom.harvestHint.hidden = !(state.plant.progress > 85 && state.plant.progress < 100);
  }
}

function init() {
  const firstRun = !hasSave();

  applyGardenName(state.gardenName);
  buildLists();
  bindEvents();

  renderScene();
  renderBadge();
  renderFocusChip();
  settleFocus();
  syncChrome();

  if (firstRun) {
    openRename(true);
  } else if (!state.plant) {
    dom.emptyPlantBtn.hidden = false;
  }

  setInterval(tick, 1000);
  scheduleIdle();
}

init();
