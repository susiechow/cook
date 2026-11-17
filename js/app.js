import {
  PLANTS,
  PLANTS_BY_ID,
  POTS,
  POTS_BY_ID,
  FRUITS,
  STAGE_TITLES,
  STAGE_SCALES,
  TIPS
} from './data.js';
import {
  stageIndex,
  stageTitle,
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

const WATER_CD = 10 * 60 * 1000;
const SOIL_CD = 30 * 60 * 1000;
const FOCUS_MS = 25 * 60 * 1000;
const PLANT_BOX = 230;

const $ = (id) => document.getElementById(id);

const dom = {
  widget: $('widget'),
  gardenTitle: $('gardenTitle'),
  renameBtn: $('renameBtn'),
  basketBtn: $('basketBtn'),
  basketBadge: $('basketBadge'),
  scene: $('scene'),
  plantWrap: $('plantWrap'),
  plantImg: $('plantImg'),
  potImg: $('potImg'),
  stageTag: $('stageTag'),
  harvestHint: $('harvestHint'),
  focusPill: $('focusPill'),
  focusPillText: $('focusPillText'),
  emptyState: $('emptyState'),
  emptyPlantBtn: $('emptyPlantBtn'),
  fxLayer: $('fxLayer'),
  toast: $('toast'),
  renameBar: $('renameBar'),
  renameInput: $('renameInput'),
  renameSave: $('renameSave'),
  renameSkip: $('renameSkip'),
  careSheet: $('careSheet'),
  carePlantName: $('carePlantName'),
  careStage: $('careStage'),
  careWhisper: $('careWhisper'),
  sharePlantBtn: $('sharePlantBtn'),
  actWater: $('actWater'),
  waterNote: $('waterNote'),
  actFocus: $('actFocus'),
  focusNote: $('focusNote'),
  focusIco: $('focusIco'),
  actSoil: $('actSoil'),
  soilNote: $('soilNote'),
  harvestBtn: $('harvestBtn'),
  careClose: $('careClose'),
  plantSheet: $('plantSheet'),
  plantStepNum: $('plantStepNum'),
  plantSheetTitle: $('plantSheetTitle'),
  plantBack: $('plantBack'),
  seedGrid: $('seedGrid'),
  potGrid: $('potGrid'),
  plantConfirm: $('plantConfirm'),
  plantNote: $('plantNote'),
  basketSheet: $('basketSheet'),
  basketClose: $('basketClose'),
  inventoryGrid: $('inventoryGrid'),
  pickedChips: $('pickedChips'),
  cookBtn: $('cookBtn'),
  basketNote: $('basketNote'),
  dishSheet: $('dishSheet'),
  dishImg: $('dishImg'),
  dishType: $('dishType'),
  dishName: $('dishName'),
  dishDesc: $('dishDesc'),
  dishUsed: $('dishUsed'),
  dishShare: $('dishShare'),
  dishAccept: $('dishAccept'),
  shareSheet: $('shareSheet'),
  shareClose: $('shareClose'),
  sharePreview: $('sharePreview'),
  shareCaption: $('shareCaption'),
  shareSave: $('shareSave'),
  shareSend: $('shareSend'),
  shareBack: $('shareBack'),
  cookOverlay: $('cookOverlay'),
  cookText: $('cookText'),
  cookBarFill: $('cookBarFill'),
  tipText: $('tipText')
};

let state = loadState();
const ui = {
  seedStep: 1,
  selectedSeed: null,
  selectedPot: null,
  picked: [],
  dish: null,
  dishUsed: [],
  share: null,
  cooking: null,
  drag: null,
  hinted: false,
  tipIndex: 0
};

/* ---------------- 占位图 ---------------- */

const svg = (body, w = 200, h = 200) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><filter id="s"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(#s)">${body}</g></svg>`
  )}`;

const PLACEHOLDERS = {
  plant: svg(`
    <ellipse cx="100" cy="176" rx="46" ry="13" fill="#8a6a4c" opacity=".55"/>
    <path d="M100 176V104" stroke="#6f8a6b" stroke-width="3" fill="none"/>
    <path d="M100 124c-22-4-32-16-34-30 18 2 29 12 34 30Z" fill="#93a98d"/>
    <path d="M100 116c20-5 29-18 30-32-17 3-27 13-30 32Z" fill="#a8bc9f"/>
    <circle cx="100" cy="92" r="9" fill="#e8a3a9" opacity=".75"/>
  `),
  pot: svg(`
    <ellipse cx="100" cy="176" rx="40" ry="9" fill="#8a6a4c" opacity=".28"/>
    <path d="M58 96h84l-9 74a10 10 0 0 1-10 8H77a10 10 0 0 1-10-8Z" fill="#e3d2ba" stroke="#b8a689" />
    <ellipse cx="100" cy="96" rx="42" ry="12" fill="#c9b394"/>
  `),
  fruit: svg(`
    <circle cx="88" cy="108" r="34" fill="#e8a3a9"/>
    <circle cx="120" cy="118" r="26" fill="#f0b7a0"/>
    <path d="M92 74c10-8 20-8 30-2-8 10-19 12-30 2Z" fill="#93a98d"/>
  `),
  dish: svg(`
    <ellipse cx="100" cy="150" rx="54" ry="12" fill="#c9b394" opacity=".45"/>
    <path d="M56 92h88l-8 58a12 12 0 0 1-12 10H76a12 12 0 0 1-12-10Z" fill="#efe3cf" stroke="#b8a689"/>
    <ellipse cx="100" cy="92" rx="44" ry="11" fill="#f7efe0" stroke="#b8a689"/>
    <circle cx="94" cy="86" r="9" fill="#e8a3a9"/>
  `)
};

function bindFallback(img, kind) {
  img.addEventListener('error', () => {
    img.dataset.failed = img.getAttribute('src') || '';
    img.src = PLACEHOLDERS[kind];
    img.classList.add('img-missing');
  });
}

function makeImg(src, kind, alt = '') {
  const img = new Image();
  img.alt = alt;
  img.draggable = false;
  bindFallback(img, kind);
  img.src = src;
  return img;
}

/* ---------------- 通用 ---------------- */

function save() {
  saveState(state);
}

let toastTimer = null;
function toast(message, duration = 2200) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), duration);
}

function applyGardenName(name) {
  dom.gardenTitle.textContent = name;
  document.title = name;
}

function sceneBox() {
  return dom.scene.getBoundingClientRect();
}

function plantDef() {
  return state.plant ? PLANTS_BY_ID[state.plant.fruitId] : null;
}

function plantImage() {
  const def = plantDef();
  if (!def || !state.plant) return '';
  return def.stages[stageIndex(state.plant.progress)];
}

function hasActiveFocus() {
  return Boolean(state.focus && state.focus.endsAt > Date.now());
}

/* ---------------- 场景渲染 ---------------- */

function setPlantImage(src, animate = true) {
  if (!animate) {
    dom.plantImg.src = src;
    return;
  }
  dom.plantImg.classList.add('swapping');
  setTimeout(() => {
    dom.plantImg.src = src;
    requestAnimationFrame(() => dom.plantImg.classList.remove('swapping'));
  }, 260);
}

function applyPlantPosition() {
  if (!state.plant) return;
  dom.plantWrap.style.left = `${state.plant.pos.x}%`;
  dom.plantWrap.style.bottom = `${state.plant.pos.y}%`;
}

function renderScene() {
  const def = plantDef();

  if (!def) {
    dom.plantWrap.hidden = true;
    dom.stageTag.hidden = true;
    dom.harvestHint.hidden = true;
    dom.emptyState.hidden = false;
    return;
  }

  dom.emptyState.hidden = true;
  dom.plantWrap.hidden = false;

  const index = stageIndex(state.plant.progress);
  const previous = dom.plantImg.dataset.stage;
  const nextSrc = plantImage();
  const plantFailed = dom.plantImg.dataset.failed === nextSrc;

  if (!plantFailed) {
    if (previous !== undefined && Number(previous) !== index) {
      setPlantImage(nextSrc, true);
    } else if (dom.plantImg.getAttribute('src') !== nextSrc) {
      setPlantImage(nextSrc, false);
    }
  }
  dom.plantImg.dataset.stage = String(index);
  dom.plantImg.style.width = `${Math.round(PLANT_BOX * STAGE_SCALES[index])}px`;

  const potSrc = POTS_BY_ID[state.plant.potId]?.image || POTS[0].image;
  if (dom.potImg.dataset.failed !== potSrc && dom.potImg.getAttribute('src') !== potSrc) {
    dom.potImg.src = potSrc;
  }

  dom.stageTag.hidden = false;
  dom.stageTag.textContent = STAGE_TITLES[index];

  dom.harvestHint.hidden = !(state.plant.progress > 85 && state.plant.progress < 100);

  applyPlantPosition();
}

function renderBadge() {
  const total = Object.values(state.inventory).reduce((sum, n) => sum + n, 0);
  dom.basketBadge.textContent = total > 99 ? '99+' : String(total);
}

function bumpBadge() {
  dom.basketBadge.classList.add('bump');
  setTimeout(() => dom.basketBadge.classList.remove('bump'), 300);
}

/* ---------------- 动效 ---------------- */

function spawnDrop(count = 8) {
  const rect = dom.plantWrap.getBoundingClientRect();
  const box = sceneBox();
  const top = rect.top - box.top;
  const left = rect.left - box.left;
  for (let i = 0; i < count; i += 1) {
    const drop = document.createElement('span');
    drop.className = 'drop';
    drop.style.left = `${left + rect.width * (0.34 + Math.random() * 0.32)}px`;
    drop.style.top = `${Math.max(0, top + rect.height * (0.1 + Math.random() * 0.3))}px`;
    drop.style.setProperty('--dx', `${(Math.random() - 0.5) * 26}px`);
    drop.style.setProperty('--dy', `${50 + Math.random() * 60}px`);
    drop.style.animationDelay = `${i * 0.08}s`;
    dom.fxLayer.appendChild(drop);
    setTimeout(() => drop.remove(), 2000);
  }
}

function spawnSoil(count = 10) {
  const rect = dom.plantWrap.getBoundingClientRect();
  const box = sceneBox();
  const baseX = rect.left - box.left + rect.width / 2;
  const baseY = rect.bottom - box.top - 18;
  for (let i = 0; i < count; i += 1) {
    const bit = document.createElement('span');
    bit.className = 'soil-bit';
    bit.style.left = `${baseX + (Math.random() - 0.5) * rect.width * 0.5}px`;
    bit.style.top = `${baseY}px`;
    bit.style.setProperty('--dx', `${(Math.random() - 0.5) * 70}px`);
    bit.style.setProperty('--dy', `${-18 - Math.random() * 34}px`);
    bit.style.animationDelay = `${i * 0.05}s`;
    dom.fxLayer.appendChild(bit);
    setTimeout(() => bit.remove(), 1500);
  }
}

function spawnSparks(count = 3) {
  const rect = dom.plantWrap.getBoundingClientRect();
  const box = sceneBox();
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.style.left = `${rect.left - box.left + rect.width * (0.3 + Math.random() * 0.4)}px`;
    spark.style.top = `${rect.top - box.top + rect.height * (0.2 + Math.random() * 0.4)}px`;
    spark.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
    spark.style.animationDelay = `${i * 0.18}s`;
    dom.fxLayer.appendChild(spark);
    setTimeout(() => spark.remove(), 2200);
  }
}

function spawnPetals(count = 4) {
  const box = sceneBox();
  for (let i = 0; i < count; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = `${20 + Math.random() * (box.width - 50)}px`;
    petal.style.top = `${30 + Math.random() * 90}px`;
    petal.style.setProperty('--dx', `${20 + Math.random() * 50}px`);
    petal.style.animationDelay = `${Math.random() * 1.2}s`;
    dom.fxLayer.appendChild(petal);
    setTimeout(() => petal.remove(), 6500);
  }
}

function gust() {
  if (dom.plantWrap.hidden) return;
  dom.plantWrap.style.setProperty('--sway-dur', `${(3.4 + Math.random() * 3.4).toFixed(1)}s`);
  dom.plantWrap.classList.add('gust');
  setTimeout(() => dom.plantWrap.classList.remove('gust'), 950);
}

function scheduleIdle() {
  const wait = 7000 + Math.random() * 7000;
  setTimeout(() => {
    gust();
    const index = state.plant ? stageIndex(state.plant.progress) : -1;
    if (index >= 5 && index <= 8) spawnPetals(3);
    scheduleIdle();
  }, wait);
}

function flyToBasket(fruit) {
  const start = dom.plantWrap.getBoundingClientRect();
  const end = dom.basketBtn.getBoundingClientRect();
  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:${start.left + start.width / 2 - 18}px;top:${
    start.top + start.height * 0.42
  }px;width:36px;height:36px;border-radius:50%;background:${fruit.tone};box-shadow:0 6px 12px -6px rgba(90,70,50,.6);z-index:99;pointer-events:none;`;
  document.body.appendChild(node);
  const anim = node.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      {
        transform: `translate(${end.left - start.left}px, ${end.top - start.top + 6}px) scale(0.4)`,
        opacity: 0.2
      }
    ],
    { duration: 720, easing: 'cubic-bezier(.4,.1,.7,.5)' }
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
  renderCare();
  if (message) toast(message);

  const afterIndex = stageIndex(state.plant.progress);
  if (afterIndex !== beforeIndex) {
    spawnSparks(3);
    toast(STAGE_TITLES[afterIndex]);
  }

  if (state.plant.progress >= 100 && before < 100) {
    toast('果子熟啦，可以收下来了');
    spawnSparks(5);
  }
}

