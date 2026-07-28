/**
 * Bulk product + review seeder for load/perf testing.
 *
 * Inserts realistic-looking products straight through the native driver
 * (batched insertMany) instead of Mongoose `create()` — 10k docs one-by-one
 * through the ODM takes minutes; batched it takes seconds.
 *
 * Every generated doc carries the `PERF-` SKU prefix and a `perf-seed` tag so
 * the batch can be removed again without touching real data.
 *
 * Writes touch ONLY the `products` and `reviews` collections. Users and
 * categories are read to build references but are never modified.
 *
 *   node scripts/seed-products.js               # 10,000 products + reviews
 *   node scripts/seed-products.js --count=5000
 *   node scripts/seed-products.js --no-reviews  # products only
 *   node scripts/seed-products.js --fix-indexes # rebuild the text index only
 *   node scripts/seed-products.js --clear       # delete seeded products+reviews
 *   node scripts/seed-products.js --stats       # counts only, no writes
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..');
const SKU_PREFIX = 'PERF-';
const SEED_TAG = 'perf-seed';
const BATCH_SIZE = 1000;

// Mongo allows exactly one text index per collection. The legacy index only
// covered name + description with equal weight; models/Product.ts declares
// name + tags + description with weights, so the old one has to go first.
const STALE_TEXT_INDEX = 'name_text_description_text';
const TEXT_INDEX_NAME = 'product_text_search';

// ── env ──────────────────────────────────────────────────────────────────────
function loadMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  for (const file of ['.env.local', '.env']) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const match = fs
      .readFileSync(full, 'utf8')
      .match(/^\s*MONGODB_URI\s*=\s*["']?([^"'\n\r]+)["']?/m);
    if (match) return match[1];
  }

  throw new Error('MONGODB_URI not found in env or .env.local');
}

// ── args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

// ── deterministic RNG so re-runs produce the same catalogue ──────────────────
let rngState = 0x9e3779b9;
function rand() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const float = (min, max, dp = 2) =>
  parseFloat((min + rand() * (max - min)).toFixed(dp));
const chance = (p) => rand() < p;

function pickSome(arr, count) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < count && copy.length; i++) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

// ── vocabulary ───────────────────────────────────────────────────────────────
const BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'LG',
  'Bose',
  'JBL',
  'Sennheiser',
  'Beats',
  'Sonos',
  'Logitech',
  'Corsair',
  'SteelSeries',
  'Razer',
  'Asus',
  'Acer',
  'Dell',
  'HP',
  'Lenovo',
  'MSI',
  'OnePlus',
  'Xiaomi',
  'Google',
  'Canon',
  'Nikon',
  'Fujifilm',
  'GoPro',
  'Dyson',
  'Philips',
  'Bosch',
  'Midea',
  'Honeywell',
  'KitchenAid',
  'Instant Pot',
  'Ninja',
  'Nike',
  'Adidas',
  'Puma',
  'Levi’s',
  'H&M',
  'Mango',
  'Zara',
  'Uniqlo'
];

const ADJECTIVES = [
  'Ultra',
  'Pro',
  'Elite',
  'Compact',
  'Premium',
  'Classic',
  'Smart',
  'Wireless',
  'Portable',
  'Ergonomic',
  'Rugged',
  'Lightweight',
  'Modular',
  'Titanium',
  'Carbon',
  'Matte',
  'Signature',
  'Studio',
  'Everyday',
  'Hybrid'
];

const NOUNS = [
  'Headphones',
  'Earbuds',
  'Smartphone',
  'Laptop',
  'Tablet',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Speaker',
  'Soundbar',
  'Camera',
  'Lens',
  'Drone',
  'Smartwatch',
  'Fitness Band',
  'Power Bank',
  'Charger',
  'Backpack',
  'Sneakers',
  'Jacket',
  'T-Shirt',
  'Jeans',
  'Sunglasses',
  'Watch',
  'Blender',
  'Air Fryer',
  'Coffee Maker',
  'Vacuum',
  'Air Purifier',
  'Rice Cooker',
  'Desk Lamp',
  'Office Chair',
  'Gaming Console',
  'Controller',
  'VR Headset',
  'Router',
  'SSD Drive',
  'Microphone'
];

const FEATURES = [
  'noise cancelling',
  'fast charging',
  'water resistant',
  'bluetooth 5.3',
  'long battery life',
  'usb-c',
  'foldable design',
  'voice assistant',
  'oled display',
  'high refresh rate',
  'rgb lighting',
  'eco friendly',
  'travel friendly',
  'quick release',
  'anti-slip grip',
  'dust proof'
];

const MATERIALS = [
  'aluminium',
  'brushed steel',
  'recycled plastic',
  'tempered glass',
  'vegan leather',
  'carbon fibre',
  'silicone',
  'oak wood',
  'cotton blend'
];

const COLORS = [
  'Black',
  'White',
  'Silver',
  'Space Gray',
  'Midnight Blue',
  'Forest Green',
  'Sand',
  'Rose Gold',
  'Graphite',
  'Red'
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '128GB', '256GB', '512GB', '1TB'];

const IMAGE_POOL = [
  'cld-sample.jpg',
  'cld-sample-2.jpg',
  'cld-sample-3.jpg',
  'cld-sample-4.jpg',
  'cld-sample-5.jpg',
  'samples/ecommerce/accessories-bag.jpg',
  'samples/ecommerce/analog-classic.jpg',
  'samples/ecommerce/car-interior-design.jpg',
  'samples/ecommerce/leather-bag-gray.jpg',
  'samples/ecommerce/shoes.jpg',
  'samples/food/pot-mussels.jpg',
  'samples/food/spices.jpg',
  'samples/landscapes/beach-boat.jpg',
  'samples/landscapes/nature-mountains.jpg'
].map(
  (p) =>
    `https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fill,q_auto,f_auto/${p}`
);

const REVIEW_TITLES = [
  'Exactly what I needed',
  'Great value for the price',
  'Solid build quality',
  'Better than expected',
  'Does the job well',
  'Would buy again',
  'Happy with this purchase',
  'Good, with a few caveats',
  'Decent but not perfect',
  'Arrived quickly, works fine',
  'Impressive for the money',
  'Not quite what I hoped'
];

const REVIEW_OPENERS = [
  'Been using this for a few weeks now and',
  'Bought this after a lot of comparison shopping and',
  'Replaced my old one with this and',
  'Picked this up on sale and',
  'Ordered it for daily use and',
  'Gifted this to a family member and'
];

const REVIEW_MIDDLES = [
  'the build quality is noticeably better than the previous model.',
  'it handles everyday use without any complaints.',
  'setup took about five minutes with no manual needed.',
  'it feels sturdier than the price would suggest.',
  'the finish scuffs a little more easily than I expected.',
  'battery life is comfortably a full day of use.',
  'it is lighter than the photos make it look.'
];

const REVIEW_CLOSERS = [
  'Packaging was tidy and delivery was on time.',
  'Would recommend it to anyone on a budget.',
  'Docking a star because the instructions are thin.',
  'No regrets so far.',
  'Support answered my question within a day.',
  'Will update this if anything changes.'
];

function buildDescription(name, brand, features, material) {
  return (
    `The ${name} from ${brand} is built around ${material} and tuned for daily use. ` +
    `Highlights include ${features.join(', ')}. ` +
    `Ships with a two-year warranty and free returns within 30 days, ` +
    `so you can try it at home before committing.`
  );
}

// Spread createdAt over the last two years so "newest" sorting is meaningful.
const NOW = Date.now();
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

// Ratings cluster high on real storefronts — a flat 1-5 spread would make the
// "4 stars & up" filter meaningless.
function reviewRating() {
  const roll = rand();
  if (roll < 0.42) return 5;
  if (roll < 0.72) return 4;
  if (roll < 0.87) return 3;
  if (roll < 0.96) return 2;
  return 1;
}

function buildReviews(product, productId, users) {
  // The {productId, userId} unique index caps this at one review per user,
  // so the ceiling is however many customer accounts exist.
  const wanted = chance(0.25) ? 0 : int(1, users.length);
  const reviewers = pickSome(users, wanted);
  const productCreated = product.createdAt.getTime();
  const span = Math.max(NOW - productCreated, 24 * 60 * 60 * 1000);

  return reviewers.map((user) => {
    const createdAt = new Date(productCreated + Math.floor(rand() * span));
    return {
      productId,
      userId: user._id,
      userName: user.name,
      rating: reviewRating(),
      title: pick(REVIEW_TITLES),
      body: `${pick(REVIEW_OPENERS)} ${pick(REVIEW_MIDDLES)} ${pick(
        REVIEW_CLOSERS
      )}`,
      verified: chance(0.6),
      // Mirrors the real moderation queue: most approved, a few still pending.
      status: chance(0.85) ? 'approved' : 'pending',
      createdAt,
      updatedAt: createdAt,
      __v: 0
    };
  });
}

function buildProduct(index, categoryIds) {
  const brand = pick(BRANDS);
  const adjective = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const material = pick(MATERIALS);
  const modelCode = `${String.fromCharCode(65 + int(0, 25))}${int(100, 999)}`;
  const name = `${brand} ${adjective} ${noun} ${modelCode}`;

  // Long tail of cheap items with a thinner premium tail — closer to a real
  // catalogue than a flat uniform spread, and it exercises price sorting.
  const price = parseFloat((5 + Math.pow(rand(), 2.2) * 2995).toFixed(2));
  const hasDiscount = chance(0.45);
  const features = pickSome(FEATURES, int(2, 4));
  const sku = `${SKU_PREFIX}${String(index).padStart(6, '0')}`;
  const createdAt = new Date(NOW - Math.floor(rand() * TWO_YEARS_MS));

  const variantCount = chance(0.55) ? int(1, 4) : 0;
  const variants = [];
  const usedAttrs = new Set();
  for (let v = 0; v < variantCount; v++) {
    const attributes = { color: pick(COLORS), size: pick(SIZES) };
    const key = `${attributes.color}|${attributes.size}`;
    if (usedAttrs.has(key)) continue;
    usedAttrs.add(key);
    variants.push({
      sku: `${sku}-V${v + 1}`,
      attributes,
      price: parseFloat((price * float(0.85, 1.35, 3)).toFixed(2)),
      stock: int(0, 120),
      image: pick(IMAGE_POOL)
    });
  }

  return {
    name,
    description: buildDescription(name, brand, features, material),
    price,
    ...(hasDiscount
      ? { compareAtPrice: parseFloat((price * float(1.1, 1.6)).toFixed(2)) }
      : {}),
    cost: parseFloat((price * float(0.4, 0.7)).toFixed(2)),
    sku,
    // 8-prefixed barcodes stay clear of the existing 1-prefixed ones.
    barcode: `8${String(index).padStart(11, '0')}`,
    categoryId: pick(categoryIds),
    tags: [
      SEED_TAG,
      brand.toLowerCase(),
      noun.toLowerCase(),
      adjective.toLowerCase(),
      ...features
    ],
    // ~8% out of stock so empty-stock UI states show up under load.
    stock: chance(0.08) ? 0 : int(1, 800),
    weight: float(0.1, 12),
    length: float(5, 60),
    width: float(5, 40),
    height: float(1, 30),
    brand,
    active: chance(0.92),
    featured: chance(0.12),
    // Overwritten from the generated reviews below; the API derives both from
    // approved reviews only (see recalcProductRating), so they must agree.
    rating: 0,
    reviewCount: 0,
    salesCount: int(0, 4000),
    variants,
    seo: {
      title: `${name}`.slice(0, 60),
      description: `Buy the ${name} — ${features[0]}.`.slice(0, 160),
      keywords: [brand, noun, ...features].join(', ').slice(0, 255)
    },
    images: pickSome(IMAGE_POOL, int(2, 4)),
    createdAt,
    updatedAt: createdAt,
    __v: 0
  };
}

// Builds a product together with its reviews, keeping the denormalised
// rating/reviewCount on the product in sync with the approved review docs.
function buildProductWithReviews(index, categoryIds, users) {
  const product = buildProduct(index, categoryIds);
  product._id = new mongoose.Types.ObjectId();

  if (!users.length) return { product, reviews: [] };

  const reviews = buildReviews(product, product._id, users);
  const approved = reviews.filter((r) => r.status === 'approved');

  if (approved.length) {
    const avg =
      approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
    product.rating = Math.round(avg * 10) / 10;
    product.reviewCount = approved.length;
  }

  return { product, reviews };
}

// ── index maintenance ────────────────────────────────────────────────────────
async function fixTextIndex(products) {
  const existing = await products.indexes();
  const names = existing.map((i) => i.name);

  if (names.includes(STALE_TEXT_INDEX)) {
    await products.dropIndex(STALE_TEXT_INDEX);
    console.log(`🧹 Dropped stale text index "${STALE_TEXT_INDEX}".`);
  }

  if (names.includes(TEXT_INDEX_NAME)) {
    console.log(`👍 Text index "${TEXT_INDEX_NAME}" already present.`);
    return;
  }

  await products.createIndex(
    { name: 'text', tags: 'text', description: 'text' },
    {
      weights: { name: 10, tags: 5, description: 1 },
      name: TEXT_INDEX_NAME,
      background: true
    }
  );
  console.log(
    `🔤 Created text index "${TEXT_INDEX_NAME}" (name:10, tags:5, description:1).`
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const uri = loadMongoUri();
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const products = db.collection('products');
  const reviews = db.collection('reviews');

  const seededFilter = { sku: { $regex: `^${SKU_PREFIX}` } };

  const seededProductIds = async () =>
    (await products.find(seededFilter).project({ _id: 1 }).toArray()).map(
      (p) => p._id
    );

  const report = async (label) => {
    const ids = await seededProductIds();
    const [total, totalReviews, seededReviews] = await Promise.all([
      products.countDocuments(),
      reviews.countDocuments(),
      ids.length
        ? reviews.countDocuments({ productId: { $in: ids } })
        : Promise.resolve(0)
    ]);
    console.log(
      `${label} products: ${total} (${ids.length} seeded, ${
        total - ids.length
      } original)`
    );
    console.log(
      `${label} reviews: ${totalReviews} (${seededReviews} seeded, ${
        totalReviews - seededReviews
      } original)`
    );
  };

  if (flag('stats')) {
    await report('📊');
    return;
  }

  if (flag('fix-indexes')) {
    await fixTextIndex(products);
    return;
  }

  if (flag('clear')) {
    // Delete reviews first, while the seeded product ids are still resolvable.
    const ids = await seededProductIds();
    let removedReviews = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const { deletedCount } = await reviews.deleteMany({
        productId: { $in: ids.slice(i, i + BATCH_SIZE) }
      });
      removedReviews += deletedCount;
    }

    const { deletedCount } = await products.deleteMany(seededFilter);
    console.log(
      `🗑️  Removed ${deletedCount} seeded products and ${removedReviews} of their reviews.`
    );
    await report('📊');
    return;
  }

  const count = parseInt(value('count', '10000'), 10);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`Invalid --count: ${value('count', '10000')}`);
  }

  await fixTextIndex(products);

  const categories = await db
    .collection('categories')
    .find({ active: true })
    .project({ _id: 1 })
    .toArray();

  if (!categories.length) {
    throw new Error('No active categories found — seed categories first.');
  }
  const categoryIds = categories.map((c) => c._id);

  // Read-only: reviewers are drawn from the accounts that already exist, so the
  // users collection stays untouched.
  const users = flag('no-reviews')
    ? []
    : await db
        .collection('users')
        .find({ role: { $ne: 'admin' } })
        .project({ _id: 1, name: 1 })
        .toArray();

  if (!flag('no-reviews') && !users.length) {
    throw new Error('No customer accounts found — cannot attach reviews.');
  }

  // Continue numbering after any previous run so SKUs never collide.
  const [last] = await products
    .find(seededFilter)
    .sort({ sku: -1 })
    .limit(1)
    .project({ sku: 1 })
    .toArray();
  const startIndex = last
    ? parseInt(last.sku.slice(SKU_PREFIX.length), 10) + 1
    : 1;

  console.log(
    `🌱 Seeding ${count} products across ${categoryIds.length} categories ` +
      `(SKU ${SKU_PREFIX}${String(startIndex).padStart(6, '0')} onwards)` +
      (users.length
        ? ` with up to ${users.length} reviews each...`
        : ' without reviews...')
  );

  const started = Date.now();
  let inserted = 0;
  let insertedReviews = 0;

  for (let offset = 0; offset < count; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, count - offset);
    const built = Array.from({ length: size }, (_, i) =>
      buildProductWithReviews(startIndex + offset + i, categoryIds, users)
    );

    const result = await products.insertMany(
      built.map((b) => b.product),
      { ordered: false }
    );
    inserted += result.insertedCount;

    const reviewBatch = built.flatMap((b) => b.reviews);
    if (reviewBatch.length) {
      const reviewResult = await reviews.insertMany(reviewBatch, {
        ordered: false
      });
      insertedReviews += reviewResult.insertedCount;
    }

    const elapsed = (Date.now() - started) / 1000;
    console.log(
      `📦 ${inserted}/${count} products, ${insertedReviews} reviews ` +
        `(${elapsed.toFixed(1)}s, ${Math.round(
          inserted / Math.max(elapsed, 0.001)
        )} products/s)`
    );
  }

  console.log(
    `✅ Done in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
      `${inserted} products and ${insertedReviews} reviews inserted.`
  );
  await report('📊');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
