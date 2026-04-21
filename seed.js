import { dbConnection, closeConnection } from './config/mongoConnection.js';

const seed = async () => {
  const db = await dbConnection();
  const col = db.collection('businesses');

  await col.deleteMany({});

  await col.insertMany([
    {
      name: 'Fay Da Bakery',
      neighborhood: 'Flushing',
      location: { type: 'Point', coordinates: [-73.8301, 40.7590] },
      products: [
        { itemName: 'Nian Gao',  inStock: true,  lastReported: '2026-01-20', holidayTag: 'Lunar New Year' },
        { itemName: 'Mooncake',  inStock: false, lastReported: '2025-09-15', holidayTag: 'Mid-Autumn' }
      ]
    },
    {
      name: 'Patel Brothers',
      neighborhood: 'Jackson Heights',
      location: { type: 'Point', coordinates: [-73.8918, 40.7470] },
      products: [
        { itemName: 'Diwali Sweets Box', inStock: true,  lastReported: '2025-10-30', holidayTag: 'Diwali' },
        { itemName: 'Holi Colors Set',   inStock: false, lastReported: '2026-03-01', holidayTag: 'Holi' }
      ]
    },
    {
      name: 'Sahadi Fine Foods',
      neighborhood: 'Atlantic Avenue',
      location: { type: 'Point', coordinates: [-73.9897, 40.6883] },
      products: [
        { itemName: 'Mamoul Cookies',  inStock: true,  lastReported: '2026-03-20', holidayTag: 'Ramadan' },
        { itemName: 'Date Gift Box',   inStock: true,  lastReported: '2026-03-18', holidayTag: 'Ramadan' }
      ]
    },
    {
      name: 'Katz\'s Delicatessen',
      neighborhood: 'Lower East Side',
      location: { type: 'Point', coordinates: [-73.9873, 40.7223] },
      products: [
        { itemName: 'Matzah Ball Soup Kit', inStock: true,  lastReported: '2026-04-10', holidayTag: 'Passover' },
        { itemName: 'Latke Mix',            inStock: false, lastReported: '2025-12-10', holidayTag: 'Hanukkah' }
      ]
    },
    {
      name: 'Hong Kong Supermarket',
      neighborhood: 'Flushing',
      location: { type: 'Point', coordinates: [-73.8275, 40.7580] },
      products: [
        { itemName: 'Tang Yuan',       inStock: true,  lastReported: '2026-01-22', holidayTag: 'Lunar New Year' },
        { itemName: 'Dragon Boat Rice Dumpling', inStock: false, lastReported: '2025-06-10', holidayTag: 'Dragon Boat' }
      ]
    }
  ]);

  await col.createIndex({ location: '2dsphere' });
  await col.createIndex({ 'products.holidayTag': 1 });

  console.log('Seeded 5 businesses and created indexes.');
  await closeConnection();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