/* ---------------- 照顾面板 ---------------- */

function careWhisper() {
  if (!state.plant) return '';
  if (state.plant.progress >= 100) return '果子已经熟透，收下来吧';
  if (state.plant.progress > 85) return '快结果了，加油坚持';
  const index = stageIndex(state.plant.progress);
  if (index === 0) return '种子在土里安静地醒着';
  if (index === 1) return '它顶开了土，第一次看见光';
  if (index === 2) return '两片小叶子正慢慢摊开';
  return '叶子一天比一天精神';
}

function renderCare() {
  if (!state.plant) {
    closeSheet(dom.careSheet);
    return;
  }
  const def = plantDef();
  const index = stageIndex(state.plant.progress);
  dom.carePlantName.textContent = def.name;
  dom.careStage.textContent = STAGE_TITLES[index];
  dom.careWhisper.textContent = careWhisper();

  const now = Date.now();
  const waterLeft = state.cooldowns.waterUntil - now;
  const soilLeft = state.cooldowns.soilUntil - now;
  const finished = state.plant.progress >= 100;

  const waterBlocked = waterLeft > 0 || finished;
  const soilBlocked = soilLeft > 0 || finished;

  dom.actWater.classList.toggle('disabled', waterBlocked);
  dom.actSoil.classList.toggle('disabled', soilBlocked);
  dom.waterNote.textContent = finished
    ? '已成熟'
    : waterLeft > 0
      ? `${formatCountdown(waterLeft)} 后可浇`
      : '成长 +3%';
  dom.soilNote.textContent = finished
    ? '已成熟'
    : soilLeft > 0
      ? `${formatCountdown(soilLeft)} 后可松土`
      : '成长 +3%';

  const focusing = hasActiveFocus();
  dom.actFocus.classList.toggle('disabled', finished);
  dom.focusIco.classList.toggle('running', focusing);
  dom.focusNote.textContent = finished
    ? '已成熟'
    : focusing
      ? formatCountdown(state.focus.endsAt - now)
      : '25:00 · +5%';

  dom.harvestBtn.hidden = !finished;
}

