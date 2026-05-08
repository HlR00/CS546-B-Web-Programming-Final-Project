import { randomUUID } from 'crypto';
import { dbConnection, closeConnection } from './config/mongoConnection.js';
import { registerUser } from './data/users.js';

const CUISINE_CONFIG = {
  Chinese: {
    holidayProducts: {
      'Lunar New Year': ['Nian Gao', 'Tang Yuan', 'Fortune Cookies', 'Red Bean Cake'],
      'Mid-Autumn':     ['Mooncake', 'Taro Pastry', 'Snow Skin Mooncake'],
    },
  },
  'Chinese/Cuban': {
    holidayProducts: {
      'Lunar New Year': ['Nian Gao', 'Egg Tarts'],
    },
  },
  'Chinese/Japanese': {
    holidayProducts: {
      'Lunar New Year': ['Mochi', 'Red Bean Buns'],
      'Mid-Autumn':     ['Mooncake'],
    },
  },
  Korean: {
    holidayProducts: {
      'Lunar New Year': ['Tteokguk (rice cake soup)', 'Japchae', 'Hangwa Sweets'],
      'Chuseok':        ['Songpyeon', 'Sikhye (rice punch)'],
    },
  },
  Indian: {
    holidayProducts: {
      Diwali: ['Diwali Sweets Box', 'Ladoo', 'Barfi', 'Chakli'],
      Holi:   ['Gujiya', 'Thandai', 'Puran Poli'],
    },
  },
  Pakistani: {
    holidayProducts: {
      Ramadan: ['Iftar Date Box', 'Samosa Pack', 'Haleem'],
      Eid:     ['Sheer Khurma', 'Vermicelli Pudding'],
    },
  },
  Bangladeshi: {
    holidayProducts: {
      Ramadan:    ['Pitha', 'Jilapi (Jalebi)'],
      Eid:        ['Semai', 'Kacchi Biryani Kit'],
      'Pohela Boishakh': ['Panta Bhat Mix', 'Hilsa Fish (frozen)'],
    },
  },
  'Jewish/Kosher': {
    holidayProducts: {
      Passover:  ['Matzah', 'Matzah Ball Soup Mix', 'Haggadah Set', 'Macaroons'],
      Hanukkah:  ['Latke Mix', 'Sufganiyot (Jelly Donuts)', 'Dreidel Gelt'],
      'Rosh Hashanah': ['Honey Cake', 'Round Challah', 'Apple & Honey Gift Set'],
    },
  },
  'Middle Eastern': {
    holidayProducts: {
      Ramadan: ['Date Gift Box', 'Atayef Batter', 'Kunafa Kit'],
      Eid:     ['Mamoul Cookies', 'Baklava Box'],
    },
  },
  Lebanese: {
    holidayProducts: {
      Ramadan: ['Knafeh', 'Rose Water Pudding', 'Apricot Qamar El-Din'],
      Eid:     ['Mamoul Date Cookies'],
    },
  },
  Egyptian: {
    holidayProducts: {
      Ramadan: ['Konafa', 'Om Ali'],
      Eid:     ['Kahk Cookies', 'Feteer Meshaltet'],
    },
  },
  Moroccan: {
    holidayProducts: {
      Ramadan: ['Chebakia (sesame cookies)', 'Harira Soup Kit', 'Bastilla Mix'],
    },
  },
  Iranian: {
    holidayProducts: {
      Nowruz:  ['Sabzi Polo Mix', 'Reshteh Polo Kit', 'Ajeel Nut Mix'],
      Ramadan: ['Zoolbia & Bamieh (fried sweets)', 'Sholeh Zard (saffron pudding)'],
    },
  },
  Mexican: {
    holidayProducts: {
      'Día de los Muertos': ['Pan de Muerto', 'Marigold Sugar Skull Kit', 'Atole Mix'],
      'Las Posadas':        ['Piñata Candy Bundle', 'Ponche Navideño Mix'],
    },
  },
  Caribbean: {
    holidayProducts: {
      Carnival:  ['Doubles Kit', 'Jerk Seasoning Bundle', 'Sorrel Drink Mix'],
      Christmas: ['Black Cake (Trinidad)', 'Ponche Crema', 'Pasteles Mix'],
    },
  },
  Ethiopian: {
    holidayProducts: {
      'Ethiopian Christmas (Genna)': ['Injera Bundle', 'Berbere Spice Kit', 'Tej (Honey Wine)'],
      'Ethiopian New Year (Enkutatash)': ['Kitfo Spice Pack'],
    },
  },
  Filipino: {
    holidayProducts: {
      Christmas: ['Bibingka Mix', 'Puto Bumbong Kit', 'Lechon Spice Rub'],
      'Fiesta':  ['Halo-Halo Mix', 'Sapin-Sapin Layered Rice Cake'],
    },
  },
};

