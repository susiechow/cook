const PLANT_ROOT = 'assets/plants/';
const SHARED = `${PLANT_ROOT}shared/`;
const FRUIT_ROOT = 'assets/fruits/';
const DISH_ROOT = 'assets/dishes/';
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

export const STAGE_SCALES = [0.62, 0.7, 0.78, 0.86, 0.94, 1, 1.02, 1.04, 1.05, 1.06];

const sharedStages = {
  seed: `${SHARED}seed.jpg`,
  sprout: `${SHARED}sprout.jpg`,
  seedlingHerb: `${SHARED}seedling-herb.jpg`,
  seedlingWoody: `${SHARED}seedling-woody.jpg`,
  youngStrawberry: `${SHARED}young-strawberry.jpg`,
  youngBlueberry: `${SHARED}young-blueberry.jpg`,
  youngTree: `${SHARED}young-tree.jpg`,
  treeBranch: `${SHARED}tree-branch.jpg`,
  treeBuds: `${SHARED}tree-buds.jpg`
};

const ownStages = (id, from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const n = String(from + i).padStart(2, '0');
    return `${PLANT_ROOT}${id}/stage-${n}.jpg`;
  });

export const PLANTS = [
  {
    id: 'strawberry',
    name: '草莓',
    fruitLabel: '草莓',
    note: '甜香柔软，做奶昔和大福都很合适',
    tone: '#E8A3A9',
    fruitImage: `${FRUIT_ROOT}strawberry.jpg`,
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
    note: '温润清甜，烤成暖甜品最治愈',
    tone: '#E7A98C',
    fruitImage: `${FRUIT_ROOT}apple.jpg`,
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
    note: '胭脂香气，配气泡饮或冰沙都清爽',
    tone: '#B8C98F',
    fruitImage: `${FRUIT_ROOT}guava.jpg`,
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
    note: '酸香明亮，蜂蜜和雪葩都少不了它',
    tone: '#EBD489',
    fruitImage: `${FRUIT_ROOT}lemon.jpg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingWoody,
      sharedStages.youngTree,
      sharedStages.treeBranch,
      sharedStages.treeBuds,
      ...ownStages('lemon', 7, 10)
    ]
  },
  {
    id: 'blueberry',
    name: '蓝莓',
    fruitLabel: '蓝莓',
    note: '小小一颗，乳酪杯和奶冻里最点睛',
    tone: '#9AA9C9',
    fruitImage: `${FRUIT_ROOT}blueberry.jpg`,
    stages: [
      sharedStages.seed,
      sharedStages.sprout,
      sharedStages.seedlingWoody,
      sharedStages.youngBlueberry,
      ...ownStages('blueberry', 5, 10)
    ]
  }
];

export const PLANTS_BY_ID = Object.fromEntries(PLANTS.map((p) => [p.id, p]));

export const POTS = [
  {
    id: 'cream',
    name: '奶油白陶',
    note: '温柔百搭，像一小块奶油',
    image: `${POT_ROOT}pot-cream.jpg`
  },
  {
    id: 'terracotta',
    name: '赤陶暖盆',
    note: '被阳光晒过的暖红陶土',
    image: `${POT_ROOT}pot-terracotta.jpg`
  },
  {
    id: 'celadon',
    name: '青釉瓷盆',
    note: '雨后青瓷，安静又清透',
    image: `${POT_ROOT}pot-celadon.jpg`
  }
];

export const POTS_BY_ID = Object.fromEntries(POTS.map((p) => [p.id, p]));

export const FRUITS = Object.fromEntries(
  PLANTS.map((p) => [p.id, { name: p.fruitLabel, image: p.fruitImage, tone: p.tone }])
);

export const RECIPES = [
  {
    ids: ['strawberry'],
    name: '草莓牛乳大福',
    type: '甜品',
    tag: '治愈',
    desc: '软糯雪皮裹住一整颗草莓与轻乳霜',
    image: `${DISH_ROOT}dish-strawberry.jpg`
  },
  {
    ids: ['apple'],
    name: '焦糖苹果肉桂烤盅',
    type: '烘焙',
    tag: '治愈',
    desc: '暖苹果与肉桂在陶盅里慢慢塌软',
    image: `${DISH_ROOT}dish-apple.jpg`
  },
  {
    ids: ['guava'],
    name: '芭乐青梅气泡饮',
    type: '饮品',
    tag: '清爽',
    desc: '胭脂芭乐遇上青梅，气泡轻轻炸开',
    image: `${DISH_ROOT}dish-guava.jpg`
  },
  {
    ids: ['lemon'],
    name: '柠檬蜂蜜雪葩',
    type: '冰品',
    tag: '清爽',
    desc: '酸香被蜂蜜收服，一勺凉到心上',
    image: `${DISH_ROOT}dish-lemon.jpg`
  },
  {
    ids: ['blueberry'],
    name: '蓝莓乳酪云朵杯',
    type: '甜品',
    tag: '治愈',
    desc: '蓝莓果酱沉在云朵般的乳酪里',
    image: `${DISH_ROOT}dish-blueberry.jpg`
  },
  {
    ids: ['strawberry', 'apple'],
    name: '草莓苹果玫瑰可丽饼',
    type: '甜品',
    tag: '治愈',
    desc: '薄软饼皮卷起玫瑰色的果香',
    image: `${DISH_ROOT}dish-strawberry-apple.jpg`
  },
  {
    ids: ['strawberry', 'blueberry'],
    name: '莓果双色奶冻',
    type: '甜品',
    tag: '治愈',
    desc: '两层莓果在杯里慢慢晕开',
    image: `${DISH_ROOT}dish-strawberry-blueberry.jpg`
  },
  {
    ids: ['strawberry', 'lemon'],
    name: '草莓柠檬气泡水',
    type: '饮品',
    tag: '清爽',
    desc: '草莓的甜被柠檬气泡托了起来',
    image: `${DISH_ROOT}dish-strawberry-lemon.jpg`
  },
  {
    ids: ['apple', 'lemon'],
    name: '苹果柠檬蜂蜜热茶',
    type: '饮品',
    tag: '温暖',
    desc: '苹果片在热茶里浮沉，蜂蜜收尾',
    image: `${DISH_ROOT}dish-apple-lemon.jpg`
  },
  {
    ids: ['apple', 'blueberry'],
    name: '蓝莓苹果酥派',
    type: '烘焙',
    tag: '治愈',
    desc: '酥皮裂开的一瞬，蓝莓香先跑出来',
    image: `${DISH_ROOT}dish-apple-blueberry.jpg`
  },
  {
    ids: ['guava', 'lemon'],
    name: '芭乐柠檬冻饮',
    type: '饮品',
    tag: '清爽',
    desc: '芭乐的胭脂色被柠檬点亮',
    image: `${DISH_ROOT}dish-guava-lemon.jpg`
  },
  {
    ids: ['strawberry', 'guava'],
    name: '芭乐草莓冰沙',
    type: '冰品',
    tag: '清爽',
    desc: '两种香气打成一杯粉绿相间的凉',
    image: `${DISH_ROOT}dish-strawberry-guava.jpg`
  },
  {
    ids: ['strawberry', 'apple', 'blueberry'],
    name: '三莓森林苹果酥',
    type: '烘焙',
    tag: '治愈',
    desc: '三种莓果与苹果在酥皮里相遇',
    image: `${DISH_ROOT}dish-strawberry-apple-blueberry.jpg`
  },
  {
    ids: ['guava', 'lemon', 'apple'],
    name: '芭乐柠檬暖果茶',
    type: '饮品',
    tag: '温暖',
    desc: '一壶暖茶，把芭乐和柠檬熬成琥珀色',
    image: `${DISH_ROOT}dish-guava-lemon-apple.jpg`
  },
  {
    ids: ['strawberry', 'blueberry', 'lemon'],
    name: '暗夜莓果实验室特调',
    type: '黑暗料理',
    tag: '创意',
    desc: '蓝莓把整杯染成夜色，柠檬负责狡黠的酸',
    image: `${DISH_ROOT}dish-strawberry-blueberry-lemon.jpg`
  }
];

export const FALLBACKS = {
  drink: {
    name: '月光实验特调',
    type: '创意',
    tag: '黑暗料理',
    desc: '两三种果子在杯中碰撞，颜色说不清但意外好喝',
    image: `${DISH_ROOT}dish-fallback-drink.jpg`
  },
  bake: {
    name: '暗夜果园烤盅',
    type: '黑暗料理',
    tag: '创意',
    desc: '把果园里剩下的果子都埋进烤盅，危险又迷人',
    image: `${DISH_ROOT}dish-fallback-bake.jpg`
  }
};

export const TIPS = [
  '今天也一起慢慢长大',
  '给它一点耐心，它会记得',
  '你专注的时候，它也悄悄努力',
  '慢慢来，结果子不急'
];