function openCare() {
  if (!state.plant) return;
  closeSheet(dom.basketSheet);
  closeSheet(dom.dishSheet);
  renderCare();
  dom.careSheet.hidden = false;
}

function closeSheet(sheet) {
  if (sheet) sheet.hidden = true;
}

/* ---------------- 喝水 / 松土 / 专注 ---------------- */

function doWater() {
  if (!state.plant) return;
  const now = Date.now();
  if (state.plant.progress >= 100) return;
  if (state.cooldowns.waterUntil > now) {
    toast(`${formatCountdown(state.cooldowns.waterUntil - now)} 后才能再浇水`);
    return;
  }

  spawnDrop(9);
  state.cooldowns.waterUntil = now + WATER_CD;
  save();
  grow(3, '喝饱了水，往上长了一点点');
  dom.plantWrap.classList.add('gust');
  setTimeout(() => dom.plantWrap.classList.remove('gust'), 900);
}

function doSoil() {
  if (!state.plant) return;
  const now = Date.now();
  if (state.plant.progress >= 100) return;
  if (state.cooldowns.soilUntil > now) {
    toast(`${formatCountdown(state.cooldowns.soilUntil - now)} 后才能再松土`);
    return;
  }

  spawnSoil(10);
  state.cooldowns.soilUntil = now + SOIL_CD;
  save();
  grow(3, '土壤松软了，根须舒展了一下');
  dom.plantWrap.classList.add('gust');
  setTimeout(() => dom.plantWrap.classList.remove('gust'), 900);
}

