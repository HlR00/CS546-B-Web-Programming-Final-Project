import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connect, disconnect } from './db.js';
import User from './models/User.js';
import Business from './models/Business.js';

async function main() {
  await connect();

  console.log('[seed] clearing existing data...');
  await User.deleteMany({});
  await Business.deleteMany({});

  console.log('[seed] creating users...');
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@rnf.test',
    hashedPassword: await bcrypt.hash('admin123', 8),
    role: 'admin',
    followedCultures: ['Taiwanese', 'Korean']
  });

  const candice = await User.create({
    firstName: 'Candice',
    lastName: 'Lee',
    email: 'clee@stevens.edu',
    hashedPassword: await bcrypt.hash('password1', 8),
    role: 'user',
    followedCultures: ['Taiwanese', 'Korean']
  });

  const dev = await User.create({
    firstName: 'Dev',
    lastName: 'Shah',
    email: 'dshah@stevens.edu',
    hashedPassword: await bcrypt.hash('password1', 8),
    role: 'user',
    followedCultures: ['Indian']
  });

  console.log('[seed] creating businesses...');
  const taiwaneseDelight = await Business.create({
    name: 'Taiwanese Delight',
    category: 'Taiwanese',
    dataSource: 'dohmh',
    neighborhood: 'Flushing',
    address: '40-52 Main St, Flushing, NY',
    location: { type: 'Point', coordinates: [-73.83, 40.76] },
    healthGrade: 'A',
    isVerified: true,
    products: [
      { name: 'Pineapple Cake', description: 'Traditional Taiwanese pastry', culture: 'Taiwanese' },
      { name: 'Bubble Tea', description: 'Milk tea with tapioca pearls', culture: 'Taiwanese' }
    ]
  });

  const koreanHouse = await Business.create({
    name: 'Kimchi House',
    category: 'Korean',
    dataSource: 'dohmh',
    neighborhood: 'Koreatown',
    address: '32 W 32nd St, New York, NY',
    location: { type: 'Point', coordinates: [-73.9857, 40.7478] },
    healthGrade: 'A',
    isVerified: true,
    products: [
      { name: 'Kimchi Jjigae', description: 'Spicy kimchi stew', culture: 'Korean' },
      { name: 'Bibimbap', description: 'Mixed rice bowl with veggies', culture: 'Korean' }
    ]
  });

  const indianSpice = await Business.create({
    name: 'Spice Bazaar',
    category: 'Indian',
    dataSource: 'sbs',
    neighborhood: 'Jackson Heights',
    address: '73-19 37th Rd, Jackson Heights, NY',
    location: { type: 'Point', coordinates: [-73.8904, 40.7466] },
    healthGrade: 'A',
    isVerified: false,
    products: [
      { name: 'Samosa', description: 'Fried pastry with spiced potato filling', culture: 'Indian' },
      { name: 'Chai Masala', description: 'Spiced milk tea', culture: 'Indian' }
    ]
  });

  taiwaneseDelight.reviews.push({
    userId: candice._id,
    rating: 5,
    comment: 'Very authentic taste!'
  });
  taiwaneseDelight.products[0].stockReports.push({
    userId: candice._id,
    inStock: true
  });
  taiwaneseDelight.questions.push({
    userId: candice._id,
    questionText: 'Do they sell mooncakes year-round?',
    answers: [
      { userId: admin._id, answerText: 'Only during festivals' }
    ]
  });
  await taiwaneseDelight.save();

  candice.mustBuyList = [
    taiwaneseDelight.products[0]._id,
    koreanHouse.products[0]._id
  ];
  await candice.save();

  console.log('\n--- seed done ---');
  console.log('admin   : admin@rnf.test / admin123');
  console.log('user    : clee@stevens.edu / password1');
  console.log('user    : dshah@stevens.edu / password1');
  console.log(`businesses: ${await Business.countDocuments()}`);
  console.log(`users     : ${await User.countDocuments()}`);

  await disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await disconnect().catch(() => {});
  process.exit(1);
});
