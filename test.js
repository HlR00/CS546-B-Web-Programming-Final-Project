import bcrypt from 'bcryptjs';
import { connect, disconnect } from './db.js';
import { buildApp } from './app.js';
import User from './models/User.js';
import Business from './models/Business.js';

let server;
let baseUrl;

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.log('  ✗', msg);
  }
}

function eq(a, b, msg) {
  const same = JSON.stringify(a) === JSON.stringify(b);
  if (!same) console.log(`    expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);
  ok(same, msg);
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(baseUrl + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { status: res.status, data };
}

async function setup() {
  await connect();
  await User.deleteMany({});
  await Business.deleteMany({});

  const app = buildApp();
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log('[test] server listening on', baseUrl);
      resolve();
    });
  });
}

async function teardown() {
  await new Promise((r) => server.close(r));
  await disconnect();
}

async function run() {
  console.log('\n== auth ==');

  const adminHashed = await bcrypt.hash('admin123', 8);
  const adminDoc = await User.create({
    firstName: 'Admin', lastName: 'User',
    email: 'admin@rnf.test', hashedPassword: adminHashed, role: 'admin'
  });

  let r = await req('POST', '/api/v1/auth/register', {
    body: {
      firstName: 'Candice', lastName: 'Lee',
      email: 'clee@stevens.edu', password: 'password1',
      followedCultures: ['Taiwanese']
    }
  });
  eq(r.status, 201, 'register returns 201');
  ok(r.data.token, 'register returns a token');
  ok(!r.data.user.hashedPassword, 'register response strips hashedPassword');
  const userToken = r.data.token;
  const userId = r.data.user._id;

  r = await req('POST', '/api/v1/auth/register', {
    body: { firstName: 'x', lastName: 'y', email: 'clee@stevens.edu', password: 'password1' }
  });
  eq(r.status, 409, 'duplicate email -> 409');

  r = await req('POST', '/api/v1/auth/register', {
    body: { firstName: 'x', lastName: 'y', email: 'short@test.com', password: '123' }
  });
  eq(r.status, 400, 'short password -> 400');

  r = await req('POST', '/api/v1/auth/login', {
    body: { email: 'clee@stevens.edu', password: 'password1' }
  });
  eq(r.status, 200, 'login ok');
  ok(r.data.token, 'login returns token');

  r = await req('POST', '/api/v1/auth/login', {
    body: { email: 'clee@stevens.edu', password: 'wrong' }
  });
  eq(r.status, 401, 'bad password -> 401');

  r = await req('POST', '/api/v1/auth/login', {
    body: { email: 'admin@rnf.test', password: 'admin123' }
  });
  eq(r.status, 200, 'admin login ok');
  const adminToken = r.data.token;

  r = await req('GET', '/api/v1/auth/me', { token: userToken });
  eq(r.status, 200, 'me with token -> 200');
  eq(r.data.user.email, 'clee@stevens.edu', 'me returns correct user');

  r = await req('GET', '/api/v1/auth/me');
  eq(r.status, 401, 'me without token -> 401');


  console.log('\n== businesses ==');

  r = await req('POST', '/api/v1/businesses', {
    token: userToken,
    body: { name: 'should fail' }
  });
  eq(r.status, 403, 'non-admin create -> 403');

  r = await req('POST', '/api/v1/businesses', {
    token: adminToken,
    body: {
      name: 'Taiwanese Delight',
      category: 'Taiwanese',
      dataSource: 'dohmh',
      neighborhood: 'Flushing',
      address: '40-52 Main St',
      location: { type: 'Point', coordinates: [-73.83, 40.76] },
      healthGrade: 'A',
      isVerified: true
    }
  });
  eq(r.status, 201, 'admin creates business -> 201');
  const bizA = r.data.business._id;

  r = await req('POST', '/api/v1/businesses', {
    token: adminToken,
    body: {
      name: 'Kimchi House',
      category: 'Korean',
      neighborhood: 'Koreatown',
      location: { type: 'Point', coordinates: [-73.9857, 40.7478] },
      healthGrade: 'A'
    }
  });
  const bizB = r.data.business._id;

  r = await req('POST', '/api/v1/businesses', {
    token: adminToken,
    body: {
      name: 'Spice Bazaar',
      category: 'Indian',
      neighborhood: 'Jackson Heights',
      location: { type: 'Point', coordinates: [-73.8904, 40.7466] }
    }
  });
  const bizC = r.data.business._id;

  r = await req('GET', '/api/v1/businesses');
  eq(r.status, 200, 'list businesses ok');
  eq(r.data.count, 3, 'three businesses in list');

  r = await req('GET', '/api/v1/businesses?category=Korean');
  eq(r.data.count, 1, 'filter by category');
  eq(r.data.businesses[0]._id, bizB, 'right business returned');

  r = await req('GET', '/api/v1/businesses?neighborhood=Flushing');
  eq(r.data.count, 1, 'filter by neighborhood');

  r = await req('GET', '/api/v1/businesses?q=kim');
  eq(r.data.count, 1, 'text search "kim" -> 1');

  r = await req('GET', '/api/v1/businesses?near=-73.9857,40.7478&radius=5000');
  ok(r.data.count >= 1, 'geo near returns at least the Korean one');

  r = await req('GET', `/api/v1/businesses/${bizA}`);
  eq(r.status, 200, 'get one business');
  eq(r.data.business.name, 'Taiwanese Delight', 'right business fetched');

  r = await req('PUT', `/api/v1/businesses/${bizA}`, {
    token: adminToken,
    body: { healthGrade: 'B' }
  });
  eq(r.data.business.healthGrade, 'B', 'update healthGrade');

  r = await req('PUT', `/api/v1/businesses/${bizA}`, {
    token: userToken,
    body: { healthGrade: 'C' }
  });
  eq(r.status, 403, 'non-admin update -> 403');


  console.log('\n== products ==');

  r = await req('POST', `/api/v1/businesses/${bizA}/products`, {
    token: adminToken,
    body: { name: 'Pineapple Cake', description: 'Taiwanese pastry', culture: 'Taiwanese' }
  });
  eq(r.status, 201, 'product created');
  const prod1 = r.data.product._id;

  r = await req('POST', `/api/v1/businesses/${bizA}/products`, {
    token: adminToken,
    body: { name: 'Bubble Tea', culture: 'Taiwanese' }
  });
  const prod2 = r.data.product._id;

  r = await req('POST', `/api/v1/businesses/${bizB}/products`, {
    token: adminToken,
    body: { name: 'Kimchi Jjigae', culture: 'Korean' }
  });
  const prod3 = r.data.product._id;

  r = await req('PUT', `/api/v1/businesses/${bizA}/products/${prod1}`, {
    token: adminToken,
    body: { description: 'Flaky pineapple pastry' }
  });
  eq(r.data.product.description, 'Flaky pineapple pastry', 'product description updated');

  r = await req('DELETE', `/api/v1/businesses/${bizA}/products/${prod2}`, {
    token: userToken
  });
  eq(r.status, 403, 'non-admin delete product -> 403');

  r = await req('POST', `/api/v1/businesses/${bizA}/products/${prod1}/stock-report`, {
    token: userToken,
    body: { inStock: true }
  });
  eq(r.status, 201, 'stock report created');

  r = await req('POST', `/api/v1/businesses/${bizA}/products/${prod1}/stock-report`, {
    token: userToken,
    body: { inStock: false }
  });
  eq(r.status, 201, 'second stock report created');

  r = await req('GET', `/api/v1/businesses/${bizA}/products/${prod1}/stock`);
  eq(r.data.reports, 2, 'stock summary counts both reports');
  eq(r.data.inStock, false, 'most recent report wins');

  r = await req('POST', `/api/v1/businesses/${bizA}/products/${prod1}/stock-report`, {
    token: userToken,
    body: { inStock: 'yes' }
  });
  eq(r.status, 400, 'bad inStock -> 400');


  console.log('\n== reviews ==');

  r = await req('POST', `/api/v1/businesses/${bizA}/reviews`, {
    token: userToken,
    body: { rating: 5, comment: 'Very authentic taste!' }
  });
  eq(r.status, 201, 'review created');
  const reviewId = r.data.review._id;

  r = await req('POST', `/api/v1/businesses/${bizA}/reviews`, {
    token: userToken,
    body: { rating: 4, comment: 'Loved it' }
  });
  eq(r.status, 201, 'second review created');

  r = await req('POST', `/api/v1/businesses/${bizA}/reviews`, {
    token: userToken,
    body: { rating: 7 }
  });
  eq(r.status, 400, 'rating 7 -> 400');

  r = await req('GET', `/api/v1/businesses/${bizA}/reviews/summary`);
  eq(r.data.count, 2, 'summary counts 2');
  eq(r.data.average, 4.5, 'summary avg = 4.5');

  r = await req('DELETE', `/api/v1/businesses/${bizA}/reviews/${reviewId}`, {
    token: userToken
  });
  eq(r.status, 200, 'user deletes own review');

  r = await req('POST', `/api/v1/businesses/${bizA}/reviews`, {
    token: adminToken,
    body: { rating: 3, comment: 'admin review' }
  });
  const adminReview = r.data.review._id;

  r = await req('DELETE', `/api/v1/businesses/${bizA}/reviews/${adminReview}`, {
    token: userToken
  });
  eq(r.status, 403, 'user cannot delete others review');


  console.log('\n== questions & answers ==');

  r = await req('POST', `/api/v1/businesses/${bizA}/questions`, {
    token: userToken,
    body: { questionText: 'Do they sell mooncakes year-round?' }
  });
  eq(r.status, 201, 'question posted');
  const qId = r.data.question._id;

  r = await req('POST', `/api/v1/businesses/${bizA}/questions/${qId}/answers`, {
    token: adminToken,
    body: { answerText: 'Only during festivals' }
  });
  eq(r.status, 201, 'answer posted');

  r = await req('POST', `/api/v1/businesses/${bizA}/questions`, {
    token: userToken,
    body: { questionText: '   ' }
  });
  eq(r.status, 400, 'empty question -> 400');


  console.log('\n== user profile, follows, must-buy ==');

  r = await req('POST', `/api/v1/users/${userId}/follow`, {
    token: userToken,
    body: { culture: 'Korean' }
  });
  eq(r.status, 200, 'follow culture');
  ok(r.data.user.followedCultures.includes('Korean'), 'Korean is followed');

  r = await req('POST', `/api/v1/users/${userId}/follow`, {
    token: userToken,
    body: { culture: 'Korean' }
  });
  eq(
    r.data.user.followedCultures.filter(c => c === 'Korean').length,
    1,
    'follow dedupes'
  );

  r = await req('DELETE', `/api/v1/users/${userId}/follow/Taiwanese`, { token: userToken });
  ok(!r.data.user.followedCultures.includes('Taiwanese'), 'unfollow works');

  await req('POST', `/api/v1/users/${userId}/follow`, {
    token: userToken,
    body: { culture: 'Taiwanese' }
  });

  r = await req('POST', `/api/v1/users/${userId}/must-buy/${prod1}`, { token: userToken });
  eq(r.status, 200, 'must-buy add');
  ok(r.data.user.mustBuyList.includes(prod1), 'mustBuyList has prod1');

  r = await req('POST', `/api/v1/users/${userId}/must-buy/${prod3}`, { token: userToken });
  ok(r.data.user.mustBuyList.includes(prod3), 'mustBuyList has prod3');

  r = await req('POST', `/api/v1/users/${userId}/must-buy/nope-does-not-exist`, {
    token: userToken
  });
  eq(r.status, 404, 'bogus must-buy product -> 404');

  r = await req('POST', `/api/v1/users/${userId}/must-buy/${prod2}`, { token: adminToken });
  eq(r.status, 200, 'admin CAN edit other user (by policy)');

  r = await req('GET', `/api/v1/users/${userId}/dashboard`, { token: userToken });
  eq(r.status, 200, 'dashboard ok');
  ok(r.data.cultureBusinesses.length >= 2, 'dashboard returns biz for followed cultures');
  ok(r.data.mustBuyProducts.length >= 2, 'dashboard returns must-buy products');

  r = await req('DELETE', `/api/v1/users/${userId}/must-buy/${prod3}`, { token: userToken });
  ok(!r.data.user.mustBuyList.includes(prod3), 'must-buy removal works');


  console.log('\n== 404 / auth edge cases ==');

  r = await req('GET', '/api/v1/businesses/nope-does-not-exist');
  eq(r.status, 404, 'unknown business -> 404');

  r = await req('GET', '/api/v1/nothing-here');
  eq(r.status, 404, 'unknown path -> 404');

  r = await req('GET', '/api/v1/auth/me', { token: 'junk.token.value' });
  eq(r.status, 401, 'junk token -> 401');

  r = await req('DELETE', `/api/v1/businesses/${bizC}`, { token: adminToken });
  eq(r.status, 200, 'admin deletes business');

  r = await req('GET', `/api/v1/businesses/${bizC}`);
  eq(r.status, 404, 'deleted business -> 404');
}

(async () => {
  try {
    await setup();
    await run();
  } catch (err) {
    console.error('TEST RUNNER CRASHED:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log(`\n== results ==`);
  console.log(`passed: ${passed}`);
  console.log(`failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