function toggleFocus() {
  if (!state.plant) return;
  if (state.plant.progress >= 100) return;

  if (hasActiveFocus()) {
    if (window.confirm('要放弃这次专注吗？放弃就没有成长奖励了')) {
      state.focus = null;
      save();
      renderFocusPill();
      renderCare();
      toast('这次专注先放一放');
    }
    return;
  }

  const now = Date.now();
  state.focus = { startedAt: now, endsAt: now + FOCUS_MS, rewarded: false };
  save();
  renderFocusPill();
  renderCare();
  toast('专注开始了，它陪你一起');
}

function renderFocusPill() {
  const active = hasActiveFocus();
  dom.focusPill.hidden = !active;
  if (active) {
    dom.focusPillText.textContent = `专注 ${formatCountdown(state.focus.endsAt - Date.now())}`;
  }
}

function settleFocus() {
  if (!state.focus) {
    renderFocusPill();
    return;
  }

  if (state.focus.endsAt > Date.now()) {
    renderFocusPill();
    return;
  }

  if (state.focus.rewarded) {
    state.focus = null;
    save();
    renderFocusPill();
    return;
  }

  state.focus = null;
  save();
  renderFocusPill();
  if (state.plant) {
    grow(5, '专注完成，它也长了一点点');
    spawnSparks(4);
    spawnPetals(3);
  } else {
    toast('专注完成，感谢这段时间的陪伴');
  }
}

