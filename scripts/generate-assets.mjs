import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'assets');
const API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
const CONCURRENCY = 3;

const STYLE =
  'gentle watercolor hand-painted illustration, healing cozy style, delicate soft ink outlines, ' +
  'subtle watercolor paper texture, warm natural light, muted sage green and peach palette, ' +
  'front view, fixed camera, plain warm white background, centered composition, ' +
  'generous empty space above, no text, no watermark, no border';

const plant = (subject) =>
  `${STYLE}, single ${subject} growing from a small mound of soil at the bottom center, ` +
  'no pot, full plant visible, same framing as a continuous growth series';

const pot = (subject) =>
  `${STYLE}, empty ${subject} plant pot with soft dark soil inside, no plant, ` +
  'pot occupies 65 percent of frame height, sitting at the bottom center';

const fruit = (subject) => `${STYLE}, a small still-life cluster of ${subject}, one or two green leaves`;

const dish = (subject) =>
  'cozy cafe food illustration, gentle watercolor hand-painted style, healing soft color palette, ' +
  'warm natural light, plain warm cream background, centered composition, no text, no watermark, no border, ' +
  subject;

const ASSETS = [
  // ---- shared growth stages (9) ----
  {
    id: 'seed',
    path: 'plants/shared/seed.jpg',
    prompt: plant('one small brown seed resting in a tiny mound of soft dark soil, first stage of growth')
  },
  {
    id: 'sprout',
    path: 'plants/shared/sprout.jpg',
    prompt: plant('a tiny two-leaf sprout just breaking through a small mound of soil, round cotyledon leaves')
  },
  {
    id: 'seedling-herb',
    path: 'plants/shared/seedling-herb.jpg',
    prompt: plant('young strawberry seedling with three small serrated leaves in a low rosette')
  },
  {
    id: 'seedling-woody',
    path: 'plants/shared/seedling-woody.jpg',
    prompt: plant('young woody seedling with a slender stem and four small oval leaves')
  },
  {
    id: 'young-strawberry',
    path: 'plants/shared/young-strawberry.jpg',
    prompt: plant('young strawberry plant, low rosette of serrated green leaves with a few runners')
  },
  {
    id: 'young-blueberry',
    path: 'plants/shared/young-blueberry.jpg',
    prompt: plant('young blueberry shrub with several thin woody stems and small oval leaves')
  },
  {
    id: 'young-tree',
    path: 'plants/shared/young-tree.jpg',
    prompt: plant('young fruit tree sapling with a slim trunk, a few branches and oval leaves')
  },
  {
    id: 'tree-branch',
    path: 'plants/shared/tree-branch.jpg',
    prompt: plant('young fruit tree with fuller branches and many oval green leaves, no flowers yet')
  },
  {
    id: 'tree-buds',
    path: 'plants/shared/tree-buds.jpg',
    prompt: plant('fruit tree with small closed flower buds among fresh green leaves')
  },

  // ---- strawberry 5-10 ----
  {
    id: 'strawberry-05',
    path: 'plants/strawberry/stage-05.jpg',
    prompt: plant('strawberry plant with lush serrated leaves and thin runners spreading on the soil')
  },
  {
    id: 'strawberry-06',
    path: 'plants/strawberry/stage-06.jpg',
    prompt: plant('strawberry plant with small white flower buds appearing among green leaves')
  },
  {
    id: 'strawberry-07',
    path: 'plants/strawberry/stage-07.jpg',
    prompt: plant('strawberry plant in full bloom with delicate white flowers and yellow centers')
  },
  {
    id: 'strawberry-08',
    path: 'plants/strawberry/stage-08.jpg',
    prompt: plant('strawberry plant with tiny green unripe strawberries hanging among leaves')
  },
  {
    id: 'strawberry-09',
    path: 'plants/strawberry/stage-09.jpg',
    prompt: plant('strawberry plant with strawberries turning from green to soft pink')
  },
  {
    id: 'strawberry-10',
    path: 'plants/strawberry/stage-10.jpg',
    prompt: plant('strawberry plant with ripe red strawberries and a few white flowers')
  },

  // ---- apple 7-10 ----
  {
    id: 'apple-07',
    path: 'plants/apple/stage-07.jpg',
    prompt: plant('apple tree in full bloom with soft pink-white blossoms')
  },
  {
    id: 'apple-08',
    path: 'plants/apple/stage-08.jpg',
    prompt: plant('apple tree with small green apples hanging among leaves')
  },
  {
    id: 'apple-09',
    path: 'plants/apple/stage-09.jpg',
    prompt: plant('apple tree with apples ripening to blush red')
  },
  {
    id: 'apple-10',
    path: 'plants/apple/stage-10.jpg',
    prompt: plant('apple tree with ripe red apples ready to harvest')
  },

  // ---- guava 7-10 ----
  {
    id: 'guava-07',
    path: 'plants/guava/stage-07.jpg',
    prompt: plant('guava tree in bloom with white fluffy flowers')
  },
  {
    id: 'guava-08',
    path: 'plants/guava/stage-08.jpg',
    prompt: plant('guava tree with small green guavas hanging among leaves')
  },
  {
    id: 'guava-09',
    path: 'plants/guava/stage-09.jpg',
    prompt: plant('guava tree with pale green-yellow guavas ripening')
  },
  {
    id: 'guava-10',
    path: 'plants/guava/stage-10.jpg',
    prompt: plant('guava tree with ripe yellow-green guavas ready to harvest')
  },

  // ---- lemon 7-10 ----
  {
    id: 'lemon-07',
    path: 'plants/lemon/stage-07.jpg',
    prompt: plant('lemon tree with white and pale purple blossoms')
  },
  {
    id: 'lemon-08',
    path: 'plants/lemon/stage-08.jpg',
    prompt: plant('lemon tree with small green lemons hanging among glossy leaves')
  },
  {
    id: 'lemon-09',
    path: 'plants/lemon/stage-09.jpg',
    prompt: plant('lemon tree with lemons turning pale yellow')
  },
  {
    id: 'lemon-10',
    path: 'plants/lemon/stage-10.jpg',
    prompt: plant('lemon tree with ripe yellow lemons ready to harvest')
  },

  // ---- blueberry 5-10 ----
  {
    id: 'blueberry-05',
    path: 'plants/blueberry/stage-05.jpg',
    prompt: plant('blueberry bush with many small oval green leaves on slender stems')
  },
  {
    id: 'blueberry-06',
    path: 'plants/blueberry/stage-06.jpg',
    prompt: plant('blueberry bush with small pink-white bell-shaped flower buds')
  },
  {
    id: 'blueberry-07',
    path: 'plants/blueberry/stage-07.jpg',
    prompt: plant('blueberry bush with delicate bell-shaped white-pink flowers')
  },
  {
    id: 'blueberry-08',
    path: 'plants/blueberry/stage-08.jpg',
    prompt: plant('blueberry bush with tiny green berries forming')
  },
  {
    id: 'blueberry-09',
    path: 'plants/blueberry/stage-09.jpg',
    prompt: plant('blueberry bush with blueberries turning from green to dusty blue')
  },
  {
    id: 'blueberry-10',
    path: 'plants/blueberry/stage-10.jpg',
    prompt: plant('blueberry bush with ripe blue berries ready to harvest')
  },

  // ---- pots (3) ----
  {
    id: 'pot-cream',
    path: 'pots/pot-cream.jpg',
    prompt: pot('round cream ceramic')
  },
  {
    id: 'pot-terracotta',
    path: 'pots/pot-terracotta.jpg',
    prompt: pot('warm terracotta clay')
  },
  {
    id: 'pot-celadon',
    path: 'pots/pot-celadon.jpg',
    prompt: pot('pale celadon glazed ceramic')
  },

  // ---- fruits (5) ----
  {
    id: 'fruit-strawberry',
    path: 'fruits/strawberry.jpg',
    prompt: fruit('fresh ripe strawberries with two green leaves')
  },
  {
    id: 'fruit-apple',
    path: 'fruits/apple.jpg',
    prompt: fruit('a crisp red apple with a small green leaf')
  },
  {
    id: 'fruit-guava',
    path: 'fruits/guava.jpg',
    prompt: fruit('a ripe guava cut in half showing pink flesh, with a leaf')
  },
  {
    id: 'fruit-lemon',
    path: 'fruits/lemon.jpg',
    prompt: fruit('a ripe yellow lemon with a small leaf and one slice')
  },
  {
    id: 'fruit-blueberry',
    path: 'fruits/blueberry.jpg',
    prompt: fruit('a small cluster of plump blueberries with tiny leaves')
  },

  // ---- dishes (17) ----
  {
    id: 'dish-strawberry',
    path: 'dishes/dish-strawberry.jpg',
    prompt: dish('a strawberry daifuku mochi cut open, soft white mochi with cream and a whole strawberry inside, on a small ceramic plate')
  },
  {
    id: 'dish-apple',
    path: 'dishes/dish-apple.jpg',
    prompt: dish('caramel apple cinnamon cobbler baked in a small terracotta ramekin, warm golden crust and a cinnamon stick')
  },
  {
    id: 'dish-guava',
    path: 'dishes/dish-guava.jpg',
    prompt: dish('guava plum sparkling soda in a tall glass, pale pink drink with ice bubbles and a mint leaf')
  },
  {
    id: 'dish-lemon',
    path: 'dishes/dish-lemon.jpg',
    prompt: dish('lemon honey sorbet in a small glass cup, pale yellow, lemon slice and frosty texture')
  },
  {
    id: 'dish-blueberry',
    path: 'dishes/dish-blueberry.jpg',
    prompt: dish('blueberry cheesecake cloud cup in a glass, layers of whipped cream and blueberry compote')
  },
  {
    id: 'dish-strawberry-apple',
    path: 'dishes/dish-strawberry-apple.jpg',
    prompt: dish('strawberry apple rose crepe, thin rolled crepes with pink cream and fruit slices on a ceramic plate')
  },
  {
    id: 'dish-strawberry-blueberry',
    path: 'dishes/dish-strawberry-blueberry.jpg',
    prompt: dish('two-tone berry panna cotta in a glass, pink strawberry layer and purple blueberry layer')
  },
  {
    id: 'dish-strawberry-lemon',
    path: 'dishes/dish-strawberry-lemon.jpg',
    prompt: dish('strawberry lemon sparkling water in a glass, bubbles, strawberry slices and a lemon wheel')
  },
  {
    id: 'dish-apple-lemon',
    path: 'dishes/dish-apple-lemon.jpg',
    prompt: dish('apple lemon honey hot tea in a clear glass cup, apple slices, lemon and gentle steam')
  },
  {
    id: 'dish-apple-blueberry',
    path: 'dishes/dish-apple-blueberry.jpg',
    prompt: dish('blueberry apple pie with lattice crust, one slice on a plate, purple filling')
  },
  {
    id: 'dish-guava-lemon',
    path: 'dishes/dish-guava-lemon.jpg',
    prompt: dish('guava lemon frozen drink in a glass, pale pink with crushed ice and a lemon slice')
  },
  {
    id: 'dish-strawberry-guava',
    path: 'dishes/dish-strawberry-guava.jpg',
    prompt: dish('strawberry guava smoothie in a glass, pink and soft green swirl, fruit on top')
  },
  {
    id: 'dish-strawberry-apple-blueberry',
    path: 'dishes/dish-strawberry-apple-blueberry.jpg',
    prompt: dish('mixed berry apple crumble with golden crumb topping in a small baking dish')
  },
  {
    id: 'dish-guava-lemon-apple',
    path: 'dishes/dish-guava-lemon-apple.jpg',
    prompt: dish('guava lemon apple warm fruit tea in a small glass teapot, amber color, fruit slices')
  },
  {
    id: 'dish-strawberry-blueberry-lemon',
    path: 'dishes/dish-strawberry-blueberry-lemon.jpg',
    prompt: dish('mysterious dark berry soda in an apothecary glass, deep purple, smoke and tiny bubbles, creative dark cuisine')
  },
  {
    id: 'dish-fallback-drink',
    path: 'dishes/dish-fallback-drink.jpg',
    prompt: dish('surreal creative berry drink in a glass, layered unusual colors and gentle smoke, creative dark cuisine')
  },
  {
    id: 'dish-fallback-bake',
    path: 'dishes/dish-fallback-bake.jpg',
    prompt: dish('surreal dark fruit bake in a small dish, deep purple and amber tones, gentle smoke, creative dark cuisine')
  }
];

