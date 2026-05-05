import mongoose from 'mongoose';

const DB_NAME = 'nyc_roots_and_flavors';

function buildUri() {
  const raw = process.env.MONGO_URI || 'mongodb://localhost:27017/';
  if (raw.endsWith('/') || !raw.includes('/', raw.indexOf('://') + 3)) {
    return raw.endsWith('/') ? raw + DB_NAME : raw + '/' + DB_NAME;
  }
  return raw;
}

export async function connect() {
  const uri = buildUri();
  console.log('[mongoose] connecting to', uri);
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnect() {
  await mongoose.disconnect();
}