/* ---------------- 收获 ---------------- */

function harvest() {
  if (!state.plant || !isHarvestReady(state.plant.progress)) return;
  const def = plantDef();
  const fruit = FRUITS[def.id];

  flyToBasket(fruit);
  state.inventory[def.id] = (state.inventory[def.id] || 0) + 1;
  state.stats.harvested += 1;
  state.plant = null;
  state.focus = null;
  save();

  closeSheet(dom.careSheet);
  renderScene();
  renderBadge();
  renderFocusPill();
  toast(`收到一颗${def.fruitLabel}，放进小仓库了`);

  setTimeout(() => openPlantSheet(), 760);
}

/* ---------------- 选种 / 选盆 ---------------- */

function openPlantSheet() {
  if (state.plant) return;
  closeSheet(dom.careSheet);
  closeSheet(dom.basketSheet);
  closeSheet(dom.dishSheet);
  ui.seedStep = 1;
  ui.selectedSeed = null;
  ui.selectedPot = null;
  renderPlantSheet();
  dom.plantSheet.hidden = false;
}

function renderPlantSheet() {
  const stepOne = ui.seedStep === 1;
  dom.plantStepNum.textContent = stepOne ? '第 1 步 / 共 2 步' : '第 2 步 / 共 2 步';
  dom.plantSheetTitle.textContent = stepOne ? '选一株想种的' : '挑一个花盆';
  dom.seedGrid.hidden = !stepOne;
  dom.potGrid.hidden = stepOne;
  dom.plantBack.hidden = stepOne;

  if (stepOne) {
    dom.plantNote.textContent = '果子成熟后会收进小仓库';
    dom.plantConfirm.textContent = '下一步';
    dom.plantConfirm.disabled = !ui.selectedSeed;
  } else {
    dom.plantNote.textContent = '每次重新种植都可以换一个花盆';
    dom.plantConfirm.textContent = '种下它';
    dom.plantConfirm.disabled = !ui.selectedPot;
  }
}

function buildSeedGrid() {
  dom.seedGrid.innerHTML = '';
  for (const plant of PLANTS) {
    const card = document.createElement('div');
    card.className = 'seed-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.dataset.id = plant.id;

    const thumb = document.createElement('div');
    thumb.className = 'seed-thumb';
    thumb.appendChild(makeImg(plant.fruitImage, 'fruit', plant.name));

    const name = document.createElement('span');
    name.className = 'seed-name';
    name.textContent = plant.name;

    const note = document.createElement('span');
    note.className = 'seed-note';
    note.textContent = plant.note;

    card.append(thumb, name, note);
    const pick = () => {
      ui.selectedSeed = plant.id;
      [...dom.seedGrid.children].forEach((node) => node.classList.toggle('selected', node.dataset.id === plant.id));
      dom.plantConfirm.disabled = false;
    };
    card.addEventListener('click', pick);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick();
      }
    });
    dom.seedGrid.appendChild(card);
  }
}

function buildPotGrid() {
  dom.potGrid.innerHTML = '';
  for (const pot of POTS) {
    const card = document.createElement('div');
    card.className = 'pot-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.dataset.id = pot.id;

    const thumb = document.createElement('div');
    thumb.className = 'pot-thumb';
    thumb.appendChild(makeImg(pot.image, 'pot', pot.name));

    const name = document.createElement('span');
    name.className = 'seed-name';
    name.textContent = pot.name;

    card.append(thumb, name);
    const pick = () => {
      ui.selectedPot = pot.id;
      [...dom.potGrid.children].forEach((node) => node.classList.toggle('selected', node.dataset.id === pot.id));
      dom.plantConfirm.disabled = false;
    };
    card.addEventListener('click', pick);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick();
      }
    });
    dom.potGrid.appendChild(card);
  }
}