const SAMPLE_IDS = new Set([
  'seed',
  'sprout',
  'strawberry-07',
  'strawberry-10',
  'young-tree',
  'pot-cream',
  'fruit-strawberry',
  'dish-strawberry'
]);

async function fetchImage(prompt, attempt = 1) {
  const url = `${API}?prompt=${encodeURIComponent(prompt)}&image_size=square`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.startsWith('image/')) throw new Error(`unexpected content-type: ${type}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    return fetchImage(prompt, attempt + 1);
  }
}

async function processAsset(item, force) {
  const target = path.join(ROOT, item.path);
  if (!force) {
    try {
      const stat = await fs.stat(target);
      if (stat.size > 1000) return { id: item.id, path: item.path, bytes: stat.size, ok: true, skipped: true };
    } catch {
      // missing, continue
    }
  }
  const buffer = await fetchImage(item.prompt);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return { id: item.id, path: item.path, bytes: buffer.length, ok: true, skipped: false };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const sample = args.includes('--sample');
  const filterArg = args.find((arg) => arg.startsWith('--filter='));
  const filter = filterArg ? filterArg.slice('--filter='.length) : '';

  let queue = ASSETS;
  if (sample) queue = queue.filter((item) => SAMPLE_IDS.has(item.id));
  if (filter) queue = queue.filter((item) => item.id.includes(filter) || item.path.includes(filter));

  if (!queue.length) {
    console.error('没有匹配的素材');
    process.exit(1);
  }

  console.log(`准备生成 ${queue.length} 张素材${sample ? '（样张模式）' : ''}…`);
  const results = [];
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await processAsset(item, force);
          console.log(`${result.skipped ? '跳过' : '完成'} ${result.path} (${result.bytes} bytes)`);
          return result;
        } catch (error) {
          console.error(`失败 ${item.path}: ${error.message}`);
          return { id: item.id, path: item.path, ok: false, error: error.message };
        }
      })
    );
    results.push(...settled);
  }

  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: results.length,
        failed: results.filter((item) => !item.ok).length,
        items: results
      },
      null,
      2
    )
  );
  const failed = results.filter((item) => !item.ok);
  if (failed.length) {
    console.error(`有 ${failed.length} 张失败，可加 --filter= 重跑`);
    process.exitCode = 1;
  } else {
    console.log('全部完成');
  }
}

main();
