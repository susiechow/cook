const PLANT_ROOT = 'assets/plants/';
const SHARED = `${PLANT_ROOT}shared/`;
const FRUIT_ROOT = 'assets/fruits/';
const POT_ROOT = 'assets/pots/';

export const STAGE_TITLES = [
  '种子入土',
  '破土发芽',
  '幼苗初展',
  '稚株成形',
  '抽枝展叶',
  '花苞初现',
  '花开正好',
  '青果初结',
  '果实转色',
  '成熟待收'
];

export const STAGE_SCALES = [0.42, 0.48, 0.58, 0.7, 0.82, 0.9, 0.95, 0.98, 1, 1];

const sharedStages = {
  seed: `${SHARED}seed.webp`,
  sprout: `${SHARED}sprout.webp`,
  seedlingHerb: `${SHARED}seedling-herb.webp`,
  seedlingWoody: `${SHARED}seedling-woody.webp`,
  youngStrawberry: `${SHARED}young-strawberry.webp`,
  youngBlueberry: `${SHARED}young-blueberry.webp`,
  youngTree: `${SHARED}young-tree.webp`,
  treeBranch: `${SHARED}tree-branch.webp`,
  treeBuds: `${SHARED}tree-buds.webp`
};

const ownStages = (id, from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const n = String(from + i).padStart(2, '0');
    return `${PLANT_ROOT}${id}/stage-${n}.webp`;
  });

export const PLANTS = [
  {
    id: 'strawberry',
    name: '草莓',
    fruitLabel: '草莓',
    tone: '#e2625a',
    fruitImage: `${FRUIT_ROOT}strawberry.svg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingHerb,
      sharedStages.youngStrawberry,
      ...ownStages('strawberry', 5, 10)
    ]
  },
  {
    id: 'apple',
    name: '苹果',
    fruitLabel: '苹果',
    tone: '#d9705a',
    fruitImage: `${FRUIT_ROOT}apple.svg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingWoody,
      sharedStages.youngTree,
      sharedStages.treeBranch,
      sharedStages.treeBuds,
      ...ownStages('apple', 7, 10)
    ]
  },
  {
    id: 'guava',
    name: '芭乐',
    fruitLabel: '芭乐',
    tone: '#c9d492',
    fruitImage: `${FRUIT_ROOT}guava.svg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingWoody,
      sharedStages.youngTree,
      sharedStages.treeBranch,
      sharedStages.treeBuds,
      ...ownStages('guava', 7, 10)
    ]
  },
  {
    id: 'lemon',
    name: '柠檬',
    fruitLabel: '柠檬',
    tone: '#e6c452',
    fruitImage: `${FRUIT_ROOT}lemon.svg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingWoody,
      sharedStages.youngTree,
      sharedStages.treeBranch,
      sharedStages.treeBuds,
      sharedStages.treeBuds,
      sharedStages.treeBuds,
      sharedStages.treeBuds,
      sharedStages.treeBuds
    ]
  },
  {
    id: 'blueberry',
    name: '蓝莓',
    fruitLabel: '蓝莓',
    tone: '#6c7cb0',
    fruitImage: `${FRUIT_ROOT}blueberry.svg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingWoody,
      sharedStages.youngBlueberry,
      sharedStages.youngBlueberry,
      sharedStages.youngBlueberry,
      sharedStages.youngBlueberry,
      sharedStages.youngBlueberry,
      sharedStages.youngBlueberry,
      sharedStages.youngBlueberry
    ]
  }
];

export const PLANTS_BY_ID = Object.fromEntries(PLANTS.map((p) => [p.id, p]));

export const POTS = [
  { id: 'cream', name: '奶油白陶', image: `${POT_ROOT}pot-cream.svg` },
  { id: 'terracotta', name: '赤陶暖盆', image: `${POT_ROOT}pot-terracotta.svg` },
  { id: 'celadon', name: '青釉瓷盆', image: `${POT_ROOT}pot-celadon.svg` }
];

export const POTS_BY_ID = Object.fromEntries(POTS.map((p) => [p.id, p]));

export const FRUITS = Object.fromEntries(
  PLANTS.map((p) => [p.id, { name: p.fruitLabel, image: p.fruitImage, tone: p.tone }])
);

export const RECIPES = [
  { ids: ['strawberry'], name: '草莓牛乳大福', type: '甜品', tag: '治愈', desc: '软糯雪皮裹住一整颗草莓与轻乳霜' },
  { ids: ['apple'], name: '焦糖苹果肉桂烤盅', type: '烘焙', tag: '治愈', desc: '暖苹果与肉桂在陶盅里慢慢塌软' },
  { ids: ['guava'], name: '芭乐青梅气泡饮', type: '饮品', tag: '清爽', desc: '胭脂芭乐遇上青梅，气泡轻轻炸开' },
  { ids: ['lemon'], name: '柠檬蜂蜜雪葩', type: '冰品', tag: '清爽', desc: '酸香被蜂蜜收服，一勺凉到心上' },
  { ids: ['blueberry'], name: '蓝莓乳酪云朵杯', type: '甜品', tag: '治愈', desc: '蓝莓果酱沉在云朵般的乳酪里' },
  { ids: ['strawberry', 'apple'], name: '草莓苹果玫瑰可丽饼', type: '甜品', tag: '治愈', desc: '薄软饼皮卷起玫瑰色的果香' },
  { ids: ['strawberry', 'blueberry'], name: '莓果双色奶冻', type: '甜品', tag: '治愈', desc: '两层莓果在杯里慢慢晕开' },
  { ids: ['strawberry', 'lemon'], name: '草莓柠檬气泡水', type: '饮品', tag: '清爽', desc: '草莓的甜被柠檬气泡托了起来' },
  { ids: ['apple', 'lemon'], name: '苹果柠檬蜂蜜热茶', type: '饮品', tag: '温暖', desc: '苹果片在热茶里浮沉，蜂蜜收尾' },
  { ids: ['apple', 'blueberry'], name: '蓝莓苹果酥派', type: '烘焙', tag: '治愈', desc: '酥皮裂开的一瞬，蓝莓香先跑出来' },
  { ids: ['guava', 'lemon'], name: '芭乐柠檬冻饮', type: '饮品', tag: '清爽', desc: '芭乐的胭脂色被柠檬点亮' },
  { ids: ['strawberry', 'guava'], name: '芭乐草莓冰沙', type: '冰品', tag: '清爽', desc: '两种香气打成一杯粉绿相间的凉' },
  { ids: ['strawberry', 'apple', 'blueberry'], name: '三莓森林苹果酥', type: '烘焙', tag: '治愈', desc: '三种莓果与苹果在酥皮里相遇' },
  { ids: ['guava', 'lemon', 'apple'], name: '芭乐柠檬暖果茶', type: '饮品', tag: '温暖', desc: '一壶暖茶，把芭乐和柠檬熬成琥珀色' },
  { ids: ['strawberry', 'blueberry', 'lemon'], name: '暗夜莓果实验室特调', type: '黑暗料理', tag: '创意', desc: '蓝莓把整杯染成夜色，柠檬负责狡黠的酸' }
];

export const FALLBACKS = {
  drink: { type: '创意', tag: '黑暗料理', desc: '两三种果子在杯中碰撞，颜色说不清但意外好喝' },
  bake: { type: '黑暗料理', tag: '创意', desc: '把果园里剩下的果子都埋进烤盅，危险又迷人' }
};