function confirmPlant() {
  if (ui.seedStep === 1) {
    if (!ui.selectedSeed) return;
    ui.seedStep = 2;
    if (!ui.selectedPot) ui.selectedPot = POTS[0].id;
    renderPlantSheet();
    [...dom.potGrid.children].forEach((node) => node.classList.toggle('selected', node.dataset.id === ui.selectedPot));
    dom.plantConfirm.disabled = false;
    return;
  }

  if (!ui.selectedSeed || !ui.selectedPot) return;
  state.plant = {
    fruitId: ui.selectedSeed,
    potId: ui.selectedPot,
    progress: 0,
    pos: { x: 50, y: 18 },
    plantedAt: Date.now()
  };
  state.focus = null;
  save();
  closeSheet(dom.plantSheet);
  renderScene();
  renderBadge();
  renderFocusPill();
  const def = PLANTS_BY_ID[ui.selectedSeed];
  toast(`${def.name}种下了，慢慢陪它长大`);
  dom.plantWrap.classList.add('gust');
  setTimeout(() => dom.plantWrap.classList.remove('gust'), 900);
}

/* ---------------- 仓库 ---------------- */

function openBasket() {
  ui.picked = [];
  renderBasket();
  dom.basketSheet.hidden = false;
  closeSheet(dom.careSheet);
  closeSheet(dom.dishSheet);
}

function renderBasket() {
  dom.inventoryGrid.innerHTML = '';
  for (const plant of PLANTS) {
    const count = state.inventory[plant.id] || 0;
    const card = document.createElement('div');
    card.className = 'inv-card';
    card.dataset.id = plant.id;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    if (count === 0) card.classList.add('empty');
    if (ui.picked.includes(plant.id)) card.classList.add('selected');

    const thumb = document.createElement('div');
    thumb.className = 'inv-thumb';
    thumb.appendChild(makeImg(plant.fruitImage, 'fruit', plant.name));

    const name = document.createElement('span');
    name.className = 'inv-name';
    name.textContent = plant.name;

    const num = document.createElement('span');
    num.className = 'inv-count';
    num.textContent = `×${count}`;

    card.append(thumb, name, num);

    if (count > 0) {
      const pick = () => {
        if (ui.picked.includes(plant.id)) {
          ui.picked = ui.picked.filter((id) => id !== plant.id);
        } else if (ui.picked.length < 3) {
          ui.picked.push(plant.id);
        } else {
          toast('最多选 3 种果子');
          return;
        }
        renderBasket();
      };
      card.addEventListener('click', pick);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          pick();
        }
      });
    }

    dom.inventoryGrid.appendChild(card);
  }

  dom.pickedChips.innerHTML = '';
  for (const id of ui.picked) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = FRUITS[id].name;
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
  if (ui.picked.length === 0) {
    const hint = document.createElement('span');
    hint.className = 'inv-count';
    hint.textContent = '还没有选';
    dom.pickedChips.appendChild(hint);
  }

  const check = validateCook(state.inventory, ui.picked);
  dom.cookBtn.disabled = !check.ok;
  dom.basketNote.textContent = check.ok
    ? '选好了，看看能做出什么'
    : check.reason || '任选 1–3 种，看看会做出什么';
}

/* ---------------- 烹饪 ---------------- */

const COOK_STEPS = [
  { at: 0, text: '把果子洗干净…' },
  { at: 0.9, text: '切一切，香气先跑出来了' },
  { at: 1.9, text: '轻轻搅拌，慢慢融合' },
  { at: 3.1, text: '温度刚好，甜味在冒泡' },
  { at: 4.4, text: '快好了，再等一下下' }
];