const CUISINES = Object.keys(CUISINE_CONFIG);

/* ------------------------------------------------------------------ */
/* Fetch from DOHMH Socrata API                                        */
/* ------------------------------------------------------------------ */
const DOHMH_API = 'https://data.cityofnewyork.us/resource/43nn-pn8j.json';

async function fetchRestaurants(cuisine, limit = 10) {
  // DOHMH has one row per inspection visit, not per restaurant.
  // Fetch more rows than we need, then deduplicate by camis so each
  // physical restaurant appears only once.
  const qs = new URLSearchParams({
    $select: 'camis,dba,boro,cuisine_description,latitude,longitude',
    $where:  `cuisine_description='${cuisine}' AND latitude > 40 AND longitude < -70`,
    $limit:  String(limit * 10),   // over-fetch to survive duplicates
    $order:  'camis',
  });
  const url = `${DOHMH_API}?${qs}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DOHMH API error for ${cuisine}: ${res.status}`);
  const rows = await res.json();

  // Keep only the first row seen for each camis (unique restaurant ID).
  const seen = new Set();
  const unique = rows.filter((r) => {
    if (!r.camis || seen.has(r.camis)) return false;
    seen.add(r.camis);
    return true;
  });

  return unique.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Build a business document from a DOHMH row                         */
/* ------------------------------------------------------------------ */
function randomBool(trueWeight = 0.6) {
  return Math.random() < trueWeight;
}

function buildProducts(cuisineKey) {
  const { holidayProducts } = CUISINE_CONFIG[cuisineKey];
  const products = [];

  for (const [tag, items] of Object.entries(holidayProducts)) {
    // Pick 1–2 representative items per holiday
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const pick = shuffled.slice(0, Math.min(2, shuffled.length));

    for (const itemName of pick) {
      products.push({
        _id:         randomUUID(),
        name:        itemName,
        description: '',
        culture:     tag,
        stockReports: [
          {
            userId:     'seed',
            inStock:    randomBool(0.65),
            reportedAt: new Date(Date.now() - Math.random() * 30 * 86400000)
          }
        ]
      });
    }
  }
  return products;
}

function rowToDoc(row, cuisineKey) {
  const lat = parseFloat(row.latitude);
  const lng = parseFloat(row.longitude);
  if (!lat || !lng) return null;

  return {
    _id:          randomUUID(),
    name:         row.dba || 'Unknown Business',
    category:     cuisineKey,
    dataSource:   'dohmh',
    neighborhood: row.boro || 'Unknown',
    address:      null,
    location: {
      type:        'Point',
      coordinates: [lng, lat],
    },
    healthGrade:  null,
    isVerified:   false,
    products:     buildProducts(cuisineKey),
    reviews:      [],
    questions:    [],
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
const seed = async () => {
  const db  = await dbConnection();
  const col = db.collection('businesses');

  await col.deleteMany({});
  console.log('Cleared existing businesses.');

  let total = 0;

  for (const cuisine of CUISINES) {
    process.stdout.write(`  Fetching ${cuisine}... `);
    try {
      const rows = await fetchRestaurants(cuisine);
      const docs = rows.map((r) => rowToDoc(r, cuisine)).filter(Boolean);
      if (docs.length > 0) {
        await col.insertMany(docs);
        console.log(`inserted ${docs.length}`);
        total += docs.length;
      } else {
        console.log('no coords — skipped');
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }

    // Be polite to the public API
    await new Promise((r) => setTimeout(r, 200));
  }

  // Indexes Role 2 also needs to create in the final seed
  await col.createIndex({ location: '2dsphere' });
  await col.createIndex({ 'products.culture': 1 });
  await col.createIndex({ category: 1 });
  await col.createIndex({ neighborhood: 1 });

  console.log(`\nDone. Seeded ${total} real NYC businesses across ${CUISINES.length} cuisines.`);

  // Create admin user (skip if already exists)
  const userCol = db.collection('users');
  const existing = await userCol.findOne({ email: 'admin@nyc.com' });
  if (!existing) {
    await registerUser('Admin', 'NYC', 'admin@nyc.com', 'AdminPassword123!');
    console.log('Created admin user: admin@nyc.com');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  await closeConnection();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
