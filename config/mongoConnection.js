import { MongoClient } from 'mongodb';

const DB_NAME = 'nyc_roots_and_flavors';
const URI     = process.env.MONGO_URI || 'mongodb://localhost:27017/';

let _db = null;
let _client = null;

export const dbConnection = async () => {
  if (_db) return _db;
  _client = new MongoClient(URI);
  await _client.connect();
  _db = _client.db(DB_NAME);
  return _db;
};

export const closeConnection = async () => {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
};