function cook() {
  const check = validateCook(state.inventory, ui.picked);
  if (!check.ok) {
    toast(check.reason);
    return;
  }

  const used = [...ui.picked];
  closeSheet(dom.basketSheet);
  dom.cookOverlay.hidden = false;
  dom.cookBarFill.style.width = '0%';

  const total = 5500;
  const start = performance.now();
  let stepIndex = -1;

  ui.cooking = setInterval(() => {
    const elapsed = performance.now() - start;
    const ratio = clamp(elapsed / total, 0, 1);
    dom.cookBarFill.style.width = `${ratio * 100}%`;

    const seconds = elapsed / 1000;
    let next = 0;
    for (let i = 0; i < COOK_STEPS.length; i += 1) {
      if (seconds >= COOK_STEPS[i].at) next = i;
    }
    if (next !== stepIndex) {
      stepIndex = next;
      dom.cookText.textContent = COOK_STEPS[next].text;
    }

    if (ratio >= 1) {
      clearInterval(ui.cooking);
      ui.cooking = null;
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

  dom.cookOverlay.hidden = true;
  renderBadge();

  dom.dishImg.dataset.fallback = '';
  dom.dishImg.src = dish.image;
  dom.dishType.textContent = `${dish.type} · ${dish.tag}${isFallback ? ' · 实验出品' : ''}`;
  dom.dishName.textContent = dish.name;
  dom.dishDesc.textContent = dish.desc;

  dom.dishUsed.innerHTML = '';
  for (const id of used) {
    const span = document.createElement('span');
    const dot = document.createElement('i');
    dot.style.backgroundImage = `url("${FRUITS[id].image}")`;
    span.append(dot, document.createTextNode(FRUITS[id].name));
    dom.dishUsed.appendChild(span);
  }

  dom.dishSheet.hidden = false;
  toast('叮——做好了');
}

/* ---------------- 分享 ---------------- */

function openSharePreview(dataUrl, filename, caption) {
  ui.share = { dataUrl, filename, caption };
  dom.sharePreview.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = '分享图预览';
  dom.sharePreview.appendChild(img);
  dom.shareCaption.textContent = caption;
  dom.shareSheet.hidden = false;
}

async function sharePlant() {
  if (!state.plant) return;
  const def = plantDef();
  const index = stageIndex(state.plant.progress);
  dom.sharePreview.innerHTML = '<p class="share-loading">正在装盘…</p>';
  dom.shareCaption.textContent = '';
  dom.shareSheet.hidden = false;
  ui.share = null;

  try {
    const { canvas, filename, caption } = await buildPlantCard({
      state,
      plant: { ...def, currentImage: def.stages[index] },
      stageName: STAGE_TITLES[index],
      days: daysTogether(state.plant.plantedAt)
    });
    openSharePreview(canvasToDataUrl(canvas), filename, caption);
    ui.share.canvas = canvas;
  } catch (error) {
    dom.shareSheet.hidden = true;
    toast('分享图生成失败，请稍后再试');
    console.warn(error);
  }
}

async function shareDish() {
  if (!ui.dish) return;
  dom.sharePreview.innerHTML = '<p class="share-loading">正在装盘…</p>';
  dom.shareCaption.textContent = '';
  dom.shareSheet.hidden = false;
  ui.share = null;

  try {
    const usedFruits = ui.dishUsed.map((id) => ({ name: FRUITS[id].name }));
    const { canvas, filename, caption } = await buildDishCard({
      state,
      dish: ui.dish,
      usedFruits,
      index: state.stats.cooked
    });
    openSharePreview(canvasToDataUrl(canvas), filename, caption);
    ui.share.canvas = canvas;
  } catch (error) {
    dom.shareSheet.hidden = true;
    toast('分享图生成失败，请稍后再试');
    console.warn(error);
  }
}

function closeShare() {
  dom.shareSheet.hidden = true;
  ui.share = null;
}

async function saveShare() {
  if (ui.share?.canvas) {
    downloadCanvas(ui.share.canvas, ui.share.filename);
    toast('图片已保存');
    return;
  }
  if (ui.share?.dataUrl) {
    const link = document.createElement('a');
    link.href = ui.share.dataUrl;
    link.download = ui.share.filename || 'share.jpg';
    link.click();
    toast('图片已保存');
  }
}

async function sendShare() {
  if (!ui.share?.canvas) {
    toast('图片还在准备中');
    return;
  }
  const result = await shareCanvas(ui.share.canvas, ui.share.filename, ui.share.caption);
  if (result.ok) {
    toast(result.mode === 'share' ? '已打开分享面板' : '已保存图片，文案也复制好了');
  } else if (result.reason !== 'cancel') {
    toast('分享没有成功，可以先保存图片');
  }
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
}

function submitRename() {
  const name = normalizeGardenName(dom.renameInput.value);
  state.gardenName = name;
  save();
  applyGardenName(name);
  closeRename();
  toast(`这个小园叫「${name}」`);

  if (!state.plant) {
    setTimeout(() => openPlantSheet(), 320);
  }
}

/* ---------------- 拖拽 ---------------- */

function startDrag(event) {
  if (!state.plant || event.button > 0) return;
  const box = sceneBox();
  const rect = dom.plantWrap.getBoundingClientRect();
  ui.drag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originLeft: rect.left - box.left,
    originBottom: box.bottom - rect.bottom,
    wrapW: rect.width,
    wrapH: rect.height,
    box,
    moved: false
  };
  dom.plantWrap.classList.add('dragging');
  dom.plantWrap.setPointerCapture?.(event.pointerId);
}

function onDrag(event) {
  const drag = ui.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
  if (!drag.moved) return;

  const left = clamp(drag.originLeft + dx, 0, drag.box.width - drag.wrapW);
  const bottom = clamp(drag.originBottom - dy, 0, drag.box.height - drag.wrapH);

  dom.plantWrap.style.left = `${(left / drag.box.width) * 100}%`;
  dom.plantWrap.style.bottom = `${(bottom / drag.box.height) * 100}%`;
}

function endDrag(event) {
  const drag = ui.drag;
  if (!drag) return;
  dom.plantWrap.classList.remove('dragging');
  dom.plantWrap.releasePointerCapture?.(drag.pointerId);

  if (!drag.moved) {
    ui.drag = null;
    openCare();
    return;
  }

  if (state.plant) {
    state.plant.pos = {
      x: clamp((dom.plantWrap.offsetLeft / drag.box.width) * 100, 8, 92),
      y: clamp(((drag.box.height - dom.plantWrap.offsetTop - drag.wrapH) / drag.box.height) * 100, 1, 68)
    };
    save();
    applyPlantPosition();
  }
  ui.drag = null;
}

/* ---------------- 初始化 ---------------- */

function rotateTip() {
  ui.tipIndex = (ui.tipIndex + 1) % TIPS.length;
  dom.tipText.textContent = TIPS[ui.tipIndex];
}

function tick() {
  const now = Date.now();

  if (state.focus) {
    if (state.focus.endsAt <= now) {
      settleFocus();
    } else {
      renderFocusPill();
    }
  }

  if (!dom.careSheet.hidden) renderCare();
  if (state.plant) {
    dom.harvestHint.hidden = !(state.plant.progress > 85 && state.plant.progress < 100);
  }
}

function bindEvents() {
  dom.plantWrap.addEventListener('pointerdown', startDrag);
  dom.plantWrap.addEventListener('pointermove', onDrag);
  dom.plantWrap.addEventListener('pointerup', endDrag);
  dom.plantWrap.addEventListener('pointercancel', endDrag);
  dom.plantWrap.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCare();
    }
  });

  dom.actWater.addEventListener('click', doWater);
  dom.actSoil.addEventListener('click', doSoil);
  dom.actFocus.addEventListener('click', toggleFocus);
  dom.actWater.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      doWater();
    }
  });
  dom.actSoil.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      doSoil();
    }
  });
  dom.actFocus.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFocus();
    }
  });

  dom.harvestBtn.addEventListener('click', harvest);
  dom.careClose.addEventListener('click', () => closeSheet(dom.careSheet));
  dom.sharePlantBtn.addEventListener('click', sharePlant);

  dom.basketBtn.addEventListener('click', openBasket);
  dom.basketClose.addEventListener('click', () => closeSheet(dom.basketSheet));
  dom.cookBtn.addEventListener('click', cook);

  dom.emptyPlantBtn.addEventListener('click', openPlantSheet);
  dom.plantConfirm.addEventListener('click', confirmPlant);
  dom.plantBack.addEventListener('click', () => {
    ui.seedStep = 1;
    renderPlantSheet();
  });

  dom.dishAccept.addEventListener('click', () => {
    dom.dishSheet.hidden = true;
    if (Object.values(state.inventory).some((n) => n > 0)) {
      openBasket();
    }
  });
  dom.dishShare.addEventListener('click', shareDish);

  dom.shareClose.addEventListener('click', closeShare);
  dom.shareBack.addEventListener('click', closeShare);
  dom.shareSave.addEventListener('click', saveShare);
  dom.shareSend.addEventListener('click', sendShare);

  dom.renameBtn.addEventListener('click', () => openRename(false));
  dom.gardenTitle.addEventListener('click', () => openRename(false));
  dom.renameSave.addEventListener('click', submitRename);
  dom.renameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitRename();
  });
  dom.renameSkip.addEventListener('click', closeRename);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!dom.shareSheet.hidden) {
      closeShare();
      return;
    }
    closeSheet(dom.careSheet);
    closeSheet(dom.basketSheet);
    closeSheet(dom.dishSheet);
  });
}

function init() {
  const firstRun = !hasSave();

  applyGardenName(state.gardenName);
  buildSeedGrid();
  buildPotGrid();
  bindFallback(dom.plantImg, 'plant');
  bindFallback(dom.potImg, 'pot');
  bindFallback(dom.dishImg, 'dish');
  bindEvents();

  renderScene();
  renderBadge();
  renderFocusPill();
  settleFocus();
  renderCare();

  if (firstRun) {
    openRename(true);
  } else if (!state.plant) {
    dom.emptyState.hidden = false;
  }

  setInterval(tick, 1000);
  setInterval(rotateTip, 14000);
  scheduleIdle();
}

init();
